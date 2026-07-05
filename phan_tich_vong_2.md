# BÁO CÁO PHÂN TÍCH CHUYÊN SÂU: SỰ LỘT XÁC VÀ ĐỘT PHÁ CỦA EYECU TẠI VÒNG 2

Báo cáo này đối chiếu trực tiếp giữa Bản đề xuất dự án Vòng 1 (Lý thuyết & Kiến trúc) và Mã nguồn thực tế đã được xây dựng tại Vòng 2 (Sản phẩm phần mềm đang chạy). 

EyeCU ở Vòng 2 không chỉ dừng lại ở việc đáp ứng các cam kết của Vòng 1 mà đã tiến hóa thành một **"Hệ điều hành Bệnh viện Thu nhỏ" (Mini-HIS Operating System)**, nơi AI đóng vai trò như hệ thần kinh trung ương liên kết mọi mảnh ghép rời rạc lại với nhau.

---

## I. TỪ LÝ THUYẾT TRÊN GIẤY ĐẾN HỆ THỐNG PHẦN MỀM THỰC CHIẾN

*   **Vòng 1:** Dừng lại ở các biểu đồ luồng dữ liệu (Data Flow), thiết kế kiến trúc và giao diện tĩnh (Wireframe/Figma mockup).
*   **Vòng 2:** EyeCU đã trở thành một nền tảng Web Application độ hoàn thiện cao (High-Fidelity MVP). 
    *   Sở hữu kiến trúc Client-Server hiện đại: Frontend chạy ReactJS/Vite/TailwindCSS, Backend chạy FastAPI/Python.
    *   Hệ thống Cơ sở dữ liệu (Database) thực tế trên Supabase/PostgreSQL quản lý chặt chẽ hàng vạn bản ghi.
    *   Hệ thống phân quyền truy cập (Role-based Access) phân tách hoàn toàn 4 góc nhìn nghiệp vụ: Admin quản trị, Bác sĩ lâm sàng, Điều dưỡng trực ban (Ops), và Ứng dụng Bệnh nhân (Patient Portal).

---

## II. TÍCH HỢP SÂU RỘNG HỆ SINH THÁI VNPT AI VÀO NGHIỆP VỤ LÕI

Không còn là gọi API demo rời rạc, Vòng 2 chứng kiến một cuộc "đổ bộ" toàn diện của hệ sinh thái VNPT AI. Nhóm đã nhúng thành công và khai thác triệt để **6 bộ API lõi** vào chuỗi vận hành khép kín:

1.  **VNPT eKYC (Định danh & Trắc sinh học):**
    Không chỉ dùng để đối chiếu hồ sơ, eKYC được nâng cấp thành tính năng **FaceID Login** bảo mật kép. Bác sĩ/Bệnh nhân đăng nhập bằng khuôn mặt thực tế qua Webcam, thay thế hoàn toàn mật khẩu truyền thống và đảm bảo định danh chính xác tuyệt đối.
2.  **VNPT SmartVision (Thị giác Máy tính Đa luồng):**
    *   **Luồng 1 (LPR):** Nhận diện biển số xe cứu thương tại cổng viện để kích hoạt quy trình Điều phối cấp cứu tự động.
    *   **Luồng 2 (Face Liveness & Pose):** Phối hợp cùng Edge AI để phân tích hành vi ngã và chống giả mạo khuôn mặt (Anti-spoofing) khi đăng nhập, đảm bảo người thật ngồi trước màn hình.
3.  **VNPT SmartReader (Tự động hóa Hành chính):**
    Tại quầy tiếp đón, nhân viên y tế tải ảnh chụp CCCD hoặc thẻ bảo hiểm lên. SmartReader OCR lập tức bóc tách nội dung (Tên, ngày sinh, số thẻ...) và tự động điền (Auto-fill) vào Database (Supabase) chỉ trong 2-3 giây, triệt tiêu lỗi gõ phím.
