from openai import OpenAI
from config import settings
from database.postgres import get_db_cursor
from typing import List, Dict, Any


# Initialize OpenAI Client

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def get_property_details(property_id: int) -> Dict[str, Any]:
    """Fetch property details from database"""
    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM properties WHERE property_id = %s",
            (property_id,)
        )
        result = cursor.fetchone()
    return dict(result) if result else None

def compare_properties(property_ids: List[int], user_context: str = "") -> str:
    """
    Compare multiple properties using RAG

    Args:
        property_ids: List of property IDs to compare
        user_context: User's investment goal/preferences

    Returns:
        AI-generated comparison
    """

    # Step 1: Retrieve Property Data

    properties = []
    for prop_id in property_ids:
        prop = get_property_details(prop_id)
        if prop:
            properties.append(prop)
    
    if not properties:
        return "Sorry, I couldn't find any properties"
    
    # Step 2: Build context for AI

    properties_context = ""
    for i, prop in enumerate(properties, 1):
        properties_context += f"""
Property {i} (ID: {prop['property_id']}):
- Type: {prop['type']}
- Price: {prop['price']:,} EGP
- Size: {prop['size']} sqm
- Price per sqm: {prop['price_per_sqm']:,} EGP
- Bedrooms: {prop['bedrooms']}
- Bathrooms: {prop['bathrooms']}
- Location: {prop['location']}
- City: {prop['city']}
- Neighborhood: {prop['neighborhood']}
- Price Category: {prop['price_category']}
- Description: {prop['description'][:200]}...
"""
        
    # Step 3: Create Prompt
    system_prompt = """You are a professional real estate investment advisor for the Egyptian market
    You help investors make informed decisions by analyzing properties objectively.

Your analysis should include:
1. Price comparison and value assessment
2. Location advantages/disadvantages
3. Rental income potential
4. Capital appreciation prospects
5. Investment suitability based on user goals
6. Clear recommendation with reasoning

Be specific, use numbers, and provide actionable insights."""

    user_prompt = f"""Compare these properties for investment:
{properties_context}
{"User's investment goal: " + user_context if user_context else ""}

Provide a detailed comparison and recommendation"""
    
    # Step 4: Call GPT-4
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=1000
    )

    return response.choices[0].message.content
def ask_about_property(property_id: int, question: str) -> str:
    """
    Answer questions about a specific property
    
    Args:
        property_id: Property ID
        question: User's question
    
    Returns:
        AI-generated answer
    """
    # Retrieve property data
    prop = get_property_details(property_id)
    
    if not prop:
        return f"Sorry, I couldn't find property {property_id}."
    
    # Build context
    property_context = f"""
Property Information (ID: {prop['property_id']}):
- Type: {prop['type']}
- Price: {prop['price']:,} EGP
- Size: {prop['size']} sqm
- Price per sqm: {prop['price_per_sqm']:,} EGP
- Bedrooms: {prop['bedrooms']}
- Bathrooms: {prop['bathrooms']}
- Maid's Room: {"Yes" if prop['has_maid_room'] else "No"}
- Location: {prop['location']}
- City: {prop['city']}
- Neighborhood: {prop['neighborhood']}
- Price Category: {prop['price_category']}
- Bedroom Category: {prop['bedroom_category']}
- Full Description: {prop['description']}
- Listing URL: {prop['url']}
"""
    
    # Create prompt
    system_prompt = """You are a knowledgeable real estate assistant for the Egyptian market.
Answer questions about properties accurately based on the provided data.
Be helpful, specific, and provide relevant insights."""

    user_prompt = f"""{property_context}

User Question: {question}

Provide a helpful and detailed answer."""

    # Call GPT-4
    response = client.chat.completions.create(
        model=settings.OPENAI_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.7,
        max_tokens=800
    )
    
    return response.choices[0].message.content

