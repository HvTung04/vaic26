from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ocr_scan import OcrScan, ScanStatus


async def create_scan(
    db: AsyncSession, *, test_id: str | uuid.UUID, student_id: str | uuid.UUID | None
) -> OcrScan:
    scan = OcrScan(test_id=test_id, student_id=student_id, status=ScanStatus.QUEUED)
    db.add(scan)
    await db.commit()
    await db.refresh(scan)
    return scan


async def get_scan(db: AsyncSession, scan_id: str | uuid.UUID) -> OcrScan | None:
    return await db.get(OcrScan, scan_id)


async def confirm_scan(
    db: AsyncSession, scan: OcrScan, *, submission_id: str | uuid.UUID
) -> OcrScan:
    scan.submission_id = submission_id
    scan.status = ScanStatus.DONE
    await db.commit()
    await db.refresh(scan)
    return scan
