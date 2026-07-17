from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.security import require_teacher

router = APIRouter()


@router.post("/scan", dependencies=[Depends(require_teacher)])
async def scan_bubble_sheet(file: UploadFile) -> dict:
    """
    Đọc bubble sheet từ ảnh chụp bằng OpenCV template cố định (không OCR chữ viết tay).
    BE/AI 1 — xem app/services/ingestion/bubble_sheet_reader.py.
    """
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="TODO: BE/AI 1")
