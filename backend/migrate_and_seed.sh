#!/usr/bin/env bash
# Apply Alembic migrations then seed demo data. Run from backend/.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

alembic upgrade head
python -m app.scripts.seed_db
