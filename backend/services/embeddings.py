from sentence_transformers import SentenceTransformer
from config import settings

# Load model once at startup (singleton)
_model = None

def get_embedding_model():
    """Get embedding model (singleton)"""
    global _model
    if _model is None:
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print(" Model loaded successfully!")
    return _model

def generate_embedding(text: str) -> list:
    """Generate embedding for text"""
    model = get_embedding_model()
    embedding = model.encode(text, convert_to_numpy=True)
    return embedding.tolist()