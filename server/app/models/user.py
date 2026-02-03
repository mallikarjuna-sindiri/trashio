from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.common import MongoModel, now_utc

UserRole = Literal["citizen", "cleaner", "admin"]


class UserCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=20)
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    address: str | None = Field(default=None, max_length=200)
    pincode: str | None = Field(default=None, min_length=6, max_length=6)

    @field_validator("password")
    @classmethod
    def password_max_72_bytes(cls, v: str) -> str:
        if len(v.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 bytes (bcrypt limit). Use a shorter password.")
        return v

    @field_validator("pincode")
    @classmethod
    def pincode_digits(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not v.isdigit() or len(v) != 6:
            raise ValueError("Pincode must be exactly 6 digits")
        return v


class UserPublic(MongoModel):
    full_name: str
    email: EmailStr
    phone: str | None = None
    role: UserRole
    address: str | None = None
    pincode: str | None = None
    is_active: bool = True
    created_at: datetime


class UserInDB(UserPublic):
    password_hash: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


def user_doc_from_create(payload: UserCreate, password_hash: str) -> dict:
    return {
        "full_name": payload.full_name,
        "email": payload.email.lower(),
        "phone": payload.phone,
        "role": payload.role,
        "address": payload.address,
        "pincode": payload.pincode,
        "password_hash": password_hash,
        "is_active": True,
        "created_at": now_utc(),
    }
