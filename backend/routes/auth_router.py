from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional
from database.postgres import get_db_cursor
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token,
    verify_firebase_token,
)
from services.email_service import (
    send_verification_email,
    send_password_reset_email,
    verify_code,
)
from datetime import datetime, timedelta

router   = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()


class RegisterRequest(BaseModel):
    full_name:         str           = Field(..., min_length=2)
    email:             str           = Field(...)
    password:          str           = Field(..., min_length=8)
    investment_status: Optional[str] = None
    budget_min:        Optional[int] = None
    budget_max:        Optional[int] = None
    investment_goal:   Optional[str] = None

class LoginRequest(BaseModel):
    email:    str = Field(...)
    password: str = Field(...)

class GoogleAuthRequest(BaseModel):
    firebase_token:    str           = Field(...)
    full_name:         Optional[str] = None
    investment_status: Optional[str] = None
    budget_min:        Optional[int] = None
    budget_max:        Optional[int] = None
    investment_goal:   Optional[str] = None

class RefreshRequest(BaseModel):
    refresh_token: str

class VerifyEmailRequest(BaseModel):
    email: str
    code:  str = Field(..., min_length=6, max_length=6)

class ResendVerificationRequest(BaseModel):
    email: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email:        str
    code:         str = Field(..., min_length=6, max_length=6)
    new_password: str = Field(..., min_length=8)

class UpdateProfileRequest(BaseModel):
    """Update user profile — all fields optional, only provided fields are updated."""
    full_name:         Optional[str] = None
    investment_status: Optional[str] = None
    budget_min:        Optional[int] = None
    budget_max:        Optional[int] = None
    investment_goal:   Optional[str] = None
    profile_photo:     Optional[str] = None  # base64 encoded image string

class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password:     str = Field(..., min_length=8)


