from openai import OpenAI
from config import settings
import json
import re

client = OpenAI(api_key=settings.OPENAI_API_KEY)

# ─── Egyptian Real Estate Rental Yield Data ───────────────────────────────────
RENTAL_YIELDS = {
    "new cairo":      {"apartment": 0.075, "villa": 0.065, "townhouse": 0.070, "default": 0.070},
    "sheikh zayed":   {"apartment": 0.070, "villa": 0.060, "townhouse": 0.065, "default": 0.065},
    "maadi":          {"apartment": 0.080, "villa": 0.070, "townhouse": 0.075, "default": 0.075},
    "zamalek":        {"apartment": 0.085, "villa": 0.075, "townhouse": 0.080, "default": 0.080},
    "6th of october": {"apartment": 0.070, "villa": 0.060, "townhouse": 0.065, "default": 0.065},
    "heliopolis":     {"apartment": 0.078, "villa": 0.068, "townhouse": 0.073, "default": 0.073},
    "nasr city":      {"apartment": 0.075, "villa": 0.065, "townhouse": 0.070, "default": 0.070},
    "october":        {"apartment": 0.068, "villa": 0.058, "townhouse": 0.063, "default": 0.063},
    "el gouna":       {"apartment": 0.082, "villa": 0.072, "townhouse": 0.077, "default": 0.077},
    "hurghada":       {"apartment": 0.085, "villa": 0.075, "townhouse": 0.080, "default": 0.080},
    "default":        {"apartment": 0.065, "villa": 0.055, "townhouse": 0.060, "default": 0.060},
}

# ─── Dual Query Parser ────────────────────────────────────────────────────────

def parse_query_with_gpt(query: str) -> dict:
    """
    PRIMARY parser — uses GPT-4o-mini to extract structured entities
    from any natural language real estate query.

    Returns a dict with keys: city, type, bedrooms, bathrooms,
    min_price, max_price, has_maid_room (all nullable).

    GPT is instructed to return ONLY valid JSON with no prose,
    making it safe to parse directly.
    """
    prompt = f"""You are a real estate search parser for the Egyptian property market.

Extract structured search filters from this query: "{query}"

Return ONLY a JSON object with these exact keys (use null if not mentioned):
{{
  "city": string or null,
  "type": string or null,
  "bedrooms": integer or null,
  "bathrooms": integer or null,
  "min_price": integer or null,
  "max_price": integer or null,
  "has_maid_room": boolean or null
}}

Rules:
- city: Egyptian city name (e.g. "New Cairo", "Sheikh Zayed", "Maadi", "Zamalek", "Heliopolis", "Nasr City", "Giza", "Hurghada", "El Gouna", "6th of October")
- type: one of "apartment", "villa", "townhouse", "twin house", "penthouse", "studio", "duplex", "chalet"
- Prices are in EGP. Convert "5M" to 5000000, "500K" to 500000
- "near the pyramids" or "Giza area" → city: "Giza"
- "family home" or "for a family" → bedrooms: 3 (minimum)
- "luxury" → interpret as higher price range
- "affordable" or "budget" → interpret as lower price range
- Return ONLY the JSON object, no explanation, no markdown"""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0,  # deterministic — we want consistent extraction
        )
        raw = response.choices[0].message.content.strip()
        raw = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(raw)
        print(f"🧠 GPT parser: {result}")
        return result
    except Exception as e:
        print(f"⚠️  GPT parser failed: {e} — falling back to rule-based")
        return None


