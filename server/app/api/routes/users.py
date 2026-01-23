from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from bson import ObjectId

from app.api.deps import DB, TokenPayload
from app.models.user import UserPublic

router = APIRouter()


@router.get("/me", response_model=UserPublic)
async def me(payload: TokenPayload, database: DB):
    try:
        user_id = ObjectId(payload.get("sub"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

    user = await database.users.find_one({"_id": user_id})

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserPublic(**user)
