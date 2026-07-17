"""
Seed 60-80 câu hỏi đã label vào question bank — 2 FE (FE-Design/FE-Present) soạn ~30-40
câu mỗi người, lấy đề thật (xem plan.md § 1). Cần seed_taxonomy chạy trước.
TODO.
"""

from app.core.database import SessionLocal


def run() -> None:
    db = SessionLocal()
    try:
        raise NotImplementedError
    finally:
        db.close()


if __name__ == "__main__":
    run()