def parse_query_rule_based(query: str) -> dict:
    """
    FALLBACK parser — rule-based regex extraction.
    Used when GPT parser fails (API timeout, quota exceeded, etc.)
    Ensures the search always works even without OpenAI.
    """
    query_lower = query.lower()
    result = {
        "city": None, "type": None, "bedrooms": None,
        "bathrooms": None, "min_price": None, "max_price": None,
        "has_maid_room": None,
    }

    # City detection
    city_map = {
        "new cairo": "New Cairo", "sheikh zayed": "Sheikh Zayed",
        "maadi": "Maadi", "zamalek": "Zamalek", "heliopolis": "Heliopolis",
        "nasr city": "Nasr City", "giza": "Giza", "october": "6th of October",
        "6th of october": "6th of October", "hurghada": "Hurghada",
        "el gouna": "El Gouna", "cairo": "Cairo",
    }
    for key, value in city_map.items():
        if key in query_lower:
            result["city"] = value
            break

    # Type detection
    type_map = {
        "villa": "villa", "apartment": "apartment", "studio": "studio",
        "penthouse": "penthouse", "townhouse": "townhouse",
        "twin house": "twin house", "duplex": "duplex", "chalet": "chalet",
    }
    for key, value in type_map.items():
        if key in query_lower:
            result["type"] = value
            break

    # Bedrooms
    bed_match = re.search(r'(\d+)\s*(?:bed|bedroom|br)', query_lower)
    if bed_match:
        result["bedrooms"] = int(bed_match.group(1))

    # Price (millions)
    price_match = re.search(r'(\d+(?:\.\d+)?)\s*m(?:illion)?', query_lower)
    if price_match:
        result["max_price"] = int(float(price_match.group(1)) * 1_000_000)

    # Maid room
    if "maid" in query_lower:
        result["has_maid_room"] = True

    print(f"📋 Rule-based parser: {result}")
    return result


def parse_query(query: str) -> dict:
    """
    Dual-parser entry point.
    Attempts GPT parsing first; falls back to rule-based on failure.
    This is the only function called by the search pipeline.
    """
    result = parse_query_with_gpt(query)
    if result is None:
        result = parse_query_rule_based(query)
    return result



def get_rental_yield(city: str, property_type: str) -> float:
    city_lower = (city or "").lower().strip()
    type_lower = (property_type or "").lower().strip()
    city_data = RENTAL_YIELDS.get(city_lower, RENTAL_YIELDS["default"])
    return city_data.get(type_lower, city_data["default"])

def calculate_property_metrics(property: dict) -> dict:
    price        = property.get("price", 0) or 0
    city         = property.get("city", "")
    prop_type    = property.get("property_type", property.get("type", ""))
    yield_rate       = get_rental_yield(city, prop_type)
    annual_income    = price * yield_rate
    monthly_income   = annual_income / 12
    annual_roi       = yield_rate * 100
    return {
        "price":          price,
        "yield_rate":     yield_rate,
        "annual_income":  round(annual_income),
        "monthly_income": round(monthly_income),
        "annual_roi":     round(annual_roi, 1),
    }


def analyze_portfolio(properties: list, user: dict) -> dict:
    if not properties:
        return {
            "portfolio_value": 0, "monthly_income": 0,
            "annual_roi": 0, "property_count": 0,
            "ai_insight": "Save properties to see your portfolio analysis.",
            "breakdown": [],
        }

    breakdown = []
    total_value = total_monthly = weighted_roi = 0

    for prop in properties:
        metrics = calculate_property_metrics(prop)
        breakdown.append({
            "property_id":    prop.get("property_id"),
            "city":           prop.get("city", ""),
            "type":           prop.get("property_type", prop.get("type", "")),
            "price":          metrics["price"],
            "monthly_income": metrics["monthly_income"],
            "annual_roi":     metrics["annual_roi"],
        })
        total_value   += metrics["price"]
        total_monthly += metrics["monthly_income"]
        weighted_roi  += metrics["annual_roi"]

    avg_roi = round(weighted_roi / len(properties), 1)

    properties_summary = "\n".join([
        f"- {p['city']} {p['type']}: {p['price']:,} EGP, "
        f"Est. {p['monthly_income']:,} EGP/month rental, {p['annual_roi']}% ROI"
        for p in breakdown
    ])

    user_goal   = user.get("investment_goal", "balanced")
    user_status = user.get("investment_status", "beginner")

    prompt = f"""You are an expert Egyptian real estate investment advisor.

Investor profile:
- Experience: {user_status}
- Goal: {user_goal}
- Saved properties: {len(properties)}

Portfolio:
{properties_summary}

Total value: {total_value:,} EGP
Est. monthly income: {total_monthly:,} EGP
Average ROI: {avg_roi}%

Write 2-3 sentences of personalised portfolio insight. Be specific about cities and property types. Mention alignment with their goal. No bullet points."""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=200, temperature=0.7,
        )
        ai_insight = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Portfolio analysis error: {e}")
        ai_insight = f"Your portfolio of {len(properties)} properties has an estimated value of {total_value:,} EGP with an average ROI of {avg_roi}%."

    return {
        "portfolio_value": total_value, "monthly_income": total_monthly,
        "annual_roi": avg_roi, "property_count": len(properties),
        "ai_insight": ai_insight, "breakdown": breakdown,
    }


