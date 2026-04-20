import os
import chromadb
import numpy as np
import pandas as pd
from tqdm import tqdm

# 1 Load embeddings

embeddings = np.load('../data/embeddings/property_embeddings.npy')
print(f"   Shape: {embeddings.shape}")

# Load property metadata

df = pd.read_csv('../data/processed/egyptian_properties_features.csv')

# 3 Initialize chromadb

chroma_path = os.environ.get("CHROMA_PATH", "../chroma_db")
client = chromadb.PersistentClient(path=chroma_path)

# 4 Create collection

try:
    client.delete_collection("property_embeddings")
except:
    pass

collection = client.create_collection(
    name="property_embeddings",
    metadata={"description": "Egyptian property semantic embeddings"}
)

# 5 Prepare data

ids = [f"prop_{i}" for i in range(len(embeddings))]
documents = df['description'].fillna('').tolist()
metadatas = [
    {
        "property_id": i + 1,  # PostgreSQL SERIAL starts at 1; ChromaDB index is 0-based
        "price": int(df.iloc[i]['price']),
        "city": str(df.iloc[i]['city']),
        "type": str(df.iloc[i]['type']),
        "bedrooms": int(df.iloc[i]['bedrooms'])
    }
    for i in range(len(df))
]

# 6 Add to ChromaDB in batches

batch_size = 1000

for i in tqdm(range(0, len(embeddings), batch_size), desc="Batches"):
    batch_end = min(i + batch_size, len(embeddings))

    collection.add(
        ids=ids[i:batch_end],
        embeddings=embeddings[i:batch_end].tolist(),
        documents=documents[i:batch_end],
        metadatas=metadatas[i:batch_end]
    )

# 7 Verify

count = collection.count()
print(f"   Total embeddings in ChromaDB: {count:,}")

# 8 Test query

print("\n Testing semantic search...")
test_query = "luxury apartment with pool and gym"
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('paraphrase-mpnet-base-v2')
query_embedding = model.encode(test_query).tolist()

results = collection.query(
    query_embeddings=[query_embedding],
    n_results=3
)

print(f"   Query: '{test_query}'")
print("   Top 3 results:")
for i, (doc, meta) in enumerate(zip(results['documents'][0], results['metadatas'][0])):
    print(f"   {i+1}. {meta['city']} | {meta['type']} | {meta['bedrooms']}BR | {meta['price']:,} EGP")
    print(f"      {doc[:80]}...")
