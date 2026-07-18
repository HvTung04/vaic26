# G.A.R.Y — API Contract (v2)

> Nguồn sự thật duy nhất cho schema + API giữa BE/AI/FE. Đổi gì ở đây phải báo cả team ngay (xem [PLAN.md § 4](../docs/PLAN.md)).
> Base path: `/api/v1`. Auth: Bearer JWT trừ khi ghi chú khác. Mọi field thời gian là ISO-8601 UTC.
> Ký hiệu: `?` = optional field. `enum(...)` = tập giá trị cố định. 🔻 = cut-line, có thể bỏ nếu trễ giờ (xem [PLAN.md § 3](../docs/PLAN.md)), không chặn các domain khác.
>
> **v2 so với v1:** đồng bộ theo bản chỉnh sửa trên Google Sheet — cắt hết CRUD thủ công cho node/edge/question, gộp agent tagging + diagnosis vào pipeline nội bộ (không expose HTTP riêng), bỏ `PATCH .../nodes/{node_id}` (graph update giờ nằm trong logic chấm bài của submission). Chi tiết & lý do từng thay đổi ở [Ghi chú thiết kế](#ghi-chú-thiết-kế-contract-v2) cuối file.

## Quy ước chung

- **Pagination** (list endpoints): query `?page=1&page_size=20`, output bọc trong `{"items": [...], "total": number, "page": number, "page_size": number}`.
- **Lỗi**: `{"error": {"code": "string", "message": "string", "details"?: object}}` với HTTP status tương ứng (400/401/403/404/409/422/500).
- **Role**: `enum("student", "teacher")`. Endpoint teacher-only kiểm tra role qua JWT, không nhận `teacher_id` từ body.
- **difficulty**: `enum("easy", "medium", "hard")`. **subject**: `enum("math", ...)` (MVP chỉ Toán). **grade**: số lớp 1-12.

---

## A. Auth

Giữ cả `register` (onboarding thật cho pilot sau này) và `login` (dùng ngay cho demo với 2 tài khoản giáo viên/học sinh được seed sẵn theo PLAN.md). `register` trả token luôn để FE không phải gọi thêm `login` ngay sau khi tạo tài khoản.

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 1 | Auth | `POST /api/v1/auth/register` | Đăng ký tài khoản giáo viên hoặc học sinh, tự động đăng nhập luôn sau khi tạo | `{"username": "string", "password": "string", "full_name": "string", "role": "enum(student,teacher)", "email"?: "string"}` | `{"access_token": "string", "token_type": "bearer", "expires_in": "number", "user": {"id": "string", "username": "string", "full_name": "string", "role": "string", "created_at": "timestamp"}}` |
| 2 | Auth | `POST /api/v1/auth/login` | Đăng nhập bằng tài khoản có sẵn (kể cả 2 tài khoản seed sẵn cho demo) | `{"username": "string", "password": "string"}` | `{"access_token": "string", "token_type": "bearer", "expires_in": "number", "user": {"id": "string", "username": "string", "full_name": "string", "role": "string"}}` |
| 3 | Auth | `GET /api/v1/auth/me` | Lấy thông tin user đang đăng nhập | _(no body)_ | `{"id": "string", "username": "string", "full_name": "string", "role": "string", "class_ids": ["string"]}` |

## B. Users & Classes

Không có API tạo lớp / thêm học sinh — lớp và danh sách học sinh được **seed trực tiếp bằng script** (BE/AI 3, theo PLAN.md), API chỉ đọc.

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 4 | Users | `GET /api/v1/users/{user_id}` | Lấy hồ sơ 1 user | _(no body)_ | `{"id": "string", "username": "string", "full_name": "string", "role": "string", "email"?: "string", "created_at": "timestamp"}` |
| 5 | Classes | `GET /api/v1/classes/{class_id}` | Chi tiết lớp | _(no body)_ | `{"id": "string", "name": "string", "subject": "string", "grade": "number", "teacher_id": "string", "student_count": "number"}` |
| 6 | Classes | `GET /api/v1/classes/{class_id}/students` | Danh sách học sinh trong lớp | _(no body)_ | `{"items": [{"id": "string", "full_name": "string", "username": "string"}], "total": "number"}` |

## C. Knowledge Graph

Node/edge (quan hệ tiên quyết) **hardcode/seed trong DB** (BE/AI 2, theo PLAN.md) — không có API tạo/sửa node hay edge. API graph chỉ đọc **trạng thái mastery của từng học sinh**; việc *ghi* mastery không đi qua endpoint riêng nữa mà nằm trong logic nội bộ khi chấm submission (xem mục G, #22) — vẫn ghi log lịch sử để phục vụ #8.

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 7 | Knowledge Graph | `GET /api/v1/graph/students/{student_id}/state` | Toàn bộ trạng thái mastery của học sinh trên graph | _(no body)_ | `{"student_id": "string", "nodes": [{"node_id": "string", "node_name": "string", "mastery": "number (0-1)", "confidence": "number (0-1)", "attempts": "number", "last_updated": "timestamp", "needs_review": "boolean"}]}` |
| 8 | Knowledge Graph | `GET /api/v1/graph/students/{student_id}/nodes/{node_id}/history` | Lịch sử thay đổi trọng số 1 node — phục vụ audit + UI biểu đồ tiến bộ | _(no body)_ | `{"node_id": "string", "items": [{"mastery": "number", "confidence": "number", "reason": "enum(submission_scoring,revision_result)", "source_submission_id"?: "string", "changed_at": "timestamp"}]}` |

## D. Content Bank (đề & câu hỏi)

Không còn `GET /questions` (list), `POST/PATCH/DELETE /questions` riêng lẻ. Thay vào đó: OCR/upload sinh **draft**, giáo viên duyệt hàng loạt qua **1 endpoint approve** (#11, mới thêm — bản sheet đang thiếu bước này nên chưa có cách nào đưa draft đã tag thành câu hỏi thật trong ngân hàng). Tạo test **chỉ dùng `auto_compose`** theo `node_ids` — server tự chọn câu theo node/độ khó, giáo viên không cần duyệt từng `question_id` thủ công nên không cần list endpoint.

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 9 | Content | `POST /api/v1/content/uploads` | Giáo viên upload file đề (pdf/docx/ảnh) để pipeline OCR + tách câu + gắn nhãn (tagging chạy nội bộ, không qua HTTP riêng) | `multipart/form-data`: `{"file": "binary", "class_id"?: "string", "subject": "string", "grade": "number"}` | `{"upload_id": "string", "status": "enum(queued,processing,done,failed)", "created_at": "timestamp"}` |
| 10 | Content | `GET /api/v1/content/uploads/{upload_id}` | Trạng thái xử lý + danh sách câu hỏi đã bóc tách & gợi ý nhãn, chờ giáo viên duyệt | _(no body)_ | `{"upload_id": "string", "status": "string", "parsed_questions": [{"draft_id": "string", "text": "string", "type": "enum(mcq,short_answer)", "options"?: ["string"], "answer"?: "string", "suggested_node_id": "string", "suggested_difficulty": "string", "confidence": "number (0-1)"}], "error"?: "string"}` |
| 11 | Content | `POST /api/v1/content/uploads/{upload_id}/approve` | Giáo viên duyệt (có thể sửa nhãn/nội dung) một hoặc nhiều draft → commit thành câu hỏi thật trong ngân hàng | `{"questions": [{"draft_id": "string", "text"?: "string", "options"?: ["string"], "answer"?: "string", "node_id": "string", "difficulty": "string"}]}` | `{"upload_id": "string", "created_question_ids": ["string"], "approved_count": "number"}` |
| 12 | Content | `GET /api/v1/questions/{question_id}` | Chi tiết 1 câu hỏi (kèm đáp án, giải thích — chỉ trả cho teacher) | _(no body)_ | `{"id": "string", "text": "string", "type": "string", "options"?: ["string"], "answer": "string", "explanation"?: "string", "difficulty": "string", "node_id": "string", "source_upload_id"?: "string", "created_at": "timestamp"}` |
| 13 | Content | `POST /api/v1/tests` | Tạo bài test — auto-compose từ ngân hàng theo node + độ khó (không chọn tay từng câu) | `{"title": "string", "class_id": "string", "type": "enum(weekly,revision,practice)", "auto_compose": {"node_ids": ["string"], "count": "number", "difficulty_mix"?: {"easy": "number", "medium": "number", "hard": "number"}}}` | `{"id": "string", "title": "string", "type": "string", "class_id": "string", "question_ids": ["string"], "created_at": "timestamp"}` |
| 14 | Content | `GET /api/v1/tests/{test_id}` | Chi tiết bài test (teacher view, có đáp án) | _(no body)_ | `{"id": "string", "title": "string", "type": "string", "class_id": "string", "questions": [{"id": "string", "text": "string", "difficulty": "string", "node_id": "string", "answer": "string"}], "assigned_student_ids": ["string"]}` |
| 15 | Content | `GET /api/v1/tests?class_id=` | Danh sách bài test của giáo viên/lớp | _(query filter)_ | `{"items": [{"id": "string", "title": "string", "type": "string", "class_id": "string", "created_at": "timestamp"}], "total": "number"}` |
| 16 | Content | `POST /api/v1/tests/{test_id}/assign` | Giao bài test cho lớp hoặc danh sách học sinh cụ thể | `{"class_id"?: "string", "student_ids"?: ["string"], "due_at"?: "timestamp"}` | `{"test_id": "string", "assigned_student_ids": ["string"], "due_at"?: "timestamp"}` |

## E. AI Agents

Chỉ giữ 3 agent "sinh nội dung" cấp cao — có thể FE/BE khác gọi trực tiếp để test độc lập. **Tagging** (gắn nhãn câu hỏi) và **diagnosis** (chẩn đoán root-cause) **không còn là HTTP endpoint riêng** — chạy nội bộ bên trong #9-10 (upload → gắn nhãn draft) và #22 (chấm submission → suy root-cause + update mastery), vì hai bước này luôn cần chạy kèm bước nghiệp vụ ngay sau chứ không đứng độc lập.

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 17 | Agent: Learning Path | `POST /api/v1/agents/learning-path` | Sinh lộ trình học cá nhân từ graph state hiện tại + lộ trình tuần trước | `{"student_id": "string", "previous_path_id"?: "string"}` | `{"path_id": "string", "student_id": "string", "tiers": [{"tier": "enum(foundation,bridge,application)", "node_ids": ["string"], "recommended_question_ids": ["string"], "rationale": "string"}], "generated_at": "timestamp", "grounded_on": {"graph_snapshot_id": "string"}}` |
| 18 | Agent: Revision Test | `POST /api/v1/agents/revision-test` | Sinh đề revision test dựa trên learning path gần nhất + comment giáo viên, tạo luôn 1 `test` (type=revision) để học sinh làm qua flow chung ở mục G | `{"student_id": "string", "learning_path_id": "string", "teacher_note"?: "string", "question_count"?: "number"}` | `{"test_id": "string", "student_id": "string", "question_ids": ["string"], "difficulty_mix": {"easy": "number", "medium": "number", "hard": "number"}, "target_node_ids": ["string"]}` |
| 19 | Agent: Dashboard Insight | `GET /api/v1/agents/dashboard-insights?class_id=` | Sinh gợi ý cho teacher dashboard: priority queue, nhóm học sinh, class gap, can thiệp đề xuất | _(query `class_id`)_ | `{"class_id": "string", "priority_students": [{"student_id": "string", "urgency": "number (0-1)", "reason": "string"}], "groups": [{"group_id": "string", "node_ids": ["string"], "student_ids": ["string"]}], "class_gap_nodes": [{"node_id": "string", "weak_ratio": "number"}], "interventions": [{"id": "string", "type": "enum(re_teach,mini_group,peer_support,extra_practice)", "node_id": "string", "target_student_ids": ["string"], "rationale": "string"}], "generated_at": "timestamp"}` |

## F. OCR (bài giấy) 🔻

Bị xóa khỏi bản sheet — xác nhận là xóa nhầm, khôi phục lại ở đây. Đây là workflow nông thôn cốt lõi trong SPEC.md nên vẫn cần có contract sẵn cho BE/AI 1, nhưng đúng theo cut-line của PLAN.md (giờ 9: nếu trễ thì bỏ live OCR, dùng ảnh xử lý sẵn kể chuyện bằng video) — không chặn các domain khác nếu không kịp làm.

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 20 | OCR 🔻 | `POST /api/v1/ocr/scan` | Giáo viên upload ảnh chụp bài làm giấy để số hóa | `multipart/form-data`: `{"image": "binary", "test_id": "string", "student_id"?: "string"}` | `{"scan_id": "string", "status": "enum(queued,processing,done,failed)", "created_at": "timestamp"}` |
| 21 | OCR 🔻 | `GET /api/v1/ocr/scan/{scan_id}` | Kết quả OCR: câu trả lời đã bóc tách, chờ xác nhận | _(no body)_ | `{"scan_id": "string", "status": "string", "test_id": "string", "detected_student_id"?: "string", "answers": [{"question_id": "string", "detected_answer": "string", "confidence": "number"}], "low_confidence_flags": ["string"]}` |
| 22 | OCR 🔻 | `POST /api/v1/ocr/scan/{scan_id}/confirm` | Giáo viên xác nhận/sửa kết quả OCR → tạo `submission` (dùng chung pipeline chấm + graph update với #23) | `{"student_id": "string", "answers": [{"question_id": "string", "final_answer": "string"}]}` | `{"scan_id": "string", "submission_id": "string", "status": "enum(confirmed)"}` |

## G. Test Taking (học sinh)

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 23 | Test Taking | `GET /api/v1/students/{student_id}/tests?status=` | Danh sách bài test được giao cho học sinh (`status`: pending/done) | _(query filter)_ | `{"items": [{"test_id": "string", "title": "string", "type": "string", "due_at"?: "timestamp", "status": "enum(pending,in_progress,submitted)"}], "total": "number"}` |
| 24 | Test Taking | `GET /api/v1/tests/{test_id}/attempt` | Lấy đề để làm bài (ẩn đáp án đúng) | _(no body)_ | `{"test_id": "string", "title": "string", "questions": [{"id": "string", "text": "string", "type": "string", "options"?: ["string"]}]}` |
| 25 | Test Taking | `POST /api/v1/tests/{test_id}/submissions` | Học sinh nộp bài. Trigger nội bộ ngay sau khi nộp: chấm đúng/sai → diagnosis root-cause cho từng câu sai → ghi log + cập nhật mastery cho các node liên quan (xem #7, #8) | `{"student_id": "string", "answers": [{"question_id": "string", "answer": "string", "time_spent_seconds": "number"}]}` | `{"submission_id": "string", "test_id": "string", "student_id": "string", "status": "enum(grading,graded)", "submitted_at": "timestamp"}` |
| 26 | Test Taking | `GET /api/v1/submissions/{submission_id}` | Kết quả chấm: đúng/sai, giải thích, chuỗi root-cause, graph update đã áp dụng. `status=grading` nếu diagnosis + graph update chưa chạy xong — FE nên poll tới khi `graded` | _(no body)_ | `{"submission_id": "string", "status": "enum(grading,graded)", "score": "number", "total": "number", "results": [{"question_id": "string", "is_correct": "boolean", "correct_answer": "string", "explanation"?: "string", "root_cause_node_id"?: "string", "root_cause_chain": ["string"], "confidence"?: "number (0-1)"}], "graph_updates": [{"node_id": "string", "mastery_before": "number", "mastery_after": "number"}]}` |

## H. Learning Path & Progress (học sinh)

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 27 | Learning Path | `GET /api/v1/students/{student_id}/learning-path` | Lộ trình học hiện tại của học sinh | _(no body)_ | `{"path_id": "string", "generated_at": "timestamp", "tiers": [{"tier": "string", "node_ids": ["string"], "recommended_question_ids": ["string"], "rationale": "string"}], "status": "enum(active,completed,superseded)"}` |
| 28 | Progress | `GET /api/v1/students/{student_id}/progress?range=weekly` | Tiến trình học theo tuần/chủ đề cho học sinh tự xem | _(query `range`)_ | `{"student_id": "string", "timeline": [{"period": "string", "avg_mastery": "number", "nodes_improved": "number", "tests_taken": "number"}]}` |
| 29 | Test Taking | `GET /api/v1/students/{student_id}/test-history?range=` | Lịch sử tất cả bài test học sinh đã nộp, kèm điểm — dashboard học sinh dùng để vẽ khối "lịch sử test" (self-view; JWT phải khớp `student_id`, hoặc teacher xem qua `#36`). Khác `#23` (chỉ có `status`, không có điểm) và `#35` (cùng schema nhưng teacher-only) | _(query `range`? — lọc theo `weekly/monthly/all`, mặc định `all`)_ | `{"student_id": "string", "items": [{"test_id": "string", "title": "string", "type": "enum(weekly,revision,practice)", "score": "number", "total": "number", "submitted_at": "timestamp", "weak_node_ids": ["string"]}], "total": "number"}` |

## I. Teacher Dashboard

| STT | Domain | API Endpoint | Description | Schema Input | Schema Output |
|---|---|---|---|---|---|
| 30 | Dashboard | `GET /api/v1/teacher/classes/{class_id}/priority-queue` | Danh sách học sinh cần hỗ trợ trước, xếp theo mức khẩn cấp | _(no body)_ | `{"items": [{"student_id": "string", "full_name": "string", "urgency": "number", "reason": "string", "weak_node_ids": ["string"]}]}` |
| 31 | Dashboard | `GET /api/v1/teacher/classes/{class_id}/groups` | Nhóm học sinh theo lỗ hổng kiến thức chung | _(no body)_ | `{"items": [{"group_id": "string", "node_ids": ["string"], "node_names": ["string"], "student_ids": ["string"]}]}` |
| 32 | Dashboard | `GET /api/v1/teacher/classes/{class_id}/gap-radar` | Các node kiến thức mà số đông lớp đang yếu (dữ liệu cho radar chart) | _(no body)_ | `{"items": [{"node_id": "string", "node_name": "string", "weak_ratio": "number (0-1)", "avg_mastery": "number"}]}` |
| 33 | Dashboard | `GET /api/v1/teacher/classes/{class_id}/interventions` | Gợi ý can thiệp hiện có (re-teach, mini-group, peer support, giao bài phụ đạo) | _(no body)_ | `{"items": [{"id": "string", "type": "string", "node_id": "string", "target_student_ids": ["string"], "rationale": "string", "status": "enum(suggested,applied,dismissed)"}]}` |
| 34 | Dashboard | `POST /api/v1/teacher/interventions/{intervention_id}/apply` | Giáo viên áp dụng một can thiệp (đổi trạng thái, log lại để audit) | `{"note"?: "string"}` | `{"id": "string", "status": "enum(applied)", "applied_at": "timestamp"}` |
| 35 | Dashboard | `GET /api/v1/teacher/classes/{class_id}/results?test_id=` | Overview kết quả 1 bài test cho cả lớp | _(query `test_id`)_ | `{"test_id": "string", "class_avg_score": "number", "distribution": [{"score_range": "string", "count": "number"}], "per_node_accuracy": [{"node_id": "string", "accuracy": "number"}], "students": [{"student_id": "string", "score": "number", "status": "enum(submitted,pending)"}]}` |
| 36 | Dashboard | `GET /api/v1/teacher/students/{student_id}/results` | Kết quả chi tiết của 1 học sinh qua các bài test (teacher view) | _(no body)_ | `{"student_id": "string", "tests": [{"test_id": "string", "title": "string", "score": "number", "submitted_at": "timestamp", "weak_node_ids": ["string"]}]}` |
| 37 | Dashboard | `GET /api/v1/teacher/classes/{class_id}/progress-timeline?range=weekly` | Tiến bộ của cả lớp theo tuần/chủ đề | _(query `range`)_ | `{"class_id": "string", "timeline": [{"period": "string", "avg_mastery": "number", "tests_completed": "number", "students_improved": "number"}]}` |

---

## Ghi chú thiết kế contract (v2)

**Những gì bản sheet cắt và tôi giữ nguyên quyết định (đồng ý với hướng gọn):**

- Bỏ CRUD node/edge (#11-14 cũ) — node/edge hardcode/seed trong DB theo đúng phân công BE/AI 2 trong PLAN.md, không cần expose API tạo/sửa cho hackathon.
- Bỏ `PATCH graph/students/{id}/nodes/{id}` — thay vì có 1 endpoint ghi mastery độc lập, giờ **submission tự chấm + tự cập nhật mastery trong cùng 1 transaction nội bộ** (#25 → #7/#8). Gọn hơn, đúng với ghi chú bạn thêm ở submission trên sheet. Đánh đổi: mất khả năng giáo viên override mastery thủ công — chấp nhận được cho MVP, không thấy nhu cầu này trong luồng demo.
- Bỏ agent tagging/diagnosis dạng HTTP riêng (#29-30 cũ) — gộp vào pipeline nội bộ của upload (#9-10) và submission (#25), vì hai bước này luôn chạy kèm ngay sau bước nghiệp vụ, không có lý do để tách endpoint.

**Những gì tôi sửa lại so với bản sheet (đã chốt qua câu hỏi ở trên):**

1. **Auth** — khôi phục `login` (giữ cả `register`), vì `register`-only không đủ cho flow "2 tài khoản seed sẵn" mà PLAN.md mô tả — cần cách đăng nhập vào tài khoản có sẵn không qua đăng ký lại.
2. **OCR** — khôi phục `#20-22` (đã bị xóa nhầm), gắn nhãn 🔻 cut-line theo đúng tinh thần PLAN.md thay vì xóa hẳn khỏi contract.
3. **Question bank** — thêm `POST /content/uploads/{upload_id}/approve` (#11, hoàn toàn mới). Bản sheet bỏ hết `POST/PATCH/DELETE /questions` nhưng không để lại cách nào biến draft OCR/upload thành câu hỏi thật trong ngân hàng — nếu không có bước này, `auto_compose` (#13) sẽ không có câu nào để chọn. Đồng thời bỏ luôn nhánh `question_ids` thủ công trong `POST /tests` — chỉ còn `auto_compose`, khớp hướng đơn giản hóa bạn chọn.
4. **`GET /submissions/{id}`** (#26) — bổ sung `root_cause_chain` và `confidence` vào từng `result`, vì logic diagnosis (trước đây là agent riêng có 2 field này) giờ chạy ẩn bên trong chấm bài — output phải giữ đủ thông tin đó thay vì chỉ còn `root_cause_node_id` trơ trọi.
5. **`GET /graph/students/{id}/state`** (#7) — thêm `node_name` vào từng item để FE vẽ mastery map không phải gọi thêm API tra tên node (đỡ cần lại `GET /graph/nodes` mà bản sheet đã bỏ).
6. **`GET /students/{student_id}/test-history`** (#29, hoàn toàn mới) — Student Dashboard cần "lịch sử test" (điểm từng bài đã làm) nhưng contract cũ không có cách nào cho học sinh tự xem: `#23` chỉ trả `status` (không có điểm), và endpoint có điểm duy nhất (`#35` cũ, nay `#36`) là teacher-only. Thêm endpoint self-view riêng thay vì mở quyền học sinh gọi `#36` cho học sinh khác, để giữ đúng biên giới role. Các mục `#29-36` cũ trong phần Teacher Dashboard được renumber thành `#30-37`.

**Rủi ro còn lại cần lưu ý khi build:**

- `POST /tests/{test_id}/submissions` giờ gánh nhiều việc hơn (chấm + diagnosis + graph update) trong 1 request — nên xử lý async thật (trả `status=grading` ngay, worker chạy nền) để tránh timeout khi LLM diagnosis chậm; FE poll `GET /submissions/{id}` tới khi `graded`.
- Không còn cách nào giáo viên sửa tay mastery của học sinh (override) — nếu demo cần kịch bản "giáo viên chỉnh tay vì AI chẩn đoán sai", sẽ phải thêm lại 1 endpoint ghi có kiểm soát.
