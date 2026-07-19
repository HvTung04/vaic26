# G.A.R.Y AI Classroom

*[Tiếng Việt](./README.vi.md)*

An adaptive tutoring platform for Vietnamese K-12 math education (aligned with the 2018 Chương
trình Giáo dục phổ thông). G.A.R.Y targets the core pain point of a crowded classroom: 35–45
students with wildly different starting levels sitting through the same lesson. Instead of
just grading right/wrong, the system diagnoses the **root cause** of each mistake, locates the
exact gap in a student's prerequisite chain, and generates a personalized practice path to
close it — while giving the teacher a class-level control panel to decide where to intervene.

The product does not replace the teacher. It adds a decision layer: automatic need-based
student grouping, priority queues for who needs help first, and a class-wide "gap radar" so the
teacher knows what to re-teach. In low-connectivity or paper-first classrooms, a teacher can
just photograph a student's worksheet — the system digitizes, grades, diagnoses, and reports.

## Why it's different

Most practice apps stop at "you got 7/10 right." G.A.R.Y answers *why*: a student missing a
grade-7 fractions question isn't just "weak at math" — the system traces it back through the
knowledge graph to a shaky grade-5 foundation, specifically in finding common denominators.

1. **Root-cause diagnosis**, not just scoring.
2. **Personalized learning paths** driven by actual knowledge gaps, not fixed tracks.
3. **Teacher-in-the-loop AI** at the classroom level, not just per-student.

## How it works

- **Knowledge Graph**: the center of the system. Nodes are curriculum skill areas mapped to the
  2018 program; edges encode prerequisite, dependency, and mistake-similarity relationships. The
  graph also holds each student's live state — mastery per node, confidence, practice/test
  history, and common error patterns.
- **Root-cause diagnosis**: on a wrong answer, the system doesn't just log "incorrect." It walks
  the prerequisite chain — wrong node X + low mastery on a parent node ⇒ suspect the parent, with
  a confidence score — instead of a generic "weak at math."
- **Deterministic mastery updates**: mastery per node is updated by a formula (accuracy,
  question difficulty, time, consistency across attempts, proximity to the current teaching
  unit) — not an LLM guess, so it stays auditable.
- **Personalized practice path**: three tiers per student — patch foundational gaps, reinforce
  bridging nodes, then apply near the actual test target — reusing one shared question bank,
  reordered per student rather than generating disjoint question sets.
- **Teacher dashboard**: priority queue (who needs help first), need-based groups (grouped by
  shared gap, not raw score), class gap radar (which nodes the class is weak on), and
  intervention suggestions (re-teach / mini-group / peer support).
- **Weekly Test → Revision Test loop**: a weekly test updates the graph and produces a new
  learning path; a revision test is then generated from that path plus the teacher's latest
  notes, checking whether the gap was actually closed.
- **Grounding / safety**: LLM output (explanations, learning-path text) must be grounded in the
  labeled content bank and current graph state — no inventing content outside the curriculum,
  and low-confidence diagnoses are surfaced as uncertain rather than asserted.

## Tech stack

**Backend** (`backend/`) — FastAPI, layered `core → db → models → schemas → repositories →
services → agents → api`.
- **Postgres** (SQLAlchemy async + Alembic) for relational/operational state: users, classes,
  questions, uploads/drafts, tests, submissions, learning paths, interventions.
- **MongoDB** for the Knowledge Graph itself: curriculum nodes/edges and per-student mastery
  state with a full history log — a better fit than relational tables for a graph that grows
  unboundedly per student × node.
- `backend/kg/` and `backend/ingestion/` hold the algorithmic core as pure functions
  (deterministic mastery formula, root-cause diagnosis, rule-based revision selection, LLM
  split/tag pipeline), orchestrated by the FastAPI service layer.
- `backend/app/services/bubblesheet/` grades scanned paper answer sheets via OpenCV against a
  fixed template (not handwriting OCR).
- LangChain / LangGraph power the learning-path generation agent; auth is bcrypt + JWT.

**Frontend** (`frontend/`) — Vite + React 19 + TypeScript + Tailwind v4 + shadcn/Radix, with a
feature-module layout (`src/modules/<domain>`) covering auth, classes, tests, test-taking,
knowledge graph, learning path, dashboard, question bank, and more. Talks to the backend over a
typed `httpClient` (JWT auth, camelCase/snake_case bridging); a few modules still run on mock
data pending matching backend endpoints — see [CLAUDE.md](./CLAUDE.md) for the current split.

## Project status

This started as an 18-hour hackathon build (see `docs/PLAN.md`) and has since grown past the
original scaffold — most of the MVP flows (upload/photo intake, OCR + tagging, root-cause
diagnosis, personalized learning path, teacher dashboard, weekly/revision test loop) are
implemented end-to-end. `AGENTS.md` at the repo root describes the original hackathon-day
scope and is out of date on stack/scope; treat `docs/API_SPEC.md` and [CLAUDE.md](./CLAUDE.md)
as current.

## Getting started

```bash
docker compose up -d
```

This builds and runs Postgres, MongoDB, the backend (`:8000`, migrations + seed run
automatically on start), and the frontend (`:3000`).

For local (non-Docker) development of each side, see [CLAUDE.md](./CLAUDE.md) — it has backend
(`uv` + `alembic` + `uvicorn` + `pytest`) and frontend (`npm run dev` / `build` / `lint`)
commands, plus seeded demo credentials.

## Docs

- `docs/SPEC.md` — full Vietnamese product spec (problem, UX principles, safety/grounding,
  business case, demo script).
- `docs/API_SPEC.md` — API contract (v2, source of truth for endpoints/schemas).
- `docs/curriculum_nodes.json` / `docs/curriculum_edges.json` — knowledge graph seed data.
- `contract.md` — DB schema + API contract summary (may lag `docs/API_SPEC.md`; verify against
  code when they disagree).
- [CLAUDE.md](./CLAUDE.md) — architecture notes and dev commands for working in this repo.
