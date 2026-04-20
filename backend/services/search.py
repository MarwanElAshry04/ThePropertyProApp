from typing import List, Dict, Any, Optional
from database.chroma import get_chroma_collection
from database.postgres import get_db_cursor
from services.embeddings import generate_embedding
from services.query_parser import parse_query as rule_based_parse
from services.openai_service import parse_query as gpt_parse
import time
import re

# Keywords that suggest a price constraint is in the query
PRICE_KEYWORDS = {
    'million', 'egp', 'price', 'budget', 'under', 'above', 'between',
    'cheap', 'afford', 'luxury', 'expensive',
}


def _query_has_price(query: str) -> bool:
    """Return True if the query likely contains a price constraint."""
    return any(kw in query.lower() for kw in PRICE_KEYWORDS)


def _normalise_scores(metadatas: list, distances: list) -> dict:
    """
    Normalise ChromaDB distances to [0.5, 1.0] similarity scores.
    ChromaDB cosine distances range [0, 2] so raw 1-dist is unreliable.
    Normalising within the result set gives meaningful relative scores.
    """
    if not distances:
        return {}
    min_dist   = min(distances)
    max_dist   = max(distances)
    dist_range = max_dist - min_dist if max_dist != min_dist else 1.0
    return {
        int(m['property_id']): round(1.0 - 0.5 * (d - min_dist) / dist_range, 3)
        for m, d in zip(metadatas, distances)
    }


