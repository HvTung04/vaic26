# G.A.R.Y AI Classroom

*[English](./README.md)*

Một hệ thống dạy kèm thích ứng cho giáo dục phổ thông Việt Nam (bám theo Chương trình Giáo dục
phổ thông 2018), tập trung vào toán học. G.A.R.Y giải quyết đúng vấn đề lõi của một lớp học
đông: 35–45 học sinh với trình độ đầu vào rất khác nhau nhưng cùng nghe một bài giảng. Thay vì
chỉ chấm đúng/sai, hệ thống chẩn đoán **nguyên nhân gốc** của từng lỗi, xác định chính xác học
sinh đang hổng ở đâu trong chuỗi kiến thức tiên quyết, rồi sinh lộ trình luyện tập cá nhân hóa
để vá đúng lỗ hổng đó — đồng thời cho giáo viên một lớp điều khiển ở cấp lớp học để quyết định
cần can thiệp ở đâu.

Sản phẩm không thay thế giáo viên. Nó thêm một lớp ra quyết định: tự động nhóm học sinh theo nhu
cầu, ưu tiên ai cần hỗ trợ trước, và một "class gap radar" cho cả lớp để giáo viên biết cần dạy
lại phần nào. Ở vùng mạng yếu hoặc lớp học vẫn làm bài trên giấy, giáo viên chỉ cần chụp ảnh bài
làm — hệ thống sẽ số hóa, chấm, chẩn đoán và báo cáo.

## Điểm khác biệt

Phần lớn app luyện đề dừng ở "bạn làm đúng 7/10 câu". G.A.R.Y trả lời câu hỏi *vì sao*: một học
sinh sai câu phân số lớp 7 không phải vì "yếu toán" chung chung — hệ thống truy ngược qua
knowledge graph để chỉ ra nền tảng quy đồng mẫu số ở lớp 5 đang chưa vững.

1. **Chẩn đoán nguyên nhân gốc** thay vì chỉ chấm điểm.
2. **Lộ trình học cá nhân hóa** theo lỗ hổng kiến thức thật, không theo tuyến cố định.
3. **Teacher-in-the-loop AI** ở cấp lớp học, không chỉ ở cấp từng học sinh.

## Cách hoạt động

- **Knowledge Graph**: trung tâm của hệ thống. Mỗi node là một vùng kiến thức/kỹ năng bám theo
  chương trình 2018; mỗi cạnh mô tả quan hệ tiên quyết, phụ thuộc, hoặc tương đồng sai lầm.
  Graph cũng lưu trạng thái sống của từng học sinh: mức thành thạo theo node, độ tin cậy, lịch
  sử luyện tập/kiểm tra, và kiểu lỗi thường gặp.
- **Chẩn đoán root-cause**: khi học sinh làm sai, hệ thống không chỉ ghi nhận "sai". Nó truy vết
  chuỗi tiên quyết — sai node X + mastery của node cha thấp ⇒ nghi ngờ node cha, kèm điểm tin
  cậy — thay vì kết luận chung chung "yếu toán".
- **Cập nhật mastery deterministic**: mức thành thạo mỗi node được cập nhật theo công thức (độ
  chính xác, độ khó câu hỏi, thời gian làm bài, độ ổn định qua nhiều lần, độ liên quan tới đơn vị
  bài học hiện tại) — không phải LLM đoán, nên luôn kiểm chứng được.
- **Lộ trình luyện tập cá nhân hóa**: ba tầng cho mỗi học sinh — bù nền tảng, củng cố node cầu
  nối, rồi luyện ứng dụng sát mục tiêu kiểm tra — dùng chung một ngân hàng câu hỏi nhưng điều
  phối thứ tự riêng cho từng em, thay vì sinh đề rời rạc cho mỗi người.
- **Teacher dashboard**: priority queue (ai cần hỗ trợ trước), need-based groups (nhóm theo lỗ
  hổng chung, không theo điểm số thô), class gap radar (cả lớp đang yếu ở node nào), và gợi ý
  can thiệp (dạy lại / nhóm nhỏ / hỗ trợ bạn bè).
- **Vòng lặp Weekly Test → Revision Test**: bài kiểm tra tuần cập nhật graph và sinh lộ trình
  học mới; revision test sau đó được sinh từ lộ trình đó cộng ghi chú mới nhất của giáo viên, để
  kiểm chứng lỗ hổng đã được vá thật hay chưa.
