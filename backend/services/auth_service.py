import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from config import settings
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth


# Firebase Admin Init
# This lets the backend verify Google Sign-In tokens sent from the app.
if not firebase_admin._apps:
    cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)

# JWT Settings

ACCESS_TOKEN_EXPIRE_MINUTES  = 60        # 1 hour
REFRESH_TOKEN_EXPIRE_DAYS    = 30        # 30 days
ALGORITHM                    = "HS256"

# Password Hashing
def hash_password(plain_passowrd: str) -> str:
    """
    Hash a plain text password using bcrypt.
    bcrypt automatically generates a salt and includes it in the hash.
    The cost factor (12) makes brute-force attacks computationally expensive.
    
    """

    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_passowrd.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain text password matches a stored bcrypt hash.
    Returns True if they match, False otherwise.
    
    """

    return bcrypt.checkpw(
        plain_password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )

# JWT Token Creation
def create_access_token(user_id: int, email: str) -> str:
    """
    Create a short-lived JWT access token.
    The app sends this in the Authorization header for every API request.
    
    Payload contains:
    - sub: user ID (subject)
    - email: user email
    - type: 'access' (so we can distinguish from refresh tokens)
    - exp: expiry timestamp

    """

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub":   str(user_id),
        "email": email,
        "type":  "access",
        "exp":   expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(user_id: int) -> str:
    """
    Create a long-lived JWT refresh token.
    Stored in the database and in expo-secure-store on the device.
    Used to get a new access token when the current one expires.

    """

    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub":  str(user_id),
        "type": "refresh",
        "exp":  expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    Verify and decode a JWT token.
    Returns the payload dict if valid, None if invalid or expired.
    
    Checks:
    1. Signature is valid (signed with our secret key)
    2. Token is not expired
    3. Token type matches what we expect (access vs refresh)
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != token_type:
            return None
        return payload
    except JWTError:
        return None
 
# Firebase Token Verification
 
def verify_firebase_token(firebase_id_token: str) -> Optional[dict]:
    """
    Verify a Firebase ID token sent from the mobile app after Google Sign-In.
    
    Flow:
    1. User signs in with Google on the app (Firebase handles OAuth)
    2. Firebase gives the app an ID token
    3. App sends that token to our backend
    4. We verify it here using Firebase Admin SDK
    5. If valid, we extract the user's Google UID, email, and name
    
    Returns dict with uid, email, name if valid. None if invalid.
    """
    try:
        decoded = firebase_auth.verify_id_token(firebase_id_token)
        return {
            "uid":   decoded["uid"],
            "email": decoded.get("email", ""),
            "name":  decoded.get("name", ""),
        }
    except Exception as e:
        print(f"Firebase token verification failed: {e}")
        return None
 