from fastapi import APIRouter, HTTPException, Depends
from database.postgres import get_db_cursor
from routes.auth_router import get_current_user
from services.openai_service import analyze_portfolio

router = APIRouter(prefix="/favorites", tags=["Favorites"])

# ─── Helper ───────────────────────────────────────────────────────────────────

def get_full_property(property_id: int):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM properties WHERE property_id = %s", (property_id,))
        return cursor.fetchone()

def property_to_dict(p) -> dict:
    return {
        "property_id":   p["property_id"],
        "title":         p.get("title", ""),
        "price":         p.get("price", 0),
        "area":          p.get("area", 0),
        "bedrooms":      p.get("bedrooms", 0),
        "bathrooms":     p.get("bathrooms", 0),
        "city":          p.get("city", ""),
        "neighborhood":  p.get("neighborhood", ""),
        "property_type": p.get("property_type", ""),
        "type":          p.get("property_type", ""),
        "description":   p.get("description", ""),
        "price_per_sqm": p.get("price_per_sqm", 0),
        "size":          p.get("area", 0),
    }

# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/")
async def get_favorites(current_user = Depends(get_current_user)):
    """Get all saved properties for the current user."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT p.*, uf.saved_at
            FROM user_favorites uf
            JOIN properties p ON p.property_id = uf.property_id
            WHERE uf.user_id = %s
            ORDER BY uf.saved_at DESC
        """, (current_user["id"],))
        rows = cursor.fetchall()

    favorites = []
    for row in rows:
        prop = property_to_dict(row)
        prop["saved_at"] = str(row["saved_at"])
        favorites.append(prop)

    return { "count": len(favorites), "favorites": favorites }


@router.post("/{property_id}")
async def add_favorite(
    property_id: int,
    current_user = Depends(get_current_user)
):
    """Save a property to favorites."""
    property = get_full_property(property_id)
    if not property:
        raise HTTPException(status_code=404, detail="Property not found")

    try:
        with get_db_cursor() as cursor:
            cursor.execute("""
                INSERT INTO user_favorites (user_id, property_id)
                VALUES (%s, %s)
            """, (current_user["id"], property_id))

        print(f"❤️  User {current_user['id']} saved property {property_id}")
        return { "message": "Property saved to favorites", "property_id": property_id }

    except Exception as e:
        raise HTTPException(status_code=400, detail="Property already in favorites")


@router.delete("/{property_id}")
async def remove_favorite(
    property_id: int,
    current_user = Depends(get_current_user)
):
    """Remove a property from favorites."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            DELETE FROM user_favorites
            WHERE user_id = %s AND property_id = %s
        """, (current_user["id"], property_id))

    print(f"🗑️  User {current_user['id']} removed property {property_id}")
    return { "message": "Property removed from favorites", "property_id": property_id }


@router.get("/check/{property_id}")
async def check_favorite(
    property_id: int,
    current_user = Depends(get_current_user)
):
    """Check if a property is in the user's favorites."""
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT id FROM user_favorites
            WHERE user_id = %s AND property_id = %s
        """, (current_user["id"], property_id))
        row = cursor.fetchone()

    return { "is_favorite": row is not None }


@router.get("/analysis")
async def get_portfolio_analysis(current_user = Depends(get_current_user)):
    """
    AI-powered portfolio analysis using GPT-4o-mini.
    Calculates financial metrics from real Egyptian market data
    and generates a personalized insight for the investor.
    """
    # Get user's saved properties
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT p.*
            FROM user_favorites uf
            JOIN properties p ON p.property_id = uf.property_id
            WHERE uf.user_id = %s
            ORDER BY uf.saved_at DESC
        """, (current_user["id"],))
        rows = cursor.fetchall()

    properties = [property_to_dict(row) for row in rows]

    print(f"🧠 Analyzing portfolio for user {current_user['id']} — {len(properties)} properties")

    result = analyze_portfolio(properties, dict(current_user))

    return result