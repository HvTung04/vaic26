# GapLens — Contract (single source of truth)

Schema + API contract. Any change here MUST be reflected in code and announced to
the team. Taxonomy node list is OWNED by BE/AI 2 (Knowledge Graph) — Role 1 consumes
it via `backend/ingestion/taxonomy.py`, does not define nodes.

## QuestionBank schema (Postgres / API)
```
Question:
  id              uuid PK
  text            text            # question body, LaTeX preserved
  options         jsonb           # [{ "key": "A", "text": "..." }, ...]
  correct_answer  text            # option key, e.g. "B"
  knowledge_node  text            # FK -> taxonomy node id (enum from taxonomy file)
  difficulty      smallint        # 1=easy 2=medium 3=hard (per taxonomy scale)
  confidence      real            # 0..1 LLM tag confidence (review aid only)
  source_type     text            # "pdf" | "photo"
  status          text            # "draft" | "approved"  (teacher review gate)
  created_at      timestamptz
```

## LLM Split schema (Role 1, OpenAI-compatible structured output)
```
SplitRequest  -> model: RawExam.text + taxonomy hint
SplitResponse:
  questions: [
    { "index": int, "text": str, "options": [str], "correct_answer": str }
  ]
# No numbering heuristics. LLM segments both PDF-text and photo-OCR uniformly.
```

## LLM Tag schema (Role 1, OpenAI-compatible structured output)
```
TaggingRequest  -> question text + options + taxonomy node list (enum)
TaggingResponse:
  knowledge_node: str   # MUST be in taxonomy enum, else reject
  difficulty:     int   # 1|2|3
  confidence:     float # 0..1
  sub_skill:      str?  # optional finer skill
# Off-enum -> retry once -> else flag low confidence for teacher review.
```

## Bank API endpoints (Role 3 owns impl; Role 1 client matches)
```
POST /questions        # bulk insert drafts (status="draft")
GET  /questions        # list/filter by node, difficulty, status
PATCH /questions/{id}  # teacher review: edit + set status="approved"
```

## Flow
upload -> parse/ocr -> [LLM split] -> [LLM tag] -> drafts (status=draft)
-> teacher reviews/edits on platform -> PATCH approved -> committed to bank.
Teacher is the review gate; no auto-commit of unverified content.
