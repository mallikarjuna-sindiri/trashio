from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

from app.api.deps import DB
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import Token, UserCreate, UserPublic, user_doc_from_create

router = APIRouter()


class LoginRequest(BaseModel):
    email: EmailStr
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

    if not verify_password(payload.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(subject=str(user["_id"]), role=user["role"])
    return Token(access_token=token)
