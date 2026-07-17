# GapLens AI Classroom

## Tóm tắt sản phẩm

GapLens AI Classroom là một hệ thống dạy kèm thích ứng cho giáo dục phổ thông Việt Nam, được thiết kế để giải quyết đúng vấn đề lõi trong một lớp học đông: cùng một bài giảng nhưng trình độ đầu vào của học sinh chênh lệch rất lớn. Thay vì chỉ chấm đúng/sai, hệ thống chẩn đoán nguyên nhân gốc của lỗi, xác định học sinh đang hổng ở đâu trong chuỗi kiến thức, rồi tạo lộ trình luyện tập cá nhân hóa để lấp đúng lỗ hổng đó.

Sản phẩm không thay thế giáo viên. Nó tăng sức mạnh cho giáo viên bằng một lớp điều khiển riêng: tự động nhóm học sinh theo nhu cầu thực tế, ưu tiên ai cần hỗ trợ trước, và phát hiện lỗ hổng kiến thức chung của cả lớp để giáo viên quyết định phần nào cần dạy lại. Với vùng nông thôn hoặc điều kiện mạng yếu, giáo viên có thể chỉ cần chụp ảnh bài làm của học sinh; hệ thống sẽ số hóa, chấm, phân tích và tạo báo cáo. Với môi trường thành thị, toàn bộ quy trình này vẫn chạy mượt trên web/app và mở rộng được cho quy mô lớn.

Mục tiêu của sản phẩm là trở thành một hạ tầng lớp học AI-native: ít thao tác, phản hồi nhanh, cá nhân hóa sâu, nhưng luôn bám vào chương trình Giáo dục phổ thông 2018 và có kiểm soát chặt chẽ độ tin cậy đầu ra.

## Vấn đề cần giải quyết

Vấn đề lớn nhất của giáo dục phổ thông Việt Nam không phải thiếu nội dung, mà là độ lệch năng lực trong cùng một lớp học. Một giáo viên phải dạy 35-45 học sinh với nền tảng rất khác nhau. Học sinh yếu bị bỏ lại phía sau vì không theo kịp nhịp lớp, trong khi học sinh khá bị chậm lại vì phải chờ đợi. Những app học hiện tại thường đi theo tuyến cố định, dừng ở mức “đúng/sai”, không giải thích được vì sao học sinh sai và càng không biết phải học bù ở đâu.

GapLens giải quyết khoảng trống này bằng ba nguyên tắc:

1. Chẩn đoán nguyên nhân gốc thay vì chỉ ghi nhận kết quả.
2. Tạo lộ trình học cá nhân theo hổng kiến thức thật sự.
3. Hỗ trợ giáo viên ở cấp lớp học, không chỉ ở cấp học sinh.

## Định vị sản phẩm

Đây không phải một app luyện đề thông thường. GapLens là một hệ điều hành cho lớp học thích ứng:

- Với học sinh: một gia sư cá nhân biết mình sai ở đâu, phải ôn gì trước, và nên luyện dạng nào tiếp theo.
- Với giáo viên: một bảng điều khiển lớp học giúp ra quyết định sư phạm nhanh hơn, không cần đọc từng bài thủ công.
- Với trường học và trung tâm: một lớp dữ liệu có thể đo được tiến bộ theo chuẩn chương trình, theo nhóm lớp, và theo từng chủ đề kiến thức.

## AI-Native Architecture

### 1. Mô hình kiến thức dạng Graph

Trung tâm của hệ thống là Knowledge Graph kiến thức bám theo chương trình 2018. Mỗi node là một vùng kiến thức hoặc kỹ năng con; mỗi cạnh mô tả quan hệ tiên quyết, phụ thuộc, hoặc tương đồng sai lầm. Ví dụ: sai phân số ở lớp 7 có thể truy ngược về hổng quy đồng, so sánh phân số, hoặc phép chia cơ bản từ lớp dưới.

Graph này không chỉ lưu nội dung, mà còn lưu trạng thái học tập của từng học sinh:

- mức độ thành thạo theo từng node
- độ chắc chắn của mô hình khi suy luận
- lịch sử luyện tập và kiểm tra
- tốc độ làm bài
- kiểu sai phổ biến
- mức cần ôn lại của từng kỹ năng

### 2. Chẩn đoán lỗi theo root-cause

Khi học sinh làm một câu sai, hệ thống không dừng ở nhãn “sai”. Nó thực hiện một chuỗi suy luận:

- xác định câu hỏi thuộc node kiến thức nào
- đối chiếu với các node tiền quyết
- kiểm tra mẫu lỗi đã từng xảy ra trước đó
- suy ra node gốc có khả năng bị hổng cao nhất
- cập nhật xác suất thành thạo cho các node liên quan

