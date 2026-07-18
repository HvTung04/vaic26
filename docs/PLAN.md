# GapLens — Kế hoạch thi hackathon (18 giờ)

> Bám theo [spec.md](./spec.md). Tài liệu này là kế hoạch **thực thi** trong khung giờ hackathon, không thay thế spec — mọi quyết định kỹ thuật/nội dung phải quy chiếu về spec khi có mâu thuẫn.

## 0. Quyết định trước khi gõ phím (chốt trong 15 phút đầu, không tranh luận)

- **Stack:** FastAPI + Postgres (Docker) cho backend/AI, Next.js + Tailwind cho FE, deploy Railway + Vercel.
- **LLM:** LLM API với structured output cho labeling (tagging vùng kiến thức + độ khó) và sinh lời giải thích / learning path.
- **Bubble sheet:** đọc bằng OpenCV template cố định — **không** đụng OCR chữ viết tay.
- **Nguyên tắc vàng:** giờ 0-1 cả team chốt schema + API contract rồi mới tách ra làm. Với coding agent, contract rõ = 80% tốc độ — agent tự sinh code hai đầu khớp nhau. Contract lưu 1 file markdown trong repo (`contract.md`), ai đổi phải hét lên trong group.
- **Insight quan trọng nhất:** bottleneck không phải code — là **content**. Cần: knowledge graph taxonomy, ngân hàng ~60-80 câu hỏi đã label, seed data cho 1 lớp 20 học sinh giả có câu chuyện. Không có content thì demo trống trơn dù code chạy hoàn hảo. Vì vậy 2 bạn FE (kiêm presenter) không được ngồi chờ backend rồi mới lo content — content chạy song song với build FE.

## 1. Phân việc theo người

Team có 5 người: 3 BE/AI + 2 FE. Không có Presenter riêng — cả 2 FE đều lên sóng thuyết trình, một bạn thiên về **design** (hình ảnh, slide, demo template), một bạn thiên về **present** (kịch bản, pitch, Q&A, người đứng nói).

| Người | Vai trò | Việc chính |
|---|---|---|
| **BE/AI 1** | Input pipeline | Upload đề (PDF/ảnh) → tách câu → gọi LLM label vùng kiến thức + độ khó theo taxonomy cố định (JSON schema, bắt chọn từ node list) → đổ vào question bank. Sau đó: OpenCV đọc bubble sheet từ ảnh chụp. |
| **BE/AI 2** | Não của sản phẩm | Graph service (node + cạnh tiên quyết hardcode); công thức mastery update deterministic; root-cause = truy vết prerequisite (sai node X + mastery node cha < ngưỡng → nghi hổng node cha, kèm confidence); revision test selector rule-based (2-3 node yếu nhất, thang dễ→khó); learning path = graph state đưa vào LLM sinh lời giải thích + thứ tự ôn. |
| **BE/AI 3** | Xương sống | Schema Postgres; toàn bộ API theo contract; auth fake 2 account (1 giáo viên, 1 học sinh); script seed data; deploy sớm từ giờ 2 và giữ nó sống; tích hợp giúp hai bạn BE/AI kia. |
| **FE-Design** | FE (Teacher Dashboard) + Presenter (design) | **Build:** Teacher Dashboard (priority queue, need-based groups, class gap radar — radar chart theo node), chịu trách nhiệm UX system/visual direction/motion cho toàn bộ FE theo [spec.md § Phong cách thiết kế](./spec.md) (premium, ít ma sát, không nhàm chán). **Content/Story:** thiết kế bubble sheet template in ra, dựng slide (hình ảnh + layout), quay/dựng video backup demo. **Chung:** giờ đầu ngồi cùng BE/AI 2 chốt taxonomy; soạn ~30-40 câu trong ngân hàng câu hỏi. Build trên mock data theo contract từ giờ 1, không chờ backend. |
| **FE-Present** | FE (Student view) + Presenter (nói) | **Build:** Student view (làm test + xem learning path + graph mastery của mình), state management, offline UI behavior. **Content/Story:** viết hồ sơ 20 học sinh giả có câu chuyện (em Minh hổng phân số, nhóm 5 em yếu hàm số...), viết kịch bản demo 4 phút (xem [spec.md § Live Demo Strategy](./spec.md)), chuẩn bị Q&A card 6 đòn, là người trực tiếp thuyết trình + tập dợt pitch. Nếu quen giáo viên nào: gửi 10 chẩn đoán xin ý kiến để lấy con số agreement rate. **Chung:** giờ đầu ngồi cùng BE/AI 2 chốt taxonomy; soạn ~30-40 câu còn lại trong ngân hàng câu hỏi. Build trên mock data theo contract từ giờ 1, không chờ backend. |

