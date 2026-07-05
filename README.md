<div align="center">
  <img src="frontend/public/logo.png" alt="EyeCU Logo" width="120" />
  <h1>EyeCU - Ambient Clinical OS</h1>
  <p><strong>Hệ điều hành Y tế Nhận thức Tức thì - Giải pháp toàn diện số hóa Bệnh viện</strong></p>
  <p><i>Sản phẩm dự thi Vòng 2 - Vietnamese Student HackAIthon 2026 (Bảng B - Challenger)</i></p>
</div>

---

## Tầm nhìn & Sứ mệnh
**EyeCU** ra đời với khát vọng chuyển đổi số toàn diện quy trình vận hành bệnh viện và cấp cứu ngoại viện. Không chỉ là một phần mềm quản lý thông thường, EyeCU hoạt động như một Hệ điều hành nhận thức ứng dụng sâu rộng hệ sinh thái AI của VNPT để giải phóng nhân viên y tế khỏi gánh nặng hành chính, bảo vệ bệnh nhân theo thời gian thực và tối ưu hóa nguồn lực y tế.

Được thiết kế dựa trên tiêu chí cốt lõi của Vòng 2 HackAIthon: **Bảo mật, Trải nghiệm liền mạch (Zero-friction) và Triển khai thực chiến.**

---

## Hướng dẫn Cài đặt 1-Lệnh (Tiêu chí Vòng 2)

Theo đúng yêu cầu của Ban tổ chức về tiêu chí **"Hoàn thiện sản phẩm: Repo + hướng dẫn cài đặt 1-lệnh"**, EyeCU đã được đóng gói hoàn chỉnh bằng Docker Compose.

### Yêu cầu hệ thống:
- Docker & Docker Compose
- Môi trường: Windows / macOS / Linux

### Cài đặt và Chạy:

Chỉ với 1 lệnh duy nhất tại thư mục gốc của dự án:
```bash
docker compose up -d --build
```

**Các dịch vụ sẽ được khởi chạy tại:**
- **Frontend (Web App):** http://localhost:5173
- **Backend (FastAPI):** http://localhost:8000
- **Tài liệu API (Swagger UI):** http://localhost:8000/docs

### Hướng dẫn Demo Edge AI Camera (Nhận diện té ngã)
Tính năng Edge AI xử lý trực tiếp tại máy trạm (Local Edge) để bảo mật hình ảnh nội trú. Để test chức năng này:

1. Mở một terminal mới, di chuyển vào thư mục `edge_ai` và cài đặt thư viện:
   ```bash
   cd edge_ai
   pip install -r requirements.txt
   ```
2. Khởi chạy Camera AI:
   ```bash
   python main.py
   ```
