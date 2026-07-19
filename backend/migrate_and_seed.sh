#!/usr/bin/env bash
# Apply Alembic migrations then seed rich school data. Run from backend/.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"

alembic upgrade head
python -m app.scripts.seed_rich_school || {
  echo "Rich seed failed, falling back to minimal seed..."
  python -m app.scripts.seed_db
}
