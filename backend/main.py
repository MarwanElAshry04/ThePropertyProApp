from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routes import recommendations, chat, auth_router, favorites_router

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description="AI-powered real estate recommendation system"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommendations.router)
app.include_router(chat.router)
app.include_router(auth_router.router)
app.include_router(favorites_router.router)

@app.get("/")
async def root():
    return {
        "message": "PropertyPro API",
        "version": settings.API_VERSION,
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    print("=" * 70)
    print("🚀 PROPERTYPRO API STARTING...")
    print("=" * 70)
    from services.embeddings import get_embedding_model
    get_embedding_model()
    print(" API ready!")
    print(f"Docs: http://localhost:8000/docs")
    print(f" Auth: /auth/register | /auth/login")
    print(f"  Favorites: /favorites/")
    print("=" * 70)