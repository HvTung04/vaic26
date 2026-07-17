"""
Seed ~12 node kiến thức + cạnh tiên quyết cho 1 chương Toán.
Chốt cùng BE/AI 2 ở giờ 0-1 (xem plan.md § 1) rồi mới điền vào đây.
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