- **Grounding / an toàn**: mọi output của LLM (lời giải thích, nội dung lộ trình học) phải bám
  vào ngân hàng nội dung đã gắn nhãn và trạng thái graph hiện tại — không tự bịa kiến thức ngoài
  chương trình, và khi độ tin cậy thấp hệ thống phải nói rõ là không chắc chắn thay vì khẳng định.

## Công nghệ sử dụng

**Backend** (`backend/`) — FastAPI, phân lớp `core → db → models → schemas → repositories →
services → agents → api`.
- **Postgres** (SQLAlchemy async + Alembic) lưu trạng thái quan hệ/vận hành: users, classes,
  questions, uploads/drafts, tests, submissions, learning paths, interventions.
- **MongoDB** lưu chính Knowledge Graph: node/cạnh của chương trình học và trạng thái mastery
  từng học sinh kèm lịch sử đầy đủ — phù hợp hơn bảng quan hệ vì graph tăng không giới hạn theo
  từng cặp học sinh × node.
- `backend/kg/` và `backend/ingestion/` chứa phần lõi thuật toán dưới dạng pure function (công
  thức mastery deterministic, chẩn đoán root-cause, chọn câu ôn tập rule-based, pipeline LLM
  split/tag), được lớp service của FastAPI điều phối.
- `backend/app/services/bubblesheet/` chấm phiếu trả lời trắc nghiệm chụp từ giấy bằng OpenCV
  trên template cố định (không phải OCR chữ viết tay).
- LangChain / LangGraph vận hành agent sinh lộ trình học; xác thực dùng bcrypt + JWT.

**Frontend** (`frontend/`) — Vite + React 19 + TypeScript + Tailwind v4 + shadcn/Radix, tổ chức
theo module tính năng (`src/modules/<domain>`) gồm auth, classes, tests, test-taking, knowledge
graph, learning path, dashboard, question bank, và nhiều hơn nữa. Gọi backend qua một
`httpClient` có kiểu (JWT auth, tự chuyển đổi camelCase/snake_case); một vài module vẫn chạy
trên dữ liệu giả lập chờ backend có endpoint tương ứng — xem [CLAUDE.md](./CLAUDE.md) để biết
trạng thái hiện tại.

## Tình trạng dự án

Dự án khởi đầu là một bản build hackathon 18 giờ (xem `docs/PLAN.md`) và đã phát triển vượt xa
scaffold ban đầu — phần lớn các luồng MVP (upload/chụp ảnh bài, OCR + gắn nhãn, chẩn đoán
root-cause, lộ trình học cá nhân hóa, teacher dashboard, vòng lặp weekly/revision test) đã được
cài đặt end-to-end. `AGENTS.md` ở gốc repo mô tả phạm vi hackathon ban đầu và đã lỗi thời về
stack/scope; hãy coi `docs/API_SPEC.md` và [CLAUDE.md](./CLAUDE.md) là bản hiện hành.

## Bắt đầu

```bash
docker compose up -d
```

Lệnh này build và chạy Postgres, MongoDB, backend (`:8000`, tự chạy migration + seed khi khởi
động), và frontend (`:3000`).

Để phát triển từng phần cục bộ (không dùng Docker), xem [CLAUDE.md](./CLAUDE.md) — có sẵn lệnh
cho backend (`uv` + `alembic` + `uvicorn` + `pytest`) và frontend (`npm run dev` / `build` /
`lint`), cùng tài khoản demo đã seed sẵn.

## Tài liệu

- `docs/SPEC.md` — spec sản phẩm đầy đủ bằng tiếng Việt (vấn đề, nguyên tắc UX, an toàn/
  grounding, tính khả thi kinh doanh, kịch bản demo).
- `docs/API_SPEC.md` — API contract (v2, nguồn sự thật cho endpoint/schema).
- `docs/curriculum_nodes.json` / `docs/curriculum_edges.json` — dữ liệu seed cho knowledge graph.
- `contract.md` — tóm tắt DB schema + API contract (có thể trễ hơn `docs/API_SPEC.md`; đối
  chiếu với code khi có mâu thuẫn).
- [CLAUDE.md](./CLAUDE.md) — ghi chú kiến trúc và lệnh phát triển khi làm việc trong repo này.
