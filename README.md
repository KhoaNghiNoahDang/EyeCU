<div align="center">
  <img src="frontend/public/logo.png" alt="EyeCU Logo" width="120" />
  <h1>EyeCU – Hệ Điều Hành Nhận Thức Không Gian & Y Tế Thông Minh</h1>
  <p><strong>Thấu hiểu. Dự báo. Chữa lành.</strong></p>
  <p><i>Mang tương lai y tế Ambient Computing đến Việt Nam.</i></p>
  <br/>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
  [![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
  [![React](https://img.shields.io/badge/Frontend-React/Vite-61DAFB.svg)](https://reactjs.org/)
</div>

<br/>

**EyeCU** ra đời với khát vọng chuyển đổi số toàn diện quy trình vận hành bệnh viện và cấp cứu ngoại viện. Không chỉ là một phần mềm thông thường, EyeCU là một **Giải pháp Y tế Toàn diện (Ambient Intelligence)** ứng dụng sâu rộng Hệ sinh thái API của VNPT. Sản phẩm giúp tự động hoá quy trình lâm sàng, giám sát bệnh nhân 24/7 và thông dịch dữ liệu y khoa nhằm giải quyết triệt để bài toán quá tải y tế.

*Sản phẩm dự thi Vòng 2 - Vietnamese Student HackAIthon 2026 (Bảng B - Challenger)*
*Nhóm Làm này làm nọ*
---

## 🌐 TRẢI NGHIỆM DEMO TRỰC TUYẾN (LIVE DEMO)

Truy cập và trải nghiệm nhanh sản phẩm trực tiếp tại: **[https://eyecu.vercel.app/login](https://eyecu.vercel.app/login)**

**Danh sách Tài khoản Demo (Nhập để trải nghiệm):**
- **Tài khoản Bác sĩ:** `BS0012` | Mật khẩu: `password123` *(Bác sĩ Phan Minh Hương - Khoa Dị ứng - Miễn dịch lâm sàng)*
- **Tài khoản Admin:** `AD001` | Mật khẩu: `password123`
- **Tài khoản Bệnh nhân:** `001306000000` | Mật khẩu: `password123`

> **⚠️ LƯU Ý VỀ KIỂM TRA THÔNG BÁO LỊCH KHÁM TRÊN GIAO DIỆN BÁC SĨ:**
> Do lịch trực chỉ thông báo đến bác sĩ mà người dùng đặt, do đó phải dùng tài khoản bệnh nhân để đặt lịch khám "Khoa Dị ứng - Miễn dịch lâm sàng" và chọn "BS Phan Minh Hương". Sau khi xác nhận đặt lịch thành công, dùng tài khoản bác sĩ demo để kiểm tra thông báo. (Biểu tượng hình chuông góc trên bên trái giao diện).

> **⚠️ LƯU Ý QUAN TRỌNG VỀ API VNPT:**
> Do đặc thù bảo mật của hệ sinh thái VNPT, các `ACCESS_TOKEN` để gọi API chỉ có hiệu lực tối đa **8 tiếng**. Trên môi trường Live Demo này, một số API của VNPT có thể không hoạt động nếu đội chưa cập nhật Token đã hết hạn. Để chấm điểm và trải nghiệm trọn vẹn 100% tính năng, Ban giám khảo vui lòng tham khảo **Hướng dẫn cài đặt hệ thống (Local Deployment)** ở bên dưới để cấu hình Token mới nhất.

---

## 🌟 TÍNH NĂNG CỐT LÕI & ĐIỂM CHẠM VNPT AI (CORE FEATURES)

EyeCU chứng minh sự khác biệt qua việc "nhúng" chặt chẽ hệ sinh thái VNPT AI vào 5 quy trình lõi:

**1. Giám sát Ambient ICU (VNPT SmartVision)**
Hệ thống **Edge AI** xử lý luồng camera theo thời gian thực để bảo vệ bệnh nhân ban đêm. Khi phát hiện té ngã hoặc âm thanh bất thường, hệ thống kích hoạt Cảnh báo Đỏ (Fusion Alert) về trạm điều dưỡng dưới 5 giây. 

**2. Trợ lý Bệnh án rảnh tay (VNPT SmartVoice)**
Bác sĩ khám lâm sàng dùng giọng nói đọc y lệnh. AI tự động chuyển thành văn bản (Speech-to-Text) và trích xuất cấu trúc chuẩn y khoa SOAPE. Tính năng Text-to-Speech (TTS) hỗ trợ phát thanh viện phí và điều phối qua loa bệnh viện.

**3. Cấp cứu Ngoại viện & Điều phối thông minh (VNPT SmartVision & SmartReader)**
Số hóa toàn diện quy trình cấp cứu trước khi nhập viện (Pre-hospital). Nhân viên trên xe cứu thương truyền trực tiếp dữ liệu y lệnh chẩn đoán của bác sĩ và dự báo thời gian đến (ETA qua GPS) về khoa Cấp cứu. 
- Tính năng **OCR (SmartReader)** quét CCCD ngay trên xe để làm hồ sơ nhập viện. 
- Tại cổng viện, **LPR (SmartVision)** tự động đọc biển số xe cấp cứu, mở barrier và thông báo luôn kíp trực cấp cứu.

**4. Xác thực Sinh trắc học & Phân quyền (VNPT eKYC / VNFace)**
- Đăng nhập nhanh bằng khuôn mặt (FaceID) hoặc vân tay chuẩn WebAuthn.
- Hệ thống tự động phân loại Role (Admin/Clinician/Ops) nhờ thuật toán trích xuất đặc trưng khuôn mặt (Face Compare 1:1).

**5. Ứng dụng PWA cho Người cao tuổi (VNPT SmartBot & SmartUX)**
- **Giao diện PWA đa nền tảng:** Cài đặt Website lên điện thoại như một App gốc, hỗ trợ lưu Cache Offline. Thiết kế Zero-Friction với phông chữ lớn, độ tương phản cao.
- **Trợ lý ảo:** Tích hợp LLM và SmartBot giúp người cao tuổi giải đáp triệu chứng, dịch thuật các chỉ số hóa sinh phức tạp thành ngôn ngữ dễ hiểu.
- **Phân tích UX:** SmartUX thu thập Heatmap tương tác để tự động đề xuất phóng to chữ cho người lớn tuổi.

---

## 🛡️ AN TOÀN THÔNG TIN & BẢO MẬT DỮ LIỆU (PRIVACY-BY-DESIGN)

An toàn dữ liệu y tế là ưu tiên số một, tuân thủ tiêu chí Vòng 2 thông qua kiến trúc **Trục dọc dữ liệu không lưu trữ (Zero-Retention Pipeline)**:

1. **Che mờ tại biên (Edge Anonymization):** Luồng video nội trú được xử lý trực tiếp tại thiết bị biên (Local Edge). Thuật toán AI **làm mờ hoàn toàn (heavy blur)** cơ thể bệnh nhân và chỉ hiển thị "Khung xương" về trạm điều khiển. Video/Hình ảnh gốc KHÔNG BAO GIỜ bị đẩy lên Cloud.
2. **Không lưu trữ (Zero-Retention):** Dữ liệu video chỉ lưu tạm trên RAM để phân tích và bị **xóa bỏ vĩnh viễn** sau 10 giây nếu không có sự cố.
3. **Mã hóa thực thể & Phân quyền:** Dữ liệu cá nhân (PII) được mã hóa chuẩn **AES-256** và gắn định danh (Tokenization). Cơ chế **Role-Based JWT** đảm bảo nhân viên chỉ xem được dữ liệu theo đúng thẩm quyền (Bệnh nhân không xem được dữ liệu người khác).

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT 1-LỆNH & DEMO THỰC CHIẾN

Dự án được đóng gói bằng **Docker Compose** đáp ứng tiêu chí triển khai thực chiến.

### Phần 1: Khởi chạy Web App & API (Cổng thông tin)

**Bước 1: Clone mã nguồn**
```bash
git clone https://github.com/KhoaNghiNoahDang/EyeCU.git
cd eyecu
```

**Bước 2: Cấu hình biến môi trường (Tokens)**
Để sử dụng API VNPT, bạn cần cấu hình Token:
1. Copy file mẫu: `cp backend/.env.example backend/.env` *(Windows: `copy backend\.env.example backend\.env`)*
2. Mở file `backend/.env` và điền các giá trị `ACCESS_TOKEN` VNPT thực tế, điền thêm các thông tin sau:
DATABASE_URL=postgresql://postgres.tmjcsqwprlgqqzcubkeb:hackaithon2026%40@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
GEMINI_API_KEY=AQ.Ab8RN6JN5Lqng7c7EOELYEyvCKG6iqZxx-9Wf-LbhnxDSgfdJw
PYTHON_VERSION=3.11.0
SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7

**Bước 3: Khởi chạy hệ thống 1-lệnh**
```bash
docker compose up -d --build
```
*(Hệ thống sẽ chạy Frontend tại `http://localhost:5173` và API Docs tại `http://localhost:8000/docs`)*

### Phần 2: Hướng dẫn Trải nghiệm Demo Nhận diện té ngã (Fall Detection)

Để Ban giám khảo có thể kiểm chứng nguyên lý hoạt động của tính năng giám sát phòng bệnh, hệ thống cung cấp 2 phương thức:

**Cách 1: Xem giả lập Logic trên Website (Nhanh nhất)**
1. Đăng nhập vào Web App bằng tài khoản Bác sĩ hoặc Admin.
2. Truy cập vào trang **"Giám sát không gian"** (Camera nội trú).
3. Nhấn vào nút **"Demo"** trên giao diện để làm rõ nguyên lý phát hiện ngã tự động đẩy cảnh báo về hệ thống.

**Cách 2: Chạy AI trực tiếp qua Webcam (Thực chiến)**
Vì tính năng Edge AI bảo mật dữ liệu hình ảnh tại biên, tiến trình này phải chạy trực tiếp trên máy thật:
1. Mở một Terminal mới, cài đặt thư viện:
   ```bash
   cd edge_ai
   pip install -r requirements_edge.txt
   ```
2. Khởi chạy Camera AI:
   ```bash
   python main.py
   ```
3. Khi đèn Webcam sáng, hãy quay lại giao diện **Giám sát không gian** và tự thực hiện động tác "té ngã" trước màn hình. Hệ thống sẽ nhận diện tư thế, tự động làm mờ cơ thể bạn và gửi Cảnh báo Đỏ về bảng điều khiển!

---

## 🧪 KỊCH BẢN TEST TỰ ĐỘNG

Dự án bao gồm Test Script tích hợp trên Backend để kiểm chứng độ ổn định (đảm bảo chạy >= 3 lần không lỗi). 

```bash
# Chạy bộ test hệ thống Backend (Tự động chuyển sang lệnh thứ 2 nếu lệnh 1 báo lỗi không tìm thấy pytest)
cd backend && pytest tests/ || python -m pytest tests/
```