**Lưu ý đối chiếu spec:** spec.md chia 5 vai trò theo tên khác (AI Engineer 1/2, Frontend Engineer, Design+Frontend, Backend Engineer) — cách chia ở trên là cách vận hành thực tế cho khung giờ hackathon với team thật (3 BE/AI + 2 FE, không có Presenter riêng), vẫn phủ đủ 3 tầng AI Service Layer / Knowledge Graph Service / Content Bank cũng như 2 vai trò FE (functional vs design) trong spec.

## 2. Timeline

| Giờ | Mốc | Mục tiêu |
|---|---|---|
| **0-1** | Kickoff | Chốt taxonomy sơ bộ, schema, API contract, dựng repo + CI + deploy skeleton. Ra khỏi phòng họp là mỗi người có việc rõ. |
| **1-6** | Build song song | Mỗi người + coding agent cày module của mình trên mock data. **Milestone giờ 6:** pipeline label chạy được với 10 câu thật; công thức mastery + root-cause chạy được bằng unit test; API core sống trên deploy; FE hiển thị dashboard bằng mock; taxonomy + 40 câu hỏi xong. |
| **6-9** | Tích hợp lần 1 | Một đường dữ liệu end-to-end: upload đề → label → học sinh làm test trên app → graph update → dashboard hiện số thật. Chưa cần đẹp, cần chạy. **Đây là điểm rủi ro nhất** — cả 3 BE dồn vào nếu kẹt. |
| **9-14** | Vòng hai | BE/AI 1 làm bubble sheet OCR; BE/AI 2 làm revision test + learning path LLM; BE/AI 3 seed full data 20 học sinh + vá lỗi tích hợp; FE-Design polish Teacher Dashboard cho ra chất premium (lúc ăn điểm thị giác, xem [spec.md § Phong cách thiết kế](./spec.md)) + dựng slide + quay các cảnh khó làm live; FE-Present polish Student view + hoàn thiện hồ sơ 20 học sinh + kịch bản demo + Q&A card. |
| **14-16** | Đóng băng tính năng | Chạy đúng kịch bản demo 4 phút từ đầu đến cuối 3 lần trên môi trường deploy. Lỗi gì hiện ra thì sửa lỗi đó, **không thêm tính năng mới** — luật, ai vi phạm mời đi mua nước cho team. |
| **16-18** | Tập trận | Quay video backup toàn bộ demo (mạng hội trường luôn phản bội mình) — FE-Design phụ trách dựng video. FE-Present chạy pitch chính, cả team đóng vai giám khảo hỏi xoáy theo 6 Q&A card ([spec.md § Q&A chuẩn bị sẵn](./spec.md)). Ngủ được 30 phút thì ngủ. |

## 3. Cut line — trễ giờ nào cắt cái đó, không tiếc

| Trễ đến giờ | Cắt | Thay bằng |
|---|---|---|
| 9 | Bubble sheet OCR live | Ảnh chụp sẵn xử lý trước, kể chuyện bằng video |
| 12 | Learning path LLM | Template text theo trạng thái graph — không ai nhận ra đâu |
| 14 | Student app riêng | Gộp student view thành 1 tab trong dashboard |

**Không bao giờ cắt:** dashboard giáo viên, graph update chạy thật, đường demo end-to-end. (Đây là 3 trụ cốt lõi của spec — MVP phải có, xem [spec.md § Định nghĩa MVP](./spec.md).)

## 4. Ghi chú cho coding agent

- Mỗi module bắt agent viết luôn seed/test script để chạy độc lập được — lúc tích hợp giờ 6 sẽ biết ơn chuyện này.
- Contract (`contract.md`) là nguồn sự thật duy nhất cho schema + API. Đổi contract giữa chừng phải báo cả team ngay.