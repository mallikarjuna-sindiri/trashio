from __future__ import annotations

from typing import Annotated, Literal

from fastapi import Depends, HTTPException, Request, status

from app.core.security import decode_token
from app.db.mongo import db

Role = Literal["citizen", "cleaner", "admin"]


def get_db():
    try:
        return db()
    except RuntimeError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"MongoDB not configured or unreachable. Set MONGODB_URI. ({exc})",
        )


def get_token_payload(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = auth.removeprefix("Bearer ").strip()
    try:
        return decode_token(token)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_role(*allowed: Role):
    def _dep(payload: Annotated[dict, Depends(get_token_payload)]) -> dict:
        role = payload.get("role")
        if role not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return payload

    return _dep


TokenPayload = Annotated[dict, Depends(get_token_payload)]
DB = Annotated[object, Depends(get_db)]