4.  **VNPT SmartVoice (STT & TTS Trợ năng):**
    *   **STT (Speech-to-Text):** Hiện thực hóa "Bệnh án rảnh tay". Bác sĩ đeo tai nghe thu âm, giọng nói chuyển thành văn bản tức thì theo thời gian thực (Streaming) làm đầu vào cho bệnh án điện tử.
    *   **TTS (Text-to-Speech) - Cải tiến vượt kỳ vọng:** Bổ sung giọng đọc AI "Ngọc Hoa". Người già yếu mắt không cần đọc chữ, chỉ cần bấm nghe thông báo kết quả khám bệnh hoặc tin báo viện phí trên điện thoại với chất giọng truyền cảm.
5.  **VNPT SmartBot (LLM Thông dịch Y khoa):**
    Sức mạnh của Generative AI (LLM) được dùng để làm cầu nối ngôn ngữ:
    *   *Phía Bác sĩ:* LLM tự động Parse (bóc tách) chuỗi văn bản STT thô thành đúng 4 trường cấu trúc bệnh án chuẩn **SOAPE** (Chẩn đoán, Khám, Xử trí).
    *   *Phía Bệnh nhân:* Đóng vai trò "Thông dịch viên", giải thích các chỉ số xét nghiệm phức tạp (HbA1c, Creatinine...) thành lời khuyên sức khỏe bình dân, dễ hiểu.
6.  **VNPT SmartUX (Trải nghiệm người dùng Data-Driven):**
    Tinh thần và kiến trúc cốt lõi của SmartUX được ứng dụng triệt để vào thiết kế UI/ReactJS. Hệ thống hướng tới nguyên tắc **Zero-Friction (Tương tác không chạm)**: Giao diện thẻ Card-based tối giản, phông chữ lớn độ tương phản cao cho người già, triệt tiêu độ nhiễu thông tin (Rage-click prevention), và có nút SOS rung đập (Pulse animation) ghim cố định cho trường hợp khẩn cấp.

---

## III. ĐỘT PHÁ VỀ KIẾN TRÚC AI TẠI BIÊN VÀ GIÁM SÁT TÉ NGÃ (EDGE AI)

Hệ thống giám sát nội trú là minh chứng kỹ thuật xuất sắc nhất, chứng minh năng lực thực thi các bài toán khó nhất của y tế công cộng. Thay vì đẩy luồng video lên Cloud như đề xuất ban đầu, nhóm đã tái cấu trúc hoàn toàn bộ não thị giác máy tính:

1.  **Chuyển dịch sang Xử lý Cục bộ 100% (Local Edge AI):** 
    Sử dụng bộ thư viện MediaPipe siêu nhẹ (~10MB). Toàn bộ việc nhận diện khung xương (Skeleton) được tính toán ngay tại thiết bị gắn với camera phòng bệnh. Cải tiến này giải quyết dứt điểm bài toán ngốn băng thông đường truyền bệnh viện.
2.  **Bộ lọc nhiễu chống Báo động giả (False Positive Filtering):** 
    Thuật toán tự động kiểm tra *độ hiển thị (Visibility)* của vùng hông người bệnh. Nếu người bệnh đang đắp chăn hoặc ngồi khuất, thuật toán từ chối kết luận ngã, triệt tiêu báo động giả.
3.  **Cơ chế Cửa sổ trượt & Machine Learning (Sliding Window):** 
    Mô hình ML Random Forest áp đặt 2 lớp bảo mật: Khung hình phải đạt độ tin cậy ngã >75%, và phải duy trì trạng thái đó trong 40% thời gian của một chuỗi 10 khung hình liên tiếp.
4.  **Privacy-by-Design bằng Mã lập trình (Code-level Anonymization):**
    Camera tự động áp dụng bộ lọc mờ (Gaussian Blur) lên khuôn mặt và thân hình bệnh nhân ngay lập tức, hoặc chỉ vẽ đè "người que" (Skeleton Diagram) trước khi gửi về Trạm chỉ huy.