def analyze_investment(property: dict, user: dict) -> dict:
    metrics = calculate_property_metrics(property)

    prompt = f"""You are an expert Egyptian real estate investment advisor.

Property:
- Location: {property.get('neighborhood', '')}, {property.get('city', '')}
- Type: {property.get('property_type', property.get('type', ''))}
- Price: {property.get('price', 0):,} EGP
- Size: {property.get('area', property.get('size', 0))} sqm
- Bedrooms: {property.get('bedrooms', 0)}
- Price per sqm: {property.get('price_per_sqm', 0):,} EGP

Market estimates:
- Rental yield: {metrics['yield_rate']*100:.1f}%
- Est. monthly rental: {metrics['monthly_income']:,} EGP
- Est. annual ROI: {metrics['annual_roi']}%

Investor profile:
- Experience: {user.get('investment_status', 'beginner')}
- Goal: {user.get('investment_goal', 'balanced')}
- Budget: {user.get('budget_min') or 0:,} – {user.get('budget_max') or 0:,} EGP

Provide structured analysis with exactly:
1. VERDICT (one sentence: Buy / Consider / Pass and why)
2. STRENGTHS (2-3 bullet points)
3. RISKS (1-2 bullet points)
4. RECOMMENDATION (1-2 sentences for this investor's goal)

Concise, specific to Egyptian market conditions."""

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=350, temperature=0.7,
        )
        analysis = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Investment analysis error: {e}")
        analysis = f"Estimated rental yield: {metrics['yield_rate']*100:.1f}%. Monthly income: {metrics['monthly_income']:,} EGP. Annual ROI: {metrics['annual_roi']}%."

    return {
        "analysis":       analysis,
        "monthly_income": metrics["monthly_income"],
        "annual_roi":     metrics["annual_roi"],
        "yield_rate":     round(metrics["yield_rate"] * 100, 1),
    }


def chat_with_properties(user_message: str, properties: list, chat_history: list, is_property_search: bool = False) -> str:
    if properties:
        context = "Properties retrieved from our database:\n\n"
        for i, prop in enumerate(properties[:8], 1):
            metrics = calculate_property_metrics(prop)
            context += (
                f"{i}. {prop.get('type', prop.get('property_type', 'Property'))} in "
                f"{prop.get('neighborhood', '')}, {prop.get('city', '')}\n"
                f"   Price: {prop.get('price', 0):,} EGP | "
                f"Size: {prop.get('size', prop.get('area', 0))} sqm | "
                f"Beds: {prop.get('bedrooms', 0)} | "
                f"Est. Monthly Rent: {metrics['monthly_income']:,} EGP\n\n"
            )
    else:
        context = "No specific properties found for this query.\n"

    if is_property_search:
        role_instruction = (
            "You are PropertyPro's AI assistant. The user is looking for specific properties. "
            "Write 2-3 sentences introducing the results: mention the area, price range, and bedroom count. "
            "The property cards are shown below your message — do not re-list them."
        )
    else:
        role_instruction = (
            "You are PropertyPro's AI assistant — an expert in Egyptian real estate investment. "
            "Be specific, data-driven, and reference the properties above when relevant. "
            "Keep your answer to 3-5 sentences unless the user asks for detail."
        )

    system_prompt = f"""{role_instruction}

{context}"""

    messages = [{"role": "system", "content": system_prompt}]
    for msg in chat_history[-6:]:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=400, temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return "I'm having trouble connecting right now. Please try again in a moment."