Kết quả là hệ thống có thể nói: học sinh sai câu lớp 7 không phải vì “yếu toán” chung chung, mà vì đang thiếu nền phân số lớp 5, đặc biệt ở kỹ năng quy đồng và rút gọn.

### 3. Personalized practice path

Sau chẩn đoán, hệ thống sinh lộ trình học riêng cho từng học sinh. Lộ trình này có ba tầng:

- Bù nền tảng: các node gốc cần vá trước.
- Củng cố trung gian: các node cầu nối giữa kiến thức cũ và kiến thức hiện tại.
- Luyện ứng dụng: bài tập sát mục tiêu kiểm tra/thi, nhưng chỉ mở ra khi nền tảng đủ vững.

Không phải mỗi học sinh một bộ đề hoàn toàn khác nhau theo kiểu rời rạc. Thay vào đó, hệ thống tái sử dụng cùng một ngân hàng bài, nhưng điều phối thứ tự, độ khó, mật độ và loại phản hồi theo trạng thái của từng em. Cách làm này vừa cá nhân hóa sâu vừa giữ được khả năng mở rộng.

### 4. Teacher-in-the-loop AI

AI không tự động quyết định thay giáo viên. Nó đóng vai trò trợ lý ra quyết định:

- đề xuất học sinh cần hỗ trợ trước
- gom nhóm học sinh theo lỗ hổng chung
- đề xuất phần kiến thức cần dạy lại ở cấp lớp
- tóm tắt tiến độ theo tuần, theo chủ đề, theo mức can thiệp cần thiết

Điều này tạo ra một vòng lặp lớp học mới: kiểm tra nhanh -> phân tích -> dạy bù đúng chỗ -> kiểm tra lại -> cập nhật graph.

## Luồng sử dụng chi tiết

### Luồng 1: Giáo viên tạo đề hoặc nhập bài kiểm tra

Giáo viên có thể:

- upload file đề
- chụp ảnh bài kiểm tra giấy của học sinh
- chọn bài từ ngân hàng đề có sẵn
- nhập ghi chú sư phạm bằng ngôn ngữ tự nhiên

Hệ thống sau đó sẽ:

- OCR nội dung nếu đầu vào là ảnh
- tách câu hỏi, đáp án, và phần hướng dẫn
- gắn nhãn kiến thức theo chương trình 2018
- gắn nhãn độ khó
- chuẩn hóa vào ngân hàng câu hỏi

Kết quả là giáo viên không phải quản lý đề thủ công. Mỗi đề mới trở thành một tài sản dữ liệu có cấu trúc.

### Luồng 2: Học sinh làm Weekly Test

Weekly Test là điểm vào chính của hệ thống.

Quy trình:

1. Giáo viên giao bài kiểm tra tuần.
2. Học sinh làm trên app hoặc trên giấy tùy điều kiện.
3. Nếu là giấy, giáo viên chụp ảnh bài làm; hệ thống nhận diện và số hóa.
4. Mỗi câu trả lời được lưu theo các metric:
	- đúng/sai
	- thời gian làm bài
	- độ tự tin hoặc mức do dự nếu có
	- vùng kiến thức
	- độ khó
	- kiểu lỗi
5. Hệ thống cập nhật trạng thái graph cho từng học sinh.
6. LLM nhận graph hiện tại + lịch sử lộ trình tuần trước để sinh lộ trình học mới.

Điểm khác biệt là hệ thống không chỉ nói “bạn làm đúng 7/10 câu”. Nó trả lời “bạn đang thiếu nền ở node nào, vì sao tuần này vẫn sai, và tuần tới nên học gì trước để kéo đà tiến bộ”.

### Luồng 3: Học sinh làm Revision Test

Revision Test được sinh động dựa trên Learning Path gần nhất và comment mới nhất của giáo viên.

Quy trình:

1. Hệ thống đọc lộ trình học hiện tại của học sinh.
2. Kết hợp ghi chú của giáo viên về mục tiêu tuần này.
3. Chọn số lượng câu theo từng vùng kiến thức và mức độ khó phù hợp.
4. Điều chỉnh tỷ lệ câu dễ-trung bình-khó theo trạng thái của từng học sinh.
5. Chấm và so sánh với phiên bản trước.
6. Cập nhật graph để phản ánh mức tiến bộ thật.

Revision Test không phải một bài kiểm tra lặp lại máy móc. Nó là một vòng kiểm chứng xem học sinh đã vá được lỗ hổng nào, còn lỗ hổng nào vẫn cần bồi thêm.

