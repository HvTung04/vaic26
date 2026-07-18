# AGENTS.md

G.A.R.Y AI Classroom — adaptive tutoring system for Vietnamese K-12 (Chương trình
Giáo dục phổ thông 2018). The repo is a hackathon scaffold; `backend/` and
`frontend/` are empty. Source of truth for product intent lives in `docs/SPEC.md`
(product spec) and `docs/PLAN.md` (18h execution plan). Trust those over guesses.

## Stack (decided, do not re-litigate)
- Backend / AI: FastAPI + Postgres (Docker).
- Frontend: Next.js + Tailwind.
- Deploy: Railway (backend) + Vercel (frontend).
- LLM: structured output for (a) tagging questions (knowledge area + difficulty
  against a fixed taxonomy) and (b) generating explanations / learning paths.
- Bubble sheet reading: OpenCV on a fixed template. NOT handwriting OCR.
- Auth: fake, two seeded accounts — one teacher, one student.

## Mandatory contract file
- Create/keep `contract.md` at repo root as the single source of truth for DB
  schema + API contract. Any schema or endpoint change must be reflected there
  first and announced to the team. Both ends generate code against it.
- Lock taxonomy + schema + API contract before splitting work. Contract clear =
  both ends auto-align.

## Core domain model (not obvious from filenames)
- Knowledge Graph is the center: nodes = knowledge/skill areas, edges = prerequisite
  / dependency / mistake-similarity. Map every node to the 2018 curriculum.
- Mastery update is DETERMINISTIC (formula, not LLM). Root-cause diagnosis =
  trace prerequisites (wrong node X + parent mastery < threshold => suspect parent,
  with confidence). Revision-test selector is rule-based (2-3 weakest nodes, easy→hard).
- Learning path: graph state fed to LLM to generate explanation + review order.

## Grounding / safety guardrails (hard rules)
- LLM must NOT invent knowledge or answers outside the labeled content bank /
  knowledge graph. Every recommendation must point to a specific graph node or
  source. Low confidence => state uncertainty, fall back to a safer suggestion.
- Keep inference vs observed data clearly separated. Log every intervention decision.

## Content is the bottleneck, not code
- Seed early: fixed taxonomy, ~60-80 pre-labeled questions, one class of ~20 fake
  students with stories. Demo is empty without it.
- FE must build on mock data matching `contract.md` from hour 1 — do not block on backend.
- Each module should ship with its own seed/test script so it runs standalone.

## MVP must-haves (never cut)
Upload/photo input, basic OCR+tagging, root-cause diagnosis, personalized learning
path, teacher dashboard (priority queue / need-based groups / class gap radar),
weekly revision loop, minimal offline/low-bandwidth flow.

## Conventions
- Product UI copy and demo are Vietnamese; expect Vietnamese user-facing strings.
- Docs are partly Vietnamese — read `docs/SPEC.md` § "Phong cách thiết kế" for the
  required premium, low-friction, motion-light visual direction before building UI.
- No `opencode.json` yet; add repo-specific instructions there if they grow.
