# PropertyPro

An AI-powered real estate recommendation platform for Egyptian properties. Users describe what they are looking for in natural language and the app returns ranked property matches using a hybrid semantic + SQL search pipeline, backed by a conversational AI chat interface.

**Stack:** FastAPI · PostgreSQL · ChromaDB · Sentence-BERT · OpenAI GPT-4o-mini · React Native (Expo) · NativeWind

---

## Prerequisites

| Tool | Version |
|---|---|
| Python | 3.10+ |
| Node.js | 18+ |
| PostgreSQL | 14+ |
| Expo Go app | Latest (for physical device testing) |

---

## Project Structure

```
propertypro/
├── backend/              # FastAPI application
├── mobile-app/           # React Native (Expo) app
├── database/schema.sql   # PostgreSQL table definitions
├── data/
│   ├── processed/        # egyptian_properties_features.csv  ← provided separately
│   └── embeddings/       # property_embeddings.npy           ← provided separately
└── chroma_db/            # generated locally (see Step 5)
```

> The `data/processed/`, `data/embeddings/`, and `chroma_db/` directories are not committed to the repository due to file size. They are provided as a separate download — see the submission notes for the link.

---

## Setup

### 1. Environment variables

Create `backend/.env` with the following values:

```env
# PostgreSQL
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_USER=postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=propertypro

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# JWT
JWT_SECRET_KEY=any_long_random_string

# Firebase (Google Sign-In)
FIREBASE_SERVICE_ACCOUNT_PATH=./your-firebase-credentials.json

# Gmail SMTP (email verification)
EMAIL_ADDRESS=your_gmail_address
EMAIL_PASSWORD=your_gmail_app_password
```

> Firebase and Gmail are only needed for the authentication flow (sign-up, email verification, password reset). Core search and chat features work without them if you skip those screens during testing.

---

### 2. PostgreSQL — create the database and schema

```bash
# In psql or pgAdmin, create the database first:
createdb propertypro

# Then apply the schema:
psql -U postgres -d propertypro -f database/schema.sql
```

---

### 3. Backend — install dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

---

### 4. Load property data into PostgreSQL

Place `egyptian_properties_features.csv` in `data/processed/`, then run:

```bash
cd backend
POSTGRES_PASSWORD=your_postgres_password venv/Scripts/python.exe load_data_postgres.py
```

This inserts ~18,963 Egyptian property listings. Expected output ends with `ID: 5 | ...`.

---

### 5. Generate ChromaDB vector embeddings

Place `property_embeddings.npy` in `data/embeddings/`, then run:

```bash
cd backend
POSTGRES_PASSWORD=your_postgres_password venv/Scripts/python.exe load_embeddings_chroma.py
```

This populates `chroma_db/` (~313 MB). Takes 2–5 minutes. The progress bar shows batch completion.

> **Critical:** ChromaDB `property_id` values are offset by +1 to match PostgreSQL's `SERIAL` (which starts at 1, not 0). Do not modify `load_embeddings_chroma.py` line 37.

---

### 6. Run the backend server

```bash
cd backend

# Windows (PYTHONUTF8 required — emoji in startup logs crash the default cp1252 encoding)
PYTHONUTF8=1 PYTHONIOENCODING=utf-8 venv/Scripts/python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# macOS / Linux
PYTHONUTF8=1 uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

API is live at **http://localhost:8000** — interactive docs at **http://localhost:8000/docs**.

---

### 7. Mobile app — install dependencies

```bash
cd mobile-app
npm install
```

---

### 8. Set the API base URL

Edit `mobile-app/config.js` and replace the IP address with your machine's local IP:

```js
export const API_BASE_URL = 'http://YOUR_LOCAL_IP:8000';
```

Find your local IP with `ipconfig` (Windows) or `ifconfig` (macOS/Linux). Use `localhost` only if running the Expo web target.

---

### 9. Start the mobile app

```bash
cd mobile-app
npm start
```

Scan the QR code with the **Expo Go** app on your phone, or press `w` to open in a browser.

---

## Testing the core features

Once both servers are running:

1. **Search** — go to the Search tab, type a natural language query such as _"3 bedroom apartment in New Cairo under 5 million"_ and tap Search.
2. **AI Chat** — go to the Chat tab and ask _"Show me villas in Maadi with a garden"_. Property cards will appear below the response.
3. **Recommendations** — the Home tab loads personalised recommendations based on onboarding preferences.
4. **API directly** — send a POST to `http://localhost:8000/recommendations` with body `{"query": "studio in Zamalek"}` to test the search pipeline without the app.

---

## Architecture overview

```
Mobile App (React Native)
        │  HTTP/JSON
        ▼
FastAPI Backend
    ├── Rule-based parser  →  location & type normalisation
    ├── GPT-4o-mini        →  price range & bedroom extraction
    └── Hybrid search
            ├── ChromaDB   →  semantic similarity (Sentence-BERT embeddings)
            └── PostgreSQL →  hard filters (price, bedrooms, city, type)
```

The hybrid search uses two strategies:
- **Neighbourhood strategy** — PostgreSQL exact match first, then ChromaDB re-ranks by similarity.
- **Standard strategy** — ChromaDB semantic search first, then PostgreSQL applies hard filters.

See `docs/Search_Pipeline.md` for full pipeline documentation.
