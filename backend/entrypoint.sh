#!/usr/bin/env bash
# Docker entrypoint: migrate + seed + start server.
set -euo pipefail

echo "=== G.A.R.Y entrypoint ==="

# 1. Run Alembic migrations (stamp head if tables already exist without version)
echo "Running migrations..."
if ! alembic upgrade head 2>/dev/null; then
  echo "Migration failed — stamping head (tables likely pre-exist)"
  alembic stamp head
fi

# 2. Run rich school seed (idempotent — deletes + re-inserts)
echo "Seeding rich school data..."
python -m app.scripts.seed_rich_school || {
  echo "Rich seed failed, falling back to minimal seed..."
  python -m app.scripts.seed_db
}

# 3. Start server
echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
