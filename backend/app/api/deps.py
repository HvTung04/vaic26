from __future__ import annotations

from typing import Annotated

from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.mongodb import get_database

MongoDB = Annotated[AsyncIOMotorDatabase, Depends(get_database)]
