# API Contract (draft — chốt trong giờ 0-1)

> Nguồn sự thật duy nhất cho schema + API giữa 3 BE/AI. Đổi field/endpoint ở đây thì phải hét lên cho cả team — xem [plan.md § 0](../plan.md).

## Auth (fake, 2 account cố định)

Header: `Authorization: Bearer <token>` — token đọc từ `.env` (`FAKE_TEACHER_TOKEN` / `FAKE_STUDENT_TOKEN`).

| Method | Path | Role | Ghi chú |
|---|---|---|---|
| GET | `/api/v1/auth/me` | any | trả role + user_id hiện tại |

## Ingestion & bubble sheet — BE/AI 1

| Method | Path | Role | Ghi chú |
|---|---|---|---|
| POST | `/api/v1/ingestion/upload` | teacher | upload PDF/ảnh đề (multipart) → trả `job_id` |
| GET | `/api/v1/ingestion/{job_id}/status` | teacher | trạng thái tách câu + label (queued/processing/done/failed) |
| POST | `/api/v1/bubble-sheet/scan` | teacher | ảnh bubble sheet (multipart) → đáp án học sinh theo template cố định |

## Knowledge graph & diagnosis — BE/AI 2

| Method | Path | Role | Ghi chú |
|---|---|---|---|
| GET | `/api/v1/graph/nodes` | any | danh sách node kiến thức |
| GET | `/api/v1/graph/edges` | any | cạnh tiên quyết / related-error / similar |
| GET | `/api/v1/graph/students/{student_id}/mastery` | any | mastery + confidence hiện tại theo node |
| POST | `/api/v1/diagnosis/root-cause/{answer_id}` | any | chẩn đoán root-cause cho 1 câu trả lời sai |
| GET | `/api/v1/learning-path/{student_id}` | any | lộ trình học hiện tại (snapshot mới nhất) |
| POST | `/api/v1/learning-path/{student_id}/generate` | any | sinh lộ trình mới (LangGraph + LLM) |
| POST | `/api/v1/revision-test/{student_id}/generate` | any | sinh revision test rule-based (2-3 node yếu nhất) |

## Students, teacher dashboard & tests — BE/AI 3

| Method | Path | Role | Ghi chú |
|---|---|---|---|
| GET | `/api/v1/students/{student_id}` | teacher | thông tin học sinh |
| GET | `/api/v1/teachers/{teacher_id}/dashboard/priority-queue` | teacher | Student Priority Queue |
| GET | `/api/v1/teachers/{teacher_id}/dashboard/groups` | teacher | Need-based Groups |
| GET | `/api/v1/teachers/{teacher_id}/dashboard/gap-radar` | teacher | Class Gap Radar (theo node) |
| POST | `/api/v1/tests/attempts` | student | nộp bài Weekly/Revision Test → chấm + cập nhật graph |

## Việc cần chốt ở giờ 0-1

- [ ] Field chính xác của từng schema trong `app/schemas/` (đặc biệt `Question.options`, `LearningPath.path`)
- [ ] Danh sách node taxonomy (~12 node) + cạnh — từ 2 FE (chốt cùng BE/AI 2)
- [ ] Ngưỡng mastery cho root-cause (`MASTERY_THRESHOLD` trong `app/services/graph/root_cause.py`)
- [ ] Công thức mastery update chính xác (`app/services/graph/mastery.py`)
- [ ] Provider LLM (env `LLM_PROVIDER` / `LLM_MODEL`)
