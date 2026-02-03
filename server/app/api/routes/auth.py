from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from bson import ObjectId
from pydantic import BaseModel, EmailStr
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.api.deps import DB
from app.core.config import settings
from app.core.security import create_access_token, create_reset_token, decode_reset_token, hash_password, verify_password
from app.models.common import now_utc
from app.models.user import Token, UserCreate, UserPublic, user_doc_from_create
from app.utils.email import send_reset_email

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleLoginRequest(BaseModel):
    id_token: str
    role: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
async def register(payload: UserCreate, database: DB):
    existing = await database.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    password_hash = hash_password(payload.password)
    doc = user_doc_from_create(payload, password_hash)
    result = await database.users.insert_one(doc)
    created = await database.users.find_one({"_id": result.inserted_id})
    return UserPublic(**created)


@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, database: DB):
    user = await database.users.find_one({"email": payload.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="User disabled")

    if not user.get("password_hash"):
        raise HTTPException(
            status_code=401,
            detail="Password login not set. Use Google sign-in or reset your password.",
        )

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return Token(access_token=token)


@router.post("/google", response_model=Token)
async def google_login(payload: GoogleLoginRequest, database: DB):
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    issuer = idinfo.get("iss")
    if issuer not in {"accounts.google.com", "https://accounts.google.com"}:
        raise HTTPException(status_code=401, detail="Invalid token issuer")

    email = (idinfo.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account email missing")
    if not idinfo.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Google email not verified")

    user = await database.users.find_one({"email": email})

    if not user:
        requested_role = (payload.role or "citizen").lower()
        if requested_role not in {"citizen", "cleaner"}:
            raise HTTPException(
                status_code=400,
                detail="Google sign-in supports citizen and cleaner accounts. Use email/password for admin.",
            )

        full_name = idinfo.get("name") or idinfo.get("given_name") or "Google User"
        doc = {
            "full_name": full_name,
            "email": email,
            "phone": None,
            "role": requested_role,
            "address": None,
            "pincode": None,
            "password_hash": "",
            "is_active": True,
            "created_at": now_utc(),
        }
        result = await database.users.insert_one(doc)
        user = await database.users.find_one({"_id": result.inserted_id})

    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="User disabled")

    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return Token(access_token=token)


@router.post("/forgot-password")
async def forgot_password(payload: ForgotPasswordRequest, background_tasks: BackgroundTasks, database: DB):
    user = await database.users.find_one({"email": payload.email.lower()})
    if not user or not user.get("is_active", True):
        return {"ok": True}

    token = create_reset_token(subject=str(user["_id"]))
    reset_base = settings.reset_password_url_base.split(",")[0].strip()
    reset_link = f"{reset_base}?token={token}"

    def _send():
        send_reset_email(payload.email, reset_link)

    background_tasks.add_task(_send)
    return {"ok": True}


@router.post("/reset-password")
async def reset_password(payload: ResetPasswordRequest, database: DB):
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if len(payload.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password must be at most 72 bytes.")

    try:
        reset_payload = decode_reset_token(payload.token)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    user_id_raw = reset_payload.get("sub")
    if not user_id_raw:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    try:
        user_id = ObjectId(user_id_raw)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid reset token")

    password_hash = hash_password(payload.password)
    result = await database.users.update_one(
        {"_id": user_id},
        {"$set": {"password_hash": password_hash}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")

    return {"ok": True}