### Luồng 4: Bảng điều khiển giáo viên

Teacher Dashboard là lớp bắt buộc của sản phẩm. Nó phải trả lời ngay ba câu hỏi cho giáo viên:

- Hôm nay ai cần giúp trước?
- Lớp đang yếu ở phần nào?
- Nên dạy bù lại nội dung nào trong tiết tới?

Giao diện giáo viên có các khối chính:

- Student Priority Queue: danh sách học sinh cần hỗ trợ theo mức độ khẩn cấp.
- Need-based Groups: gom nhóm học sinh theo hổng kiến thức thay vì theo điểm số chung.
- Class Gap Radar: phát hiện những node kiến thức mà số đông đang yếu.
- Intervention Suggestions: gợi ý can thiệp như re-teach, mini-group, peer support, hoặc giao bài phụ đạo.
- Progress Timeline: theo dõi tiến bộ theo tuần và theo chủ đề.

Với lớp học đông, đây là điểm thay đổi vận hành thật sự: giáo viên không còn phải đoán cảm tính mà có thể nhìn thấy bản đồ lớp học theo thời gian thực.

## Quy trình cho vùng nông thôn và điều kiện mạng yếu

Ở vùng nông thôn, phần cứng và mạng không thể là rào cản. GapLens được thiết kế offline-first và low-bandwidth-first.

### Workflow thực tế

1. Giáo viên phát bài giấy cho cả lớp.
2. Học sinh làm bài như bình thường.
3. Giáo viên dùng điện thoại chụp toàn bộ hoặc từng cụm bài làm.
4. App nén ảnh tại máy, xử lý OCR cơ bản cục bộ nếu có thể, và đẩy đồng bộ khi có mạng.
5. Hệ thống bóc tách đáp án, nhận diện câu hỏi, chấm, và tạo báo cáo.
6. Giáo viên nhận được ngay bản tóm tắt lớp học, không cần nhập dữ liệu thủ công.

### Lý do workflow này quan trọng

Nếu chỉ thiết kế cho thành thị, sản phẩm sẽ bỏ lỡ nơi nhu cầu cao nhất. Chụp ảnh bài làm giúp:

- giảm thao tác nhập liệu
- phù hợp với thói quen lớp học giấy bút hiện tại
- triển khai được ở trường có mạng yếu
- mở rộng dần lên môi trường urban mà không phải thay đổi logic lõi

## UX AI-Native & Tư duy thiết kế

Trải nghiệm của GapLens phải sang, nhanh, ít ma sát và không nhàm chán. AI-native ở đây có nghĩa là giảm giao diện thừa chứ không phải nhồi thêm chatbot.

### Nguyên tắc UX

- Ít form hơn, nhiều ngữ cảnh hơn.
- Ít menu hơn, nhiều hành động đề xuất sẵn hơn.
- Ít thao tác chọn thủ công hơn, nhiều câu lệnh tự nhiên hơn.
- Ít màn hình lặp lại hơn, nhiều khối thông tin có thể quét nhanh bằng mắt hơn.

### Trải nghiệm học sinh

- Học sinh mở app và thấy đúng việc cần làm tiếp theo.
- Không phải chọn quá nhiều mục.
- Không bị ngập trong danh sách bài học dài.
- Mỗi lần làm bài xong đều có phản hồi rõ ràng: sai ở đâu, vì sao sai, bài nào nên làm tiếp.

### Trải nghiệm giáo viên

- Giáo viên chỉ cần upload ảnh hoặc file đề.
- AI tự hiểu cấu trúc đề.
- Dashboard tự ưu tiên điều quan trọng nhất.
- Một màn hình có thể thay cho nhiều thao tác spreadsheet thủ công.

### Phong cách thiết kế

Sản phẩm nên mang cảm giác premium, hiện đại, có nhịp chuyển động nhẹ và có trọng tâm dữ liệu rõ ràng. Không dùng layout học đường cũ kỹ. Giao diện nên có:

- dashboard nhiều lớp thông tin nhưng gọn
- biểu đồ, bản đồ kiến thức, và card trạng thái rõ ràng
- tương phản mạnh, phân cấp chữ tốt
- chuyển động nhẹ để thể hiện tiến độ và trạng thái học

## Technical Implementation

### Thành phần hệ thống

1. Student App
	- làm bài
	- nhận lộ trình học
	- xem tiến bộ
	- hỗ trợ offline cache

2. Teacher Dashboard
	- upload đề hoặc ảnh
	- xem nhóm học sinh theo nhu cầu
	- theo dõi lỗ hổng của cả lớp
	- tạo can thiệp nhanh

