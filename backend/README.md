# GapLens Backend

FastAPI + Postgres (Docker). Pipeline AI dùng LangChain + LangGraph. LLM provider chưa chốt — xem [app/services/llm/provider.py](app/services/llm/provider.py) và [plan.md § 0](../plan.md).

## Quick start

```bash
cp .env.example .env
docker compose up --build
```

API chạy ở `http://localhost:8000`, docs (Swagger) tại `http://localhost:8000/docs`.

## Cấu trúc

```
app/
  core/        cấu hình, DB session, fake auth (2 account demo)
  models/      SQLAlchemy ORM = schema Postgres
  schemas/     Pydantic = API contract (xem contract.md)
  api/v1/      routers, chia theo người phụ trách (xem plan.md § 1)
  services/    business logic
    ingestion/     BE/AI 1 — parse đề, tách câu, labeling, bubble sheet OCV
    graph/          BE/AI 2 — graph service, mastery update, root-cause, revision selector
    learning_path/  BE/AI 2 — sinh learning path
    llm/            provider factory dùng chung (placeholder, chưa chốt provider)
  agents/      LangGraph state graphs (labeling_graph, learning_path_graph)
  seed/        script seed taxonomy / question bank / học sinh giả
alembic/       migrations
tests/         pytest
```

## Migration

```bash
docker compose exec api alembic revision --autogenerate -m "init"
docker compose exec api alembic upgrade head
```

## Seed data

```bash
docker compose exec api python -m app.seed.run_seed
```

## Test

```bash
docker compose exec api pytest
```

## LLM provider

Provider chưa chốt (xem plan.md § 0). `get_llm()` trong `app/services/llm/provider.py` đọc `LLM_PROVIDER` / `LLM_MODEL` từ env; nếu để trống sẽ trả về `FakeListChatModel` để phần còn lại của code vẫn chạy được không lỗi import/crash. Khi chốt provider giữa chừng, chỉ cần set env — không cần sửa code gọi `get_llm()`.