def get_user_by_email(email: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
        return cursor.fetchone()

def get_user_by_google_uid(uid: str):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE google_uid = %s", (uid,))
        return cursor.fetchone()

def get_user_by_id(user_id: int):
    with get_db_cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        return cursor.fetchone()

def create_user_in_db(full_name, email, password_hash=None, google_uid=None,
                      investment_status=None, budget_min=None,
                      budget_max=None, investment_goal=None):
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO users
                (full_name, email, password_hash, google_uid,
                 investment_status, budget_min, budget_max, investment_goal)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING *
        """, (full_name, email, password_hash, google_uid,
              investment_status, budget_min, budget_max, investment_goal))
        return cursor.fetchone()

def store_refresh_token(user_id: int, refresh_token: str):
    expires = datetime.utcnow() + timedelta(days=30)
    with get_db_cursor() as cursor:
        cursor.execute("""
            INSERT INTO user_sessions (user_id, refresh_token, expires_at)
            VALUES (%s, %s, %s)
        """, (user_id, refresh_token, expires))

def delete_refresh_token(refresh_token: str):
    with get_db_cursor() as cursor:
        cursor.execute(
            "DELETE FROM user_sessions WHERE refresh_token = %s",
            (refresh_token,)
        )

def validate_refresh_token_in_db(refresh_token: str):
    with get_db_cursor() as cursor:
        cursor.execute("""
            SELECT * FROM user_sessions
            WHERE refresh_token = %s AND expires_at > %s
        """, (refresh_token, datetime.utcnow()))
        return cursor.fetchone()

def user_to_dict(user) -> dict:
    return {
        "id":                user["id"],
        "full_name":         user["full_name"],
        "email":             user["email"],
        "investment_status": user["investment_status"],
        "budget_min":        user["budget_min"],
        "budget_max":        user["budget_max"],
        "investment_goal":   user["investment_goal"],
        "is_verified":       user.get("is_verified", False),
        "profile_photo":     user.get("profile_photo", None),
        "created_at":        str(user["created_at"]),
    }

def build_auth_response(user) -> dict:
    access_token  = create_access_token(user["id"], user["email"])
    refresh_token = create_refresh_token(user["id"])
    store_refresh_token(user["id"], refresh_token)
    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "user":          user_to_dict(user),
    }


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token   = credentials.credentials
    payload = verify_token(token, token_type="access")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register")
async def register(request: RegisterRequest):
    if get_user_by_email(request.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = hash_password(request.password)
    user = create_user_in_db(
        full_name=         request.full_name,
        email=             request.email,
        password_hash=     password_hash,
        investment_status= request.investment_status,
        budget_min=        request.budget_min,
        budget_max=        request.budget_max,
        investment_goal=   request.investment_goal,
    )

    sent = send_verification_email(user["id"], user["email"], user["full_name"])
    if not sent:
        print(f"⚠️  Verification email failed for {user['email']}")

    print(f" New user registered: {user['email']}")
    response = build_auth_response(user)
    response["needs_verification"] = True
    return response


@router.post("/verify-email")
async def verify_email(request: VerifyEmailRequest):
    valid = verify_code(request.email, request.code, 'verify_email')
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    with get_db_cursor() as cursor:
        cursor.execute(
            "UPDATE users SET is_verified = TRUE WHERE email = %s RETURNING *",
            (request.email,)
        )
        user = cursor.fetchone()

    print(f" Email verified: {request.email}")
    return { "message": "Email verified successfully", "user": user_to_dict(user) }


@router.post("/resend-verification")
async def resend_verification(request: ResendVerificationRequest):
    user = get_user_by_email(request.email)
    if not user:
        return { "message": "If this email is registered, a code has been sent" }

    sent = send_verification_email(user["id"], user["email"], user["full_name"])
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email. Try again.")

    return { "message": "Verification code resent" }


@router.post("/login")
async def login(request: LoginRequest):
    user = get_user_by_email(request.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user["password_hash"]:
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In.")

    if not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    print(f" User logged in: {user['email']}")
    response = build_auth_response(user)
    response["needs_verification"] = not user.get("is_verified", False)
    return response


@router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    user = get_user_by_email(request.email)
    if user:
        send_password_reset_email(user["id"], user["email"], user["full_name"])
    return { "message": "If this email is registered, a reset code has been sent" }


@router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    valid = verify_code(request.email, request.code, 'reset_password')
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired code")

    new_hash = hash_password(request.new_password)
    with get_db_cursor() as cursor:
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE email = %s",
            (new_hash, request.email)
        )

    print(f"✅ Password reset for: {request.email}")
    return { "message": "Password reset successfully. Please sign in." }


@router.put("/profile")
async def update_profile(
    request: UpdateProfileRequest,
    current_user = Depends(get_current_user)
):
    """
    Update the current user's profile.
    Only provided (non-None) fields are updated — partial updates supported.
    Profile photo is stored as a base64 string.
    """
    fields  = []
    values  = []

    if request.full_name is not None:
        fields.append("full_name = %s")
        values.append(request.full_name)

    if request.investment_status is not None:
        fields.append("investment_status = %s")
        values.append(request.investment_status)

    if request.budget_min is not None:
        fields.append("budget_min = %s")
        values.append(request.budget_min)

    if request.budget_max is not None:
        fields.append("budget_max = %s")
        values.append(request.budget_max)

    if request.investment_goal is not None:
        fields.append("investment_goal = %s")
        values.append(request.investment_goal)

    if request.profile_photo is not None:
        fields.append("profile_photo = %s")
        values.append(request.profile_photo)

    if not fields:
        raise HTTPException(status_code=400, detail="No fields provided to update")

    values.append(current_user["id"])

    with get_db_cursor() as cursor:
        cursor.execute(
            f"UPDATE users SET {', '.join(fields)} WHERE id = %s RETURNING *",
            values
        )
        updated_user = cursor.fetchone()

    print(f" Profile updated for: {current_user['email']}")
    return { "message": "Profile updated successfully", "user": user_to_dict(updated_user) }


@router.post("/change-password")
async def change_password(
    request: ChangePasswordRequest,
    current_user = Depends(get_current_user)
):
    """
    Change password for logged-in users.
    Requires current password verification before allowing change.
    """
    if not current_user["password_hash"]:
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Sign-In — no password to change."
        )

    if not verify_password(request.current_password, current_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    new_hash = hash_password(request.new_password)
    with get_db_cursor() as cursor:
        cursor.execute(
            "UPDATE users SET password_hash = %s WHERE id = %s",
            (new_hash, current_user["id"])
        )

    print(f" Password changed for: {current_user['email']}")
    return { "message": "Password changed successfully" }


@router.post("/google")
async def google_auth(request: GoogleAuthRequest):
    firebase_user = verify_firebase_token(request.firebase_token)
    if not firebase_user:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")

    uid   = firebase_user["uid"]
    email = firebase_user["email"]
    name  = firebase_user["name"] or request.full_name or "User"

    user = get_user_by_google_uid(uid)

    if not user:
        user = get_user_by_email(email)
        if user:
            with get_db_cursor() as cursor:
                cursor.execute(
                    "UPDATE users SET google_uid = %s WHERE id = %s RETURNING *",
                    (uid, user["id"])
                )
                user = cursor.fetchone()
        else:
            user = create_user_in_db(
                full_name=         name,
                email=             email,
                google_uid=        uid,
                investment_status= request.investment_status,
                budget_min=        request.budget_min,
                budget_max=        request.budget_max,
                investment_goal=   request.investment_goal,
            )

    print(f" Google sign-in: {email}")
    return build_auth_response(user)


@router.post("/refresh")
async def refresh_token(request: RefreshRequest):
    payload = verify_token(request.refresh_token, token_type="refresh")
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    session = validate_refresh_token_in_db(request.refresh_token)
    if not session:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")

    user = get_user_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token(user["id"], user["email"])
    return {
        "access_token": access_token,
        "user":         user_to_dict(user),
    }


@router.post("/logout")
async def logout(request: RefreshRequest):
    delete_refresh_token(request.refresh_token)
    return { "message": "Logged out successfully" }


@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    return user_to_dict(current_user)