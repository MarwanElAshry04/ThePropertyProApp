from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from services.openai_service import chat_with_properties, analyze_investment
from services.search import search_properties
from services.query_parser import parse_query as rule_based_parse
from routes.auth_router import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])

class Message(BaseModel):
    role: str     # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message:     str
    history:     List[Message] = []
    property_id: Optional[int] = None

class InvestmentAnalysisRequest(BaseModel):
    property_id: int

# Only explicit listing-request verbs trigger property cards.

_LISTING_REQUEST_VERBS = {
    'find', 'show', 'give', 'list', 'search for',
    'looking for', 'look for', 'get me', 'send me',
    'recommend', 'suggest', 'i need', 'i want',
}

def _is_property_search(message: str, parsed: dict) -> bool:
    msg_lower = message.lower()
    return any(verb in msg_lower for verb in _LISTING_REQUEST_VERBS)


@router.post("/ask")
async def ask(
    request: ChatRequest,
    current_user = Depends(get_current_user)
):
    """
    RAG chat — detects whether the user wants property listings or a general
    answer, runs the hybrid search accordingly, then passes results to GPT.
    """
    print(f"💬 Chat from user {current_user['id']}: {request.message[:60]}...")

    parsed    = rule_based_parse(request.message)
    is_search = _is_property_search(request.message, parsed)
    top_k     = 8 if is_search else 3

    try:
        properties, _ = search_properties(
            query=        request.message,
            top_k=        top_k,
            city=         parsed.get('city'),
            neighborhood= parsed.get('neighborhood'),
            property_type=parsed.get('property_type'),
            bedrooms=     parsed.get('bedrooms'),
        )
    except Exception as e:
        print(f"⚠️ Search failed for chat: {e}")
        properties = []

    history = [{"role": m.role, "content": m.content} for m in request.history]

    response = chat_with_properties(
        user_message=     request.message,
        properties=       properties,
        chat_history=     history,
        is_property_search=is_search,
    )

    return {
        "response":          response,
        "properties":        properties,
        "is_property_search": is_search,
    }


@router.post("/analyze")
async def investment_analysis(
    request: InvestmentAnalysisRequest,
    current_user = Depends(get_current_user)
):
    """
    Deep AI investment analysis for a single property.
    Used in PropertyDetail screen.
    """
    from database.postgres import get_db_cursor

    with get_db_cursor() as cursor:
        cursor.execute(
            "SELECT * FROM properties WHERE property_id = %s",
            (request.property_id,)
        )
        prop = cursor.fetchone()

    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    property_dict = dict(prop)
    user_dict     = dict(current_user)

    print(f"🔍 Investment analysis for property {request.property_id} by user {current_user['id']}")

    result = analyze_investment(property_dict, user_dict)
    return result