from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.intervention import Intervention, InterventionStatus, InterventionType


async def list_by_class(db: AsyncSession, class_id: str | uuid.UUID) -> list[Intervention]:
    result = await db.execute(select(Intervention).where(Intervention.class_id == class_id))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, intervention_id: str | uuid.UUID) -> Intervention | None:
    return await db.get(Intervention, intervention_id)


async def upsert_suggestions(
    db: AsyncSession, class_id: str | uuid.UUID, suggestions: list[dict]
) -> list[Intervention]:
    """Replace the current `suggested` set for a class with fresh AI output.
    Interventions already `applied`/`dismissed` by a teacher are left untouched.
    """
    existing = await list_by_class(db, class_id)
    for row in existing:
        if row.status == InterventionStatus.SUGGESTED:
            await db.delete(row)
    await db.flush()

    rows = [
        Intervention(
            class_id=class_id,
            type=InterventionType(s["type"]),
            node_id=s["node_id"],
            target_student_ids=s.get("target_student_ids", []),
            rationale=s["rationale"],
            status=InterventionStatus.SUGGESTED,
        )
        for s in suggestions
    ]
    db.add_all(rows)
    await db.commit()
    for row in rows:
        await db.refresh(row)
    return rows


async def apply(db: AsyncSession, intervention: Intervention, note: str | None) -> Intervention:
    intervention.status = InterventionStatus.APPLIED
    intervention.note = note
    intervention.applied_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(intervention)
    return intervention
