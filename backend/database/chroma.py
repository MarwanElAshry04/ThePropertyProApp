import chromadb
from config import settings

# Initialize ChromaDB Client (singleton)

_chroma_client = None
_collection = None

def get_chroma_client():
    """Get Chroma DB client (singleton)"""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    return _chroma_client

def get_chroma_collection():
    """Get ChromaDB collection (singleton)"""
    global _collection
    if _collection is None:
        client = get_chroma_client()
        _collection = client.get_collection(name=settings.CHROMA_COLLECTION)
    return _collection