3. AI Service Layer
	- OCR và phân tích đề
	- chẩn đoán root-cause
	- sinh practice path
	- sinh revision test
	- tóm tắt lớp học

4. Knowledge Graph Service
	- lưu node kiến thức theo chương trình 2018
	- lưu quan hệ tiên quyết
	- cập nhật trạng thái từng học sinh

5. Content Bank
	- câu hỏi đã gắn nhãn vùng kiến thức + độ khó
	- phiên bản đề
	- metadata sư phạm

6. Sync & Offline Layer
	- lưu tạm dữ liệu thiết bị
	- đồng bộ theo đợt
	- nén ảnh và giảm payload

### Dòng xử lý dữ liệu

Input đề hoặc bài làm -> OCR -> gắn nhãn kiến thức -> đối chiếu graph -> chẩn đoán root-cause -> sinh lộ trình -> xuất bài luyện -> cập nhật kết quả -> phản hồi cho học sinh và giáo viên.

### Cách cập nhật graph

Graph của từng học sinh không phải chỉ là điểm số cộng dồn. Nó được cập nhật theo:

- độ chính xác câu trả lời
- thời gian làm bài
- độ khó câu hỏi
- mức ổn định qua nhiều lần lặp
- độ liên quan giữa node hiện tại và node tiền quyết

Điều này giúp hệ thống phân biệt giữa “làm đúng may mắn” và “thực sự nắm vững”.

### Bám chương trình 2018

Mọi node và bộ đề phải được ánh xạ về khung nội dung chuẩn của Chương trình Giáo dục phổ thông 2018. Đây là điều kiện sống còn để sản phẩm được chấp nhận trong môi trường trường học thật:

- theo lớp
- theo môn
- theo chủ đề
- theo chuẩn đầu ra

## AI Safety / Grounding

### Mục tiêu an toàn

Hệ thống không được tự ý bịa kiến thức, bịa đáp án, hoặc đưa ra khuyến nghị học tập không có căn cứ.

### Cơ chế grounding

1. RAG theo kho nội dung đã gắn nhãn.
2. Output của LLM phải dựa trên node kiến thức và tài liệu nội bộ đã xác thực.
3. Mọi khuyến nghị lộ trình đều phải trỏ về nguồn nội dung hoặc trạng thái graph cụ thể.
4. Khi độ tin cậy thấp, hệ thống phải nói không chắc chắn và chuyển sang chế độ đề xuất an toàn hơn.

### Guardrails

- Không cho phép LLM tự tạo kiến thức ngoài chương trình khi sinh bài luyện.
- Không cho phép thay đổi kết luận đánh giá nếu chưa có tín hiệu đủ mạnh.
- Không để chatbot trả lời theo kiểu mơ hồ nếu có thể truy xuất dữ liệu cấu trúc.
- Phân tách rõ vùng nào là suy luận, vùng nào là dữ liệu quan sát.

### Kiểm soát lỗi

- confidence threshold cho root-cause diagnosis
- kiểm tra chéo giữa graph state và output text
- logging cho mọi quyết định can thiệp
- human override cho giáo viên

## Business Feasibility

### Tại sao sản phẩm có thể bán được

GapLens giải quyết một nỗi đau thật, lặp lại hàng tuần, trong một bối cảnh có ngân sách và nhu cầu rõ ràng: trường học, giáo viên, trung tâm phụ đạo, và mô hình hỗ trợ học tập cho khu vực thiếu nguồn lực.

Giá trị kinh doanh nằm ở chỗ:

- giảm thời gian chấm và phân tích thủ công cho giáo viên
- tăng hiệu quả phụ đạo cá nhân hóa
- giúp trường nhìn thấy dữ liệu học tập có thể hành động
- tạo lớp báo cáo phục vụ quản lý, phụ huynh, và can thiệp học tập

### Khách hàng đầu tiên

Nhóm beta đầu tiên nên rất cụ thể:

1. 2-3 giáo viên Toán cấp 2 ở trường công có lớp đông.
2. 1 giáo viên ở khu vực nông thôn có điều kiện mạng yếu.
3. 1 trung tâm phụ đạo nhỏ cần tự động hóa phân nhóm học sinh.
4. 1 nhóm học sinh lớp 6-8 có nhu cầu ôn nền tảng.

### Pilot roadmap 30 ngày

Tuần 1:

- chọn 5 giáo viên/đơn vị pilot
- khóa bộ kiến thức theo 1 môn, 2-3 khối lớp
- chuẩn hóa ngân hàng đề đầu tiên

Tuần 2:

- chạy thử upload đề và chụp bài làm
- kiểm tra OCR, tagging, và dashboard
- điều chỉnh mapping kiến thức theo phản hồi giáo viên

Tuần 3:

- triển khai weekly test thật
- sinh learning path cá nhân
- đo thời gian tiết kiệm cho giáo viên và mức độ chính xác của chẩn đoán

Tuần 4:

- chạy revision test
- đo mức tiến bộ sau một vòng can thiệp
- tổng hợp case study, số liệu, và phản hồi để chuẩn bị mở rộng

### Chỉ số cần chứng minh

- tỷ lệ nhận diện đúng vùng kiến thức lỗi
- thời gian giáo viên tiết kiệm trên mỗi bài kiểm tra
- số học sinh được nhóm đúng nhu cầu
- mức cải thiện sau revision test
- tỷ lệ giáo viên dùng lại trong tuần sau

## Live Demo Strategy

Demo phải cho thấy sự thay đổi lớp học, không chỉ là một app có AI.

### Kịch bản demo 4 phút

1. Mở bằng pain point: một lớp có nhiều mức nền khác nhau.
2. Chụp bài kiểm tra giấy của học sinh.
3. Hệ thống tự số hóa và gắn nhãn.
4. Dashboard hiện nhóm học sinh cần hỗ trợ trước.
5. Mở student view để thấy lộ trình cá nhân hóa.
6. Kết bằng việc re-teach đúng phần lớp đang yếu.

### Q&A chuẩn bị sẵn

- Tại sao đây không phải chỉ là app luyện đề? Vì nó chẩn đoán root-cause và tạo vòng lặp can thiệp cho cả lớp.
- Làm sao tránh hallucination? Vì mọi output đều grounding theo graph, bank câu hỏi, và confidence threshold.
- Làm sao scale ở nông thôn? Vì workflow ảnh giấy + offline-first giảm phụ thuộc mạng.
- Làm sao chứng minh hiệu quả kinh doanh? Vì pilot đo được thời gian giáo viên tiết kiệm và tiến bộ sau can thiệp.

## Phân chia công việc cho 5 thành viên

### 1. AI Engineer 1

Chịu trách nhiệm OCR pipeline, question parsing, và tagging vùng kiến thức + độ khó. Người này xây phần nhận diện đề, bóc cấu trúc câu hỏi, và chuẩn hóa đầu vào từ ảnh/file.

### 2. AI Engineer 2

Chịu trách nhiệm knowledge graph reasoning, root-cause diagnosis, personalized practice path, và revision test generation. Đây là người xây logic chẩn đoán và sinh lộ trình.

### 3. Frontend Engineer

Chịu trách nhiệm student app và teacher dashboard, bao gồm state management, offline UI behavior, charting, group views, and class-level insights.

### 4. Design + Frontend

Chịu trách nhiệm UX system, information architecture, interaction design, motion, visual direction, và prototype chuyển từ concept sang interface premium. Người này cũng đảm bảo trải nghiệm AI-native không bị rối hoặc nhàm.

### 5. Backend Engineer

Chịu trách nhiệm auth, data model, API, sync, storage, analytics, question bank, graph persistence, versioning, và deployment.

## Định nghĩa MVP

### MVP phải có

- upload đề hoặc chụp bài làm
- OCR và tagging cơ bản
- chẩn đoán root-cause cho học sinh
- sinh learning path cá nhân
- teacher dashboard để nhóm học sinh và phát hiện lỗ hổng lớp
- revision test vòng lặp tuần
- offline/low-bandwidth flow tối thiểu

### MVP chưa cần

- đa môn đầy đủ
- quá nhiều loại bài tập nâng cao
- social features
- gamification nặng
- quá nhiều dashboard phụ

## Thông điệp cốt lõi cho ban giám khảo

GapLens AI Classroom không chỉ số hóa bài kiểm tra. Nó biến lớp học từ mô hình “một bài giảng cho tất cả” thành mô hình “một lớp học, nhiều đường đi, một giáo viên điều phối bằng dữ liệu”. Giá trị của hệ thống nằm ở chỗ nó giúp giáo viên nhìn thấy nguyên nhân gốc của lỗ hổng, can thiệp đúng lúc, và cá nhân hóa ở quy mô lớp học thật mà vẫn phù hợp với điều kiện Việt Nam.

Nếu cần một câu chốt để thuyết trình, hãy dùng:

> Chúng tôi không xây một app học thêm. Chúng tôi xây một lớp học AI-native, nơi mỗi học sinh được vá đúng lỗ hổng của mình và mỗi giáo viên có thể điều phối cả lớp bằng dữ liệu thay vì cảm tính.
