from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── PostgreSQL ─────────────────────────────────────────────────────────────
    POSTGRES_USER:     str = "postgres"
    POSTGRES_PASSWORD: str
    POSTGRES_HOST:     str = "localhost"
    POSTGRES_PORT:     int = 5432
    POSTGRES_DB:       str = "propertypro"

    # ── ChromaDB ───────────────────────────────────────────────────────────────
    CHROMA_PATH:       str = "../chroma_db"
    CHROMA_COLLECTION: str = "property_embeddings"

    # ── Embedding Model ────────────────────────────────────────────────────────
    EMBEDDING_MODEL:   str = "paraphrase-mpnet-base-v2"

    # ── API Settings ───────────────────────────────────────────────────────────
    API_TITLE:         str = "PropertyPro API"
    API_VERSION:       str = "1.0.0"

    # ── OpenAI ─────────────────────────────────────────────────────────────────
    OPENAI_API_KEY:    str
    OPENAI_MODEL:      str = "gpt-4o-mini"

    # JWT 
    JWT_SECRET_KEY:    str

    # Firebase
    FIREBASE_SERVICE_ACCOUNT_PATH: str

    # Email (Gmail SMTP
    EMAIL_ADDRESS:     str
    EMAIL_PASSWORD:    str

    class Config:
        env_file = ".env"


settings = Settings()