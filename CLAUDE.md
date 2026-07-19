# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

G.A.R.Y — an adaptive tutoring system for Vietnamese K-12 math (Chương trình Giáo dục phổ thông
2018). Hackathon-origin repo, now built out well past scaffold stage. Product UI copy and demo
content are Vietnamese.

**`AGENTS.md` is stale** — it says `backend/` and `frontend/` are empty and describes
FastAPI+Postgres-only / Next.js / fake auth. None of that is current. Treat `docs/API_SPEC.md`
(v2, explicit "single source of truth") and this file as authoritative; `docs/PLAN.md` and
`contract.md` may also lag behind actual code.

## Architecture

**Backend** (`backend/`, FastAPI): layered `core → db → models → schemas → repositories →
services → agents → api`.

- **Two datastores, deliberate split**: Postgres (SQLAlchemy async, `app/models/*`) holds
  relational/operational state — users, classes, questions, uploads/drafts, tests, submissions,
  learning_paths, interventions. MongoDB (`app/db/mongodb.py`, collections `kg_nodes`/`kg_edges`/
  `kg_mastery`) holds the Knowledge Graph — curriculum nodes/edges seeded from
  `docs/curriculum_nodes.json`/`curriculum_edges.json`, plus per-student mastery state with a
  full history log (reason/source_submission_id per change). The graph is naturally
  document/graph-shaped and mastery history grows unboundedly per student×node, so relational
  tables would need an awkward EAV shape.
- **Reused pure-function core, not reimplemented**: `backend/kg/*` and `backend/ingestion/*`
  contain the actual algorithms as pure functions over dataclasses (deterministic mastery
  formula, root-cause prerequisite-chain diagnosis, rule-based revision selection, LLM
  split/tag pipeline) — predate the FastAPI app and are consumed by it, not duplicated inside
  it. `app/services/kg_service.py` is the bridge from Mongo docs to those dataclasses
  (`kg.graph.build_graph` exists specifically to build a `Graph` from Mongo-sourced dicts
  instead of only the JSON fixtures). `app/services/grading_service.py`, `agent_service.py`,
  `content_service.py` orchestrate the pure functions against the two DBs.
- **Core domain model**: Knowledge Graph nodes = curriculum skill areas (mapped to the 2018
  curriculum), edges = prerequisite/dependency/mistake-similarity. Mastery update is
  deterministic (formula, not LLM). Root-cause diagnosis traces prerequisites: wrong node X +
  low parent mastery ⇒ suspect the parent, with a confidence score. Revision-test selection is
  rule-based (2–3 weakest nodes, easy→hard). Learning path generation feeds graph state to an
  LLM (LangGraph agent in `app/agents/learning_path_graph.py`) for explanation + review order —
  the LLM must never invent content outside the labeled bank/graph; low confidence states
  uncertainty rather than guessing.
- **Bubble sheet grading** (`app/services/bubblesheet/`): OpenCV against a fixed template, not
  handwriting OCR.
- **Gotcha**: `Question.answer` stores the literal option **text**, not an "A"/"B" key — the
  student-facing attempt endpoint returns `options` as a plain string list with no keys, so
  `grading_service.py` string-compares directly.
- Auth is real bcrypt + JWT (`app/core/security.py`), not the fake auth `AGENTS.md` describes.

**Frontend** (`frontend/`): Vite + React 19 + TypeScript + Tailwind v4 + shadcn/Radix, not
Next.js. Feature-module layout under `src/modules/<domain>/{components,hooks,services}`
(auth, classes, tests, testTaking, knowledgeGraph, learningPath, dashboard, question-bank,
assessment, ocr, revision, upload, studentSelf). Routing in `src/routes/index.tsx`; `/dashboard`
is teacher-only, `/student` is student-only, both gated by `RequireAuth`.

- **`src/services/httpClient.ts`** is the real API layer: prefixes `env.apiBaseUrl`
  (`VITE_API_BASE_URL`, default `http://localhost:8000/api/v1` via `.env.local`), attaches the
  Bearer JWT, normalizes both error shapes (`{error:{code,message}}` and FastAPI `{detail}`)
  into `ApiError`, and deep-camelCases response keys so snake_case API payloads land directly on
  camelCase FE types. **Request bodies are not auto-snaked** — build snake_case bodies by hand.
- `src/services/mockClient.ts` is the original mock layer some modules still depend on.
  **Live on the real API**: classes, tests (list/results/edit-read/submission detail), student
  test-taking (exam console attempt→submit→poll→score report), knowledge graph state, learning
  path, revision-test agent. **Still mock/bespoke** (backend has no matching endpoints):
  `TeacherOverview` in dashboard, StudentInsights, question-bank CRUD (backend only has
  `GET /questions/{id}` + uploads→approve, no list/create/update), assessment module. Don't
  assume a module maps 1:1 onto a REST resource — check whether it's on `httpClient` or
  `mockClient` before extending it.
- Real user identity comes from `useAuth().user` (id, classIds); there are no hardcoded
  student/class ID constants anymore.
- Known backend/FE mismatches already worked around in FE mappers: `GET /tests` list lacks
  status/counts (enriched from the class-results endpoint); teacher test-edit has no save
  endpoint (`updateTestQuestions()` throws a clear `ApiError`); teacher `GET /tests/{id}` has
  `node_id` but no `node_name`; `/students/{id}/results` score is a bare percentage (mapped to
  `score=pct, total=100`).

## Commands

### Backend (`backend/`)

```bash
docker compose up -d                                   # from repo root: Postgres + Mongo (+ full stack)
uv venv --python 3.12 .venv && uv pip install -e ".[test]"
alembic upgrade head                                    # or: ./migrate_and_seed.sh (migrate + seed)
python -m app.scripts.seed_rich_school                  # idempotent rich seed (falls back to seed_db)
uvicorn app.main:app --reload                            # http://localhost:8000, docs at /docs
pytest                                                   # all tests (pythonpath=., asyncio_mode=auto)
pytest tests/test_kg_mastery.py                          # single file
pytest tests/test_kg_mastery.py::test_name               # single test
```

Seed creds: `teacher1` / `student1`..`student20`, password `gaplens123`.

Health check: `GET /health`. If endpoints that exist in source 404, suspect a stale
`uvicorn` without `--reload` before debugging the code.

### Frontend (`frontend/`)

```bash
npm run dev       # Vite dev server, proxies /api -> localhost:8000
npm run build      # tsc -b && vite build
npm run lint       # oxlint
npm run preview
```

Note: pre-existing broken merge-artifact files exist in the assessment/dashboard hook trees
that fail `tsc -b`; they're orphaned (not imported anywhere) so `npm run dev` is unaffected.

### Full stack

`docker compose up -d` from repo root builds and runs Postgres, Mongo, backend (:8000), and
frontend (:3000, nginx). Backend container entrypoint runs Alembic migrations + rich seed on
every start (idempotent) before launching uvicorn.

## Contract discipline

`contract.md` (root) is meant to be the DB schema + API contract source of truth that both ends
generate code against — but `docs/API_SPEC.md` v2 supersedes it where they disagree. Verify
against actual repo state (`git log`, endpoint routers, models) rather than trusting either doc
blindly when they conflict.
