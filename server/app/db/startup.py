from __future__ import annotations

from app.db.mongo import db


async def ensure_indexes() -> None:
    try:
        database = db()
        # Unique email for users
        await database.users.create_index("email", unique=True)
        # Helpful report indexes
        await database.reports.create_index("citizen_id")
        await database.reports.create_index("status")
        await database.reports.create_index("assigned_cleaner_id")
    except Exception:
        # Best-effort on startup: devs may not have Mongo configured yet.
        # Actual API calls will still fail until Mongo is reachable.
        return
