from fastapi import APIRouter, HTTPException
from models.schemas import RecommendationRequest, RecommendationResponse, PropertyResponse
from services.search import search_properties

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post("/", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get AI-powered property recommendations.

    Natural language queries are parsed automatically:
    - "luxury villa in new cairo"  → city=Cairo, neighborhood=New Cairo, type=Villa
    - "3 bedroom apartment"        → bedrooms=3, type=Apartment
    - "under 5M in sheikh zayed"   → max_price=5M, city=Giza, neighborhood=Sheikh Zayed
    """
    try:
        results, search_time_ms = search_properties(
            query=         request.query,
            min_price=     request.min_price,
            max_price=     request.max_price,
            city=          request.city,
            neighborhood=  request.neighborhood,
            bedrooms=      request.bedrooms,
            bathrooms=     request.bathrooms,
            property_type= request.property_type,
            top_k=         request.top_k,
            min_size=      request.min_size,
            max_size=      request.max_size,
            has_maid_room= request.has_maid_room,
        )

        properties = [PropertyResponse(**result) for result in results]

        return RecommendationResponse(
            query=request.query,
            filters={
                "city":          request.city,
                "neighborhood":  request.neighborhood,
                "min_price":     request.min_price,
                "max_price":     request.max_price,
                "bedrooms":      request.bedrooms,
                "bathrooms":     request.bathrooms,
                "property_type": request.property_type,
                "min_size":      request.min_size,
                "max_size":      request.max_size,
                "has_maid_room": request.has_maid_room,
            },
            total_results=  len(properties),
            properties=     properties,
            search_time_ms= search_time_ms,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))