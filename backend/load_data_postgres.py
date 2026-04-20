import os
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch

# 1 Load the clean data
df = pd.read_csv('../data/processed/egyptian_properties_features.csv')

# 2 Connect to Postgres (reads from environment or .env)
conn = psycopg2.connect(
    dbname=os.environ.get("POSTGRES_DB", "propertypro"),
    user=os.environ.get("POSTGRES_USER", "postgres"),
    password=os.environ["POSTGRES_PASSWORD"],
    host=os.environ.get("POSTGRES_HOST", "localhost"),
    port=os.environ.get("POSTGRES_PORT", "5432"),
)

cursor = conn.cursor()

# 3 Prepare data for insertion

data = []
for idx, row in df.iterrows():
    data.append((
        int(row['price']),              # 0
        int(row['size']),               # 1
        int(row['bedrooms']),           # 2
        int(row['bathrooms']),          # 3
        bool(row['has_maid_room']),     # 4
        str(row['description']),        # 5
        str(row['location']),           # 6
        str(row['type']),               # 7
        str(row['url']),                # 8
        int(row['price_per_sqm']),      # 9
        str(row['city']),               # 10
        str(row['neighborhood']),       # 11
        str(row['price_category']),     # 12
        str(row['bedroom_category'])    # 13
    ))

# 4 Insert data in batches
insert_query = """
    INSERT INTO properties (
    price, size, bedrooms, bathrooms, has_maid_room,
    description, location, type, url, price_per_sqm,
    city, neighborhood, price_category, bedroom_category
    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
"""

execute_batch(cursor, insert_query, data, page_size=1000)
conn.commit()


# Verify
cursor.execute("SELECT COUNT(*) FROM properties")
count = cursor.fetchone()[0]

# Sample Query

cursor.execute("""
    SELECT property_id, price, city, type, bedrooms
    FROM properties
    LIMIT 5
""")

for row in cursor.fetchall():
    print(f"   ID: {row[0]} | Price: {row[1]:,} EGP | City: {row[2]} | Type: {row[3]} | Beds: {row[4]}")

# Close connection
cursor.close()
conn.close()
