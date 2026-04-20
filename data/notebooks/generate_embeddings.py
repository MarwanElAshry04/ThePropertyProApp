import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
from tqdm import tqdm
import time



# Load data

df = pd.read_csv('C:/Users/marwa/PropertyPro/data/processed/egyptian_properties_features.csv')
print(f"   Loaded {len(df):,} properties")

# Check descriptions

print(f"   Missing descriptions: {df['description'].isna().sum()}")
print(f"   Average length: {df['description'].str.len().mean():.0f} characters")

# Load the model

model = SentenceTransformer('paraphrase-mpnet-base-v2')
print(" Model loaded!")

# Get descriptions
descriptions = df['description'].fillna('').tolist()

# Generate embeddings with progress bar
start_time = time.time()

embeddings = model.encode(
    descriptions,
    show_progress_bar=True,
    batch_size=32,  # Process 32 at a time
    convert_to_numpy=True
)

elapsed_time = time.time() - start_time

print(f"\n EMBEDDINGS GENERATED!")

# Save as numpy array
np.save('../embeddings/property_embeddings.npy', embeddings)
print("    Saved to: ../embeddings/property_embeddings.npy")

# Save metadata (property IDs for reference)
df_meta = df[['url', 'price', 'city', 'type', 'bedrooms']].copy()
df_meta.to_csv('../embeddings/embedding_metadata.csv', index=False)
print("    Saved metadata to: ../embeddings/embedding_metadata.csv")

# Quick test
print("\n TESTING EMBEDDINGS...")
test_query = "luxury apartment with pool and gym"
query_embedding = model.encode(test_query)

# Calculate similarity with first 5 properties
from sklearn.metrics.pairwise import cosine_similarity

similarities = cosine_similarity([query_embedding], embeddings[:5])[0]

print(f"\n   Query: '{test_query}'")
print("   Top 5 similarities:")
for i, sim in enumerate(similarities):
    print(f"      Property {i+1}: {sim:.4f} - {df.iloc[i]['description'][:60]}...")