3. Máy tính sẽ yêu cầu quyền sử dụng Webcam. Khi đèn Webcam sáng, hãy truy cập vào Web App (http://localhost:5173 hoặc link Vercel của dự án).
4. Điều hướng tới giao diện **Camera giám sát nội trú**, bạn sẽ thấy luồng video trực tiếp từ máy của mình.
5. **Thử nghiệm:** Bạn có thể tự thực hiện động tác "té ngã" trước màn hình để demo. Hệ thống Edge AI sẽ ngay lập tức nhận diện tư thế ngã, làm mờ cơ thể (Blur Body để bảo vệ quyền riêng tư) và gửi cảnh báo khẩn cấp màu đỏ về bảng điều khiển trung tâm!

---

## Điểm chạm Công nghệ - Tích hợp VNPT AI Ecosystem
EyeCU chứng minh tính đổi mới và khác biệt qua việc "nhúng" chặt chẽ hệ sinh thái VNPT AI vào quy trình lõi:

1. **VNPT eKYC (Nhận diện khuôn mặt & Liveness):**
   - **Xác thực bảo mật đa luồng:** Bác sĩ, Điều dưỡng và Bệnh nhân đăng nhập 100% bằng khuôn mặt thực tế qua Webcam (FaceID).
   - Hệ thống tự động phân loại Role (Admin/Clinician/Ops) nhờ thuật toán quét và trích xuất đặc trưng khuôn mặt (Face Compare 1:1).

2. **VNPT SmartReader OCR (Xử lý văn bản thông minh):**
   - **Tự động hóa hành chính:** Nhập viện nhanh chóng bằng cách quét Căn cước công dân (CCCD). OCR bóc tách và tự động điền form bệnh án chỉ trong 3 giây.

3. **VNPT SmartVoice (STT & TTS):**
   - **Bệnh án rảnh tay:** Bác sĩ khám lâm sàng đọc bệnh án, AI tự động chuyển thành văn bản (Speech-to-Text) và trích xuất cấu trúc chuẩn y khoa SOAPE.
   - **Phát thanh viện phí & Điều phối:** Hệ thống đọc thông báo qua loa (Text-to-Speech).

4. **VNPT SmartVision (Edge AI Camera):**
   - **Nhận diện té ngã (Fall Detection):** Camera AI giám sát phòng nội trú 24/7. 
   - *Tính năng đặc biệt bảo mật:* Thuật toán Blur Body (Làm mờ cơ thể) chạy hoàn toàn dưới máy biên (Local Edge) để bảo vệ quyền riêng tư tuyệt đối của bệnh nhân trước khi truyền cảnh báo về trung tâm.
   - **Đọc biển số xe cấp cứu (LPR):** Quản lý điều phối xe tự động mở cổng.

5. **VNPT Smartbot (LLM & Generative AI):**
   - Trợ lý ảo cho bệnh nhân lớn tuổi giải đáp triệu chứng và lịch hẹn.
   - LLM tự động dịch thuật các chỉ số hóa sinh phức tạp thành ngôn ngữ bình dân dễ hiểu trên App bệnh nhân.

6. **VNPT SmartUX (Phân tích & Tối ưu Trải nghiệm):**
   - **Trực quan hóa tương tác (Heatmap & Analytics):** Thu thập và phân tích dữ liệu tương tác của Bác sĩ và Bệnh nhân trên Web App để liên tục cải tiến UI/UX.
   - Đặc biệt hữu ích trong việc theo dõi hành vi của người cao tuổi khi sử dụng App bệnh nhân, từ đó tự động đề xuất phóng to chữ hoặc đơn giản hóa các thao tác điều hướng dựa trên dữ liệu thật.

---

## Đảm bảo An toàn & Bảo mật Dữ liệu (Tiêu chí Vòng 2)
EyeCU tuân thủ nghiêm ngặt tính khả thi pháp lý và bảo mật:
- **Kiến trúc Edge-to-Cloud:** Phân tích hình ảnh nhạy cảm (phòng bệnh, bệnh nhân) chỉ diễn ra ở thiết bị Local Edge. Video/Hình ảnh gốc KHÔNG bị đẩy lên Cloud, hệ thống chỉ gửi tín hiệu Text cảnh báo (ví dụ: `alert: fall`).
- **Phân quyền Role-Based JWT:** Cấp cứu viên (EMS) không thể xem dữ liệu tài chính, Bệnh nhân không thể xem dữ liệu người khác. Đảm bảo chặn đứng các hành vi vượt quyền.
- **Ràng buộc Database linh hoạt:** Hệ thống Database được thiết kế hoàn chỉnh với SQLAlchemy & Supabase, đáp ứng mô hình 1 nhân viên nhiều chức vụ (Bác sĩ kiêm Quản trị viên).

---

## Trải nghiệm Người dùng (UX Metrics)
- **Thiết kế Zero-Friction:** Giao diện tối màu, độ tương phản cao, phông chữ lớn phục vụ môi trường tranh tối tranh sáng ở phòng cấp cứu và cho người dùng cao tuổi.
- **Chỉ báo trực quan:** Quá trình chờ xử lý FaceID được lót lớp nền ảnh làm mờ (Frosted glass) giảm cảm giác sốt ruột cho người dùng.

---

## Kịch bản Test Tự động
Để kiểm chứng tính ổn định (đảm bảo chạy >= 3 lần không lỗi), dự án bao gồm Test Script tích hợp:
```bash
# Chạy bộ test hệ thống Backend
cd backend && pytest tests/
```

---
**EyeCU - Thấu hiểu. Dự báo. Chữa lành.**
> Mang tương lai y tế Ambient Computing đến Việt Nam.
