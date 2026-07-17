"""
Seed 1 lớp 20 học sinh giả có câu chuyện (em Minh hổng phân số, nhóm 5 em yếu hàm số...)
kèm mastery ban đầu theo taxonomy — xem plan.md § 1 (FE-Present). Cần seed_taxonomy chạy trước.
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