def search_properties(
    query: str,
    min_price: int = 0,
    max_price: int = 100_000_000,
    city: Optional[str] = None,
    neighborhood: Optional[str] = None,
    bedrooms: Optional[int] = None,
    bathrooms: Optional[int] = None,
    property_type: Optional[str] = None,
    top_k: int = 20,
    min_size: Optional[int] = None,
    max_size: Optional[int] = None,
    has_maid_room: Optional[bool] = None,
) -> tuple[List[Dict[str, Any]], float]:
    """
    Hybrid search: dual-parser + ChromaDB semantic + PostgreSQL filters.

    Two search strategies:

    NEIGHBOURHOOD STRATEGY (when neighbourhood extracted):
      PostgreSQL first — fetches ALL matching neighbourhood properties.
      ChromaDB then ranks them by semantic similarity.
      Guarantees all neighbourhood matches found — ChromaDB embeddings encode
      property descriptions, not location names, so semantic search alone
      cannot reliably surface a specific neighbourhood.

    STANDARD STRATEGY (city-level or no location):
      ChromaDB first — semantic search with optional city filter.
      PostgreSQL then applies hard constraints.

    Parser strategy:
      Rule-based (always): city/neighbourhood/type/bedrooms via NEIGHBORHOOD_MAP.
        Includes landmark resolution (pyramids→Giza) and family inference (→3 beds).
      GPT-4o-mini (conditional): price extraction only, triggered by price keywords.
      Explicit UI filters always override both parsers.
    """
    start_time = time.time()

    rule_parsed = rule_based_parse(query)

    effective_city          = city          or rule_parsed.get("city")
    effective_neighborhood  = neighborhood  or rule_parsed.get("neighborhood")
    effective_property_type = property_type or rule_parsed.get("property_type")
    effective_bedrooms      = bedrooms      or rule_parsed.get("bedrooms")
    clean_query             = rule_parsed.get("clean_query") or query

    clean_stripped = re.sub(r'[^a-zA-Z0-9\u0600-\u06FF]', '', clean_query)
    if len(clean_stripped) < 4:
        clean_query = query

    # GPT only for price extraction — triggered by price keywords only
    effective_min_price = min_price if (min_price and min_price > 0) else None
    effective_max_price = max_price if (max_price and max_price < 100_000_000) else None

    if not effective_min_price and not effective_max_price and _query_has_price(query):
        try:
            gpt_parsed = gpt_parse(query)
            if gpt_parsed.get("min_price") and gpt_parsed["min_price"] > 0:
                effective_min_price = gpt_parsed["min_price"]
            if gpt_parsed.get("max_price") and gpt_parsed["max_price"] < 100_000_000:
                effective_max_price = gpt_parsed["max_price"]
            print(f"💡 GPT price: min={effective_min_price}, max={effective_max_price}")
        except Exception as e:
            print(f"⚠️  GPT price extraction failed: {e}")

    print(f"🔍 Original   : '{query}'")
    print(f"✂️  Clean      : '{clean_query}'")
    print(f"📍 City        : {effective_city}")
    print(f"🏘️  Neighborhood: {effective_neighborhood}")
    print(f"🏠 Type        : {effective_property_type}")
    print(f"🛏  Bedrooms    : {effective_bedrooms}")
    print(f"💰 Price range : {effective_min_price} – {effective_max_price}")

    query_embedding = generate_embedding(clean_query)


    if effective_neighborhood:
        pg_conditions = ["neighborhood ILIKE %s"]
        pg_params     = [f"%{effective_neighborhood}%"]

        if effective_property_type:
            pg_conditions.append("LOWER(type) LIKE LOWER(%s)")
            pg_params.append(f"%{effective_property_type}%")
        if effective_bedrooms:
            pg_conditions.append("bedrooms >= %s")
            pg_params.append(effective_bedrooms)
        if bathrooms:
            pg_conditions.append("bathrooms >= %s")
            pg_params.append(bathrooms)
        if effective_min_price:
            pg_conditions.append("price >= %s")
            pg_params.append(effective_min_price)
        if effective_max_price:
            pg_conditions.append("price <= %s")
            pg_params.append(effective_max_price)
        if min_size:
            pg_conditions.append("size >= %s")
            pg_params.append(min_size)
        if max_size:
            pg_conditions.append("size <= %s")
            pg_params.append(max_size)
        if has_maid_room is not None:
            pg_conditions.append("has_maid_room = %s")
            pg_params.append(has_maid_room)

        with get_db_cursor() as cursor:
            cursor.execute(
                f"SELECT * FROM properties WHERE {' AND '.join(pg_conditions)}",
                pg_params
            )
            pg_rows = cursor.fetchall()

        print(f"  Neighbourhood: PostgreSQL found {len(pg_rows)} matches")

        if not pg_rows:
            return [], (time.time() - start_time) * 1000

        pg_ids = [row['property_id'] for row in pg_rows]
        pg_map = {row['property_id']: dict(row) for row in pg_rows}

        if len(pg_ids) > top_k:
            collection = get_chroma_collection()
            chroma_results = collection.query(
                query_embeddings=[query_embedding],
                n_results=min(len(pg_ids), 500),
                where={"property_id": {"$in": [int(pid) for pid in pg_ids]}} if len(pg_ids) <= 500 else None,
                include=['metadatas', 'distances']
            )
            similarity_scores = _normalise_scores(
                chroma_results['metadatas'][0],
                chroma_results['distances'][0]
            )
            ranked_ids = [
                int(m['property_id']) for m in chroma_results['metadatas'][0]
                if int(m['property_id']) in set(pg_ids)
            ]
            remaining = [pid for pid in pg_ids if pid not in set(ranked_ids)]
            final_ids = (ranked_ids + remaining)[:top_k]
        else:
            similarity_scores = {pid: 0.75 for pid in pg_ids}
            final_ids = pg_ids[:top_k]

        results = []
        for pid in final_ids:
            if pid in pg_map:
                d = pg_map[pid]
                d['similarity_score'] = similarity_scores.get(pid, 0.75)
                results.append(d)

        search_time_ms = (time.time() - start_time) * 1000
        print(f" Returned {len(results)} neighbourhood results")
        print(f" {search_time_ms:.0f}ms")
        return results, search_time_ms

    # ── STANDARD STRATEGY: ChromaDB first, PostgreSQL filters ────────────────
    chroma_where = {}
    if effective_city:
        chroma_where["city"] = effective_city

    print(f" ChromaDB filter: {chroma_where or 'none'}")

    collection = get_chroma_collection()
    # Fetch a larger candidate pool when a city filter is active so that
    # downstream PostgreSQL filters (bedrooms, type, price) have enough to work with.
    n_results  = min(top_k * 10 if effective_city else top_k * 5, 500)

    chroma_results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results,
        where=chroma_where if chroma_where else None,
        include=['metadatas', 'distances']
    )

    if not chroma_results['ids'][0]:
        print(" No results from ChromaDB")
        return [], (time.time() - start_time) * 1000

    property_ids      = [int(m['property_id']) for m in chroma_results['metadatas'][0]]
    similarity_scores = _normalise_scores(
        chroma_results['metadatas'][0],
        chroma_results['distances'][0]
    )

    print(f" ChromaDB returned {len(property_ids)} candidates")

    # ── Step 4: PostgreSQL hard filters ──────────────────────────────────────
    sql_conditions = ["property_id = ANY(%s)"]
    sql_params     = [property_ids]

    if effective_min_price:
        sql_conditions.append("price >= %s")
        sql_params.append(effective_min_price)
    if effective_max_price:
        sql_conditions.append("price <= %s")
        sql_params.append(effective_max_price)
    if effective_bedrooms:
        sql_conditions.append("bedrooms >= %s")
        sql_params.append(effective_bedrooms)
    if bathrooms:
        sql_conditions.append("bathrooms >= %s")
        sql_params.append(bathrooms)
    if effective_property_type:
        sql_conditions.append("LOWER(type) LIKE LOWER(%s)")
        sql_params.append(f"%{effective_property_type}%")
    if min_size:
        sql_conditions.append("size >= %s")
        sql_params.append(min_size)
    if max_size:
        sql_conditions.append("size <= %s")
        sql_params.append(max_size)
    if has_maid_room is not None:
        sql_conditions.append("has_maid_room = %s")
        sql_params.append(has_maid_room)

    print(f"  PostgreSQL: {len(sql_conditions) - 1} active filters")

    with get_db_cursor() as cursor:
        sql = f"""
            SELECT * FROM properties
            WHERE {' AND '.join(sql_conditions)}
            ORDER BY ARRAY_POSITION(%s::int[], property_id)
            LIMIT %s
        """
        sql_params.extend([property_ids, top_k])
        cursor.execute(sql, sql_params)
        rows = cursor.fetchall()

    print(f" PostgreSQL returned {len(rows)} properties")

    results = []
    for row in rows:
        d = dict(row)
        d['similarity_score'] = similarity_scores.get(d['property_id'], 0.75)
        results.append(d)

    results.sort(key=lambda x: x['similarity_score'], reverse=True)

    search_time_ms = (time.time() - start_time) * 1000
    print(f"⏱  {search_time_ms:.0f}ms")

    return results, search_time_ms