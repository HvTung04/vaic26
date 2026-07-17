# GapLens Backend

FastAPI + Postgres (Docker). AI pipeline uses LangChain + LangGraph. Dependency management is done with [uv](https://docs.astral.sh/uv/). LLM provider is not decided yet — see [app/services/llm/provider.py](app/services/llm/provider.py) and [plan.md § 0](../plan.md).

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

The API runs at `http://localhost:8000`, Swagger docs at `http://localhost:8000/docs`.

## Quick start (local, no Docker)

Requires [uv](https://docs.astral.sh/uv/getting-started/installation/) installed. uv will fetch the right Python version automatically.

```bash
cp .env.example .env
uv sync
uv run uvicorn app.main:app --reload
```

You still need a Postgres instance reachable at `DATABASE_URL` (e.g. `docker compose up db` from this folder).

## Project layout

```
app/
  core/        settings, DB session, fake auth (2 demo accounts)
  models/      SQLAlchemy ORM = Postgres schema
  schemas/     Pydantic = API contract (see contract.md)
  api/v1/      routers, split by the person owning each area (see plan.md § 1)
  services/    business logic
    ingestion/     BE/AI 1 — exam parsing, question splitting, labeling, bubble sheet OpenCV
    graph/          BE/AI 2 — graph service, mastery update, root-cause, revision selector
    learning_path/  BE/AI 2 — learning path generation
    llm/            shared provider factory (placeholder, provider not decided yet)
  agents/      LangGraph state graphs (labeling_graph, learning_path_graph)
  seed/        seed scripts for taxonomy / question bank / fake students
alembic/       migrations
tests/         pytest
```

## Managing dependencies

```bash
uv add <package>            # add a runtime dependency
uv add --dev <package>      # add a dev-only dependency
uv sync                     # install/update the local .venv from pyproject.toml + uv.lock
uv lock --upgrade           # bump pinned versions
```

Commit `uv.lock` whenever it changes — it's what keeps everyone (and CI/Docker) on the same dependency versions.

## Migrations

```bash
docker compose exec api uv run alembic revision --autogenerate -m "init"
docker compose exec api uv run alembic upgrade head
```

## Seed data

```bash
docker compose exec api uv run python -m app.seed.run_seed
```

## Tests

```bash
docker compose exec api uv run pytest
# or locally: uv run pytest
```

## LLM provider

The provider isn't locked in yet (see plan.md § 0). `get_llm()` in `app/services/llm/provider.py` reads `LLM_PROVIDER` / `LLM_MODEL` from the environment; if they're unset it returns a `FakeListChatModel` so the rest of the pipeline still runs without crashing. Once the team picks a provider mid-hackathon, just set the env vars — no code changes needed at call sites.
