from pydantic import BaseModel, Field
from typing import Optional, List


class RecommendationRequest(BaseModel):
    query: str                    = Field(...,           description="Natural language search query")
    min_price: Optional[int]      = Field(0,             description="Minimum price in EGP")
    max_price: Optional[int]      = Field(100_000_000,   description="Maximum price in EGP")
    city: Optional[str]           = Field(None,          description="Filter by city")
    neighborhood: Optional[str]   = Field(None,          description="Filter by neighborhood (partial match)")
    bedrooms: Optional[int]       = Field(None,          description="Minimum bedrooms")
    bathrooms: Optional[int]      = Field(None,          description="Minimum bathrooms")
    property_type: Optional[str]  = Field(None,          description="Filter by property type")
    min_size: Optional[int]       = Field(None,          description="Minimum size in sqm")
    max_size: Optional[int]       = Field(None,          description="Maximum size in sqm")
    has_maid_room: Optional[bool] = Field(None,          description="Has maid's room")
    top_k: int                    = Field(20,            description="Number of results", ge=1, le=50)


class PropertyResponse(BaseModel):
    property_id:      int
    price:            int
    size:             int
    bedrooms:         int
    bathrooms:        int
    has_maid_room:    bool
    description:      str
    location:         str
    city:             str
    neighborhood:     str
    type:             str
    price_per_sqm:    int
    price_category:   str
    bedroom_category: str
    url:              str
    similarity_score: Optional[float] = None


class RecommendationResponse(BaseModel):
    query:          str
    filters:        dict
    total_results:  int
    properties:     List[PropertyResponse]
    search_time_ms: float


class ChatCompareRequest(BaseModel):
    property_ids: List[int]     = Field(..., description="2–5 property IDs to compare", min_items=2, max_items=5)
    user_context: Optional[str] = Field(None, description="User's investment goal")


class ChatQuestionRequest(BaseModel):
    property_id: int = Field(..., description="Property ID")
    question:    str = Field(..., description="User's question")


class ChatResponse(BaseModel):
    response:         str
    property_ids:     List[int]
    response_time_ms: float