"""Motor (async MongoDB) client. Home of the Knowledge Graph store:
nodes, edges, and per-student mastery state/history.
"""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(get_settings().mongo_url)
    return _client


def get_database() -> AsyncIOMotorDatabase:
    return get_client()[get_settings().mongo_db]


def close_client() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None


# Collection name constants
NODES = "kg_nodes"
EDGES = "kg_edges"
MASTERY = "kg_mastery"
META = "kg_meta"
