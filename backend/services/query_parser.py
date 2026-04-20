import re
from typing import Optional

# Order: longest/most-specific first so "North Coast" matches before "Coast"
KNOWN_CITIES = [
    "north coast",
    "red sea",
    "south sinai",
    "al daqahlya",
    "kafr el sheikh",
    "alexandria",
    "qalyubia",
    "sharqia",
    "matrouh",
    "aswan",
    "asyut",
    "luxor",
    "demyat",
    "cairo",
    "giza",
    "suez",
]

# Longer/more-specific terms must come first.
NEIGHBORHOOD_MAP = {
    # These allow natural language like "near the pyramids" to resolve to Giza
    "near the pyramids": {"city": "Giza",  "neighborhood": None},
    "giza pyramids":     {"city": "Giza",  "neighborhood": None},
    "near pyramids":     {"city": "Giza",  "neighborhood": None},
    "the pyramids":      {"city": "Giza",  "neighborhood": None},
    "pyramids area":     {"city": "Giza",  "neighborhood": None},
    "pyramids":          {"city": "Giza",  "neighborhood": None},
    "haram area":        {"city": "Giza",  "neighborhood": "Haram"},
    "haram":             {"city": "Giza",  "neighborhood": "Haram"},
    "sphinx":            {"city": "Giza",  "neighborhood": None},
    "mohandessin":       {"city": "Giza",  "neighborhood": "Mohandessin"},
    "downtown cairo":    {"city": "Cairo", "neighborhood": "Downtown"},
    "islamic cairo":     {"city": "Cairo", "neighborhood": "Islamic Cairo"},
    "city centre":       {"city": "Cairo", "neighborhood": "Downtown"},
    "nile corniche":     {"city": "Cairo", "neighborhood": None},

    "fifth settlement":  {"city": "Cairo", "neighborhood": "New Cairo"},
    "5th settlement":    {"city": "Cairo", "neighborhood": "New Cairo"},
    "new capital":       {"city": "Cairo", "neighborhood": "New Capital"},
    "new cairo":         {"city": "Cairo", "neighborhood": "New Cairo"},
    "nasr city":         {"city": "Cairo", "neighborhood": "Nasr City"},
    "el shorouk":        {"city": "Cairo", "neighborhood": "Shorouk"},
    "el obour":          {"city": "Cairo", "neighborhood": "Obour"},
    "madinaty":          {"city": "Cairo", "neighborhood": "Madinaty"},
    "heliopolis":        {"city": "Cairo", "neighborhood": "Heliopolis"},
    "zamalek":           {"city": "Cairo", "neighborhood": "Zamalek"},
    "shorouk":           {"city": "Cairo", "neighborhood": "Shorouk"},
    "obour":             {"city": "Cairo", "neighborhood": "Obour"},
    "maadi":             {"city": "Cairo", "neighborhood": "Maadi"},
    "rehab":             {"city": "Cairo", "neighborhood": "Rehab"},

    "sheikh zayed":      {"city": "Giza",  "neighborhood": "Sheikh Zayed"},
    "6th october":       {"city": "Giza",  "neighborhood": "6th October"},
    "6 october":         {"city": "Giza",  "neighborhood": "6th October"},
    "october":           {"city": "Giza",  "neighborhood": "6th October"},
    "zayed":             {"city": "Giza",  "neighborhood": "Sheikh Zayed"},
    "dokki":             {"city": "Giza",  "neighborhood": "Dokki"},

    "el gouna":          {"city": "Red Sea",     "neighborhood": "Al Gouna"},
    "al gouna":          {"city": "Red Sea",     "neighborhood": "Al Gouna"},
    "soma bay":          {"city": "Red Sea",     "neighborhood": "Soma Bay"},
    "hurghada":          {"city": "Red Sea",     "neighborhood": "Hurghada"},
    "gouna":             {"city": "Red Sea",     "neighborhood": "Al Gouna"},
    "ras el hekma":      {"city": "North Coast", "neighborhood": "Ras El Hekma"},
    "ain sokhna":        {"city": "Suez",        "neighborhood": "Ain Sokhna"},
    "marsa matruh":      {"city": "Matrouh",     "neighborhood": None},
    "sokhna":            {"city": "Suez",        "neighborhood": "Ain Sokhna"},
    "sahel":             {"city": "North Coast", "neighborhood": None},
}