5.  **Cảnh báo Zero-latency qua Socket:**
    Thay vì dùng API truyền thống gây độ trễ, module Edge AI được gắn trực tiếp WebSocket hai chiều. Ngay khi có ca ngã, gói tin JSON báo động đỏ lập tức chớp sáng trên màn hình Command Center của điều dưỡng ở tốc độ mili-giây.

---

## IV. ĐIỀU PHỐI CẤP CỨU NGOẠI VIỆN (AMBULANCE DISPATCHER)

Một sự nâng cấp mạnh mẽ từ ý tưởng mở rào chắn đơn thuần ở Vòng 1:

1.  **Bản đồ Điều phối Thời gian thực (Real-time Map):**
    Giao diện Command Center có sa bàn số hiển thị trực tiếp tọa độ xe cứu thương kèm Thời gian dự kiến đến (ETA). 
2.  **Hồ sơ Tốc hành qua CCCD (Pre-admission):**
    Đây là tính năng cứu mạng: Khi xe cấp cứu vừa đến, mã CCCD của bệnh nhân được quét sẽ kích hoạt truy xuất ngay lập tức các dữ liệu chí mạng như: **Tiền sử dị ứng (VD: Dị ứng Penicillin), Nhóm máu, và Bệnh nền mạn tính**. Ngăn chặn hoàn toàn rủi ro bác sĩ dùng sai thuốc chống sốc phản vệ trong "thời gian vàng".

---

## V. CÁCH MẠNG TRẢI NGHIỆM CHO NGƯỜI BỆNH (PATIENT PORTAL)

EyeCU đóng gói toàn bộ luồng tương tác của người bệnh vào một Ứng dụng Di động tối giản:

1.  **Đặt lịch hẹn khám & Viện phí điện tử:** Bệnh nhân tự chọn Khoa, Bác sĩ, Ngày giờ trên app. Lịch hẹn và hóa đơn (Đã thanh toán / Chưa thanh toán) được đồng bộ từ HIS để minh bạch tài chính.
2.  **Trực quan hóa Chỉ số Hóa sinh:** Biến các chỉ số thô thành các thanh đo màu sắc trực quan (Xanh: Bình thường, Vàng: Chú ý, Đỏ: Cảnh báo nguy hiểm).
3.  **Diễn đàn Hỏi đáp Cộng đồng Y tế:** Nơi giao lưu giải đáp thắc mắc sức khỏe theo thời gian thực. **Đặc biệt:** Hệ thống có cơ chế phân quyền màu thẻ (Cam cho dân thường, Xanh cho Bác sĩ/Admin), giúp người bệnh nhận biết đâu là lời khuyên chuẩn y khoa, chống lại vấn nạn "bác sĩ mạng".

---

## VI. HỆ THỐNG LÕI QUẢN TRỊ BỆNH VIỆN (MINI-HIS) VÀ TRIỂN KHAI

1.  **Cơ sở Dữ liệu chuẩn Y tế:** EyeCU Vòng 2 sở hữu CSDL quan hệ với các bảng liên kết chặt chẽ bằng khóa ngoại (Foreign Keys): Quản lý Nhân sự (`staffs`), Bệnh nhân (`patients`), Lịch sử khám (`encounters`), Bệnh án (`clinical_records`).
2.  **Hoàn thành Cam kết "One-Command Deployment":** EyeCU giữ đúng lời hứa Vòng 1 bằng việc đóng gói toàn bộ hệ thống vào Docker Container. Chỉ với 1 câu lệnh `docker-compose up -d`, các dịch vụ Frontend, Backend tự động giăng lưới mạng nội bộ, nạp biến môi trường, sẵn sàng triển khai trên mọi hạ tầng phần cứng của bệnh viện.