KNOWN_TYPES = [
    "hotel apartment",
    "whole building",
    "twin house",
    "townhouse",
    "penthouse",
    "apartment",
    "full floor",
    "duplex",
    "chalet",
    "studio",
    "palace",
    "cabin",
    "ivilla",
    "villa",
    "roof",
]

WORD_TO_NUM = {
    "one": 1, "two": 2, "three": 3, "four": 4,
    "five": 5, "six": 6, "seven": 7, "eight": 8,
}

BEDROOM_PATTERNS = [
    r'(\d+)\s*-?\s*bed(?:room)?s?',
    r'(\d+)\s*br\b',
    r'(one|two|three|four|five|six|seven|eight)\s*-?\s*bed(?:room)?s?',
]

FAMILY_KEYWORDS = ['family', 'kids', 'children', 'spacious home', 'growing family']


def parse_query(
    query: str,
    explicit_city: Optional[str] = None,
    explicit_type: Optional[str] = None,
    explicit_bedrooms: Optional[int] = None,
) -> dict:
    """
    Extract city, neighborhood, property type, bedroom count, and a
    clean query from a natural language search string.

    Explicit UI filters (from chips/dropdowns) always win over parsed values.

    Includes:
    - Landmark resolution: "near the pyramids" → city=Giza
    - Family inference: "family home" → bedrooms=3 (minimum)
    - Clean query stripping for better ChromaDB embedding

    Returns dict with keys:
        city          — exact city string for ChromaDB filter
        neighborhood  — partial string for PostgreSQL ILIKE filter
        property_type — exact type string for PostgreSQL filter
        bedrooms      — int for PostgreSQL >= filter
        clean_query   — query with location/type stripped for cleaner embedding
    """
    q = query.lower().strip()

    result = {
        "city":          explicit_city,
        "neighborhood":  None,
        "property_type": explicit_type,
        "bedrooms":      explicit_bedrooms,
        "clean_query":   query,
    }

    # Step 1: Neighborhood map 
    
    if not explicit_city:
        for term, mapping in NEIGHBORHOOD_MAP.items():
            if term in q:
                result["city"]         = mapping["city"]
                result["neighborhood"] = mapping["neighborhood"]
                q = q.replace(term, "").strip()
                break  # take first (longest) match

       
        if not result["city"]:
            for city in KNOWN_CITIES:
                if city in q:
                    result["city"] = city.title()
                    q = q.replace(city, "").strip()
                    break

    if not explicit_type:
        for ptype in KNOWN_TYPES:
            if ptype in q:
                result["property_type"] = ptype.capitalize()
                q = q.replace(ptype, "").strip()
                break

    if not explicit_bedrooms:
        for pattern in BEDROOM_PATTERNS:
            match = re.search(pattern, q, re.IGNORECASE)
            if match:
                raw = match.group(1)
                num = WORD_TO_NUM.get(raw.lower()) if not raw.isdigit() else int(raw)
                if num:
                    result["bedrooms"] = num
                q = (q[:match.start()] + q[match.end():]).strip()
                break

        
        if not result["bedrooms"]:
            if any(kw in q for kw in FAMILY_KEYWORDS):
                result["bedrooms"] = 3
                print(f"👨‍👩‍👧 Family keyword detected — inferred bedrooms=3")

    clean = re.sub(r'\s{2,}', ' ', q).strip(" ,.-")
    result["clean_query"] = clean if clean else query

    return result