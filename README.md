# EyeCU – Hệ Điều Hành Nhận Thức Không Gian & Y Tế Thông Minh

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React/Vite-61DAFB.svg)](https://reactjs.org/)

**EyeCU** là giải pháp phần mềm y tế toàn diện (Ambient Intelligence) giúp tự động hoá quy trình làm việc lâm sàng, giám sát an toàn bệnh nhân nội trú 24/7 và thông dịch dữ liệu y khoa. Sản phẩm ứng dụng sâu Hệ sinh thái API của VNPT (SmartVision, SmartVoice, SmartReader, SmartBot, SmartUX, VNPT eKYC) kết hợp cùng kiến trúc Edge-to-Cloud để giải quyết triệt để bài toán quá tải tại các cơ sở y tế.

---

## 🌐 TRẢI NGHIỆM DEMO TRỰC TUYẾN (LIVE DEMO)

Bạn có thể truy cập và trải nghiệm nhanh sản phẩm trực tiếp tại: **[https://eyecu.vercel.app/login](https://eyecu.vercel.app/login)**

**Danh sách Tài khoản Demo:**
- **Tài khoản Bác sĩ:** Tài khoản: `DOC001` | Mật khẩu: `password123` *(Bác sĩ Nguyễn Văn A - Khoa Ngoại tổng hợp)*
- **Tài khoản Quản trị viên (Admin):** Tài khoản: `AD001` | Mật khẩu: `password123`
- **Tài khoản Bệnh nhân:** Tài khoản: `001306000000` | Mật khẩu: `password123` *(Hoặc dùng tính năng Quét CCCD)*

> **⚠️ LƯU Ý QUAN TRỌNG VỀ API VNPT:**
> Do đặc thù bảo mật của hệ sinh thái VNPT AI, các `ACCESS_TOKEN` để gọi API chỉ có hiệu lực tối đa **8 tiếng**. Trên môi trường Live Demo này, một số tính năng AI (như Đăng nhập FaceID, Quét CCCD OCR, Trợ lý giọng nói) có thể không hoạt động nếu Token đã hết hạn mà đội ngũ chưa kịp cập nhật mới.
> 
> Để đảm bảo chấm điểm và trải nghiệm trọn vẹn 100% tính năng, Ban giám khảo vui lòng tham khảo **Hướng dẫn cài đặt hệ thống (Local Deployment)** ở bên dưới để cấu hình Token mới nhất.

---

## 🌟 TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 1. Giám sát Ambient ICU (Phòng thủ an toàn ban đêm)
Hệ thống **Edge AI** (Trí tuệ nhân tạo tại biên) xử lý luồng camera theo thời gian thực (Real-time). Khi phát hiện bệnh nhân té ngã hoặc có âm thanh bất thường (tiếng va đập, kêu cứu), hệ thống tự động kích hoạt Cảnh báo Đỏ (Fusion Alert) về trạm chỉ huy (Command Center) của điều dưỡng dưới 5 giây.

### 2. Trợ lý Bệnh án rảnh tay (Voice-to-EMR)
Tích hợp VNPT SmartVoice, cho phép bác sĩ dùng giọng nói (Speech-to-Text) để đọc y lệnh và nhập liệu trực tiếp vào bệnh án điện tử (EMR) theo chuẩn cấu trúc SOAPE. Tối ưu hoá thời gian hành chính, giải phóng đôi tay để y bác sĩ tập trung thăm khám.

### 3. Cấp cứu Ngoại viện & Điều phối thông minh (EMS Pre-alert & Dispatcher)
Giải pháp số hóa toàn diện quy trình cấp cứu trước khi nhập viện (Pre-hospital). Nhân viên cấp cứu (EMS) trên xe cứu thương có thể truyền trực tiếp dữ liệu chẩn đoán qua phần đọc y lệnh của bác sĩ và dự báo thời gian đến (ETA) qua GPS về khoa Cấp cứu (ER) theo thời gian thực. Khi xe về đến viện, ứng dụng LPR (Nhận diện biển số) từ SmartVision sẽ tự động định tuyến xe, mở barrier, tối ưu trọn vẹn "Thời gian vàng" cứu sống bệnh nhân. Ngoài ra, nếu bệnh nhân có CCCD, chức năng quét CCCD sẽ được thực hiện ngay trên xe cấp cứu và truyền dữ liệu về bệnh viện để làm hồ sơ nhập viện luôn, giảm bớt thời gian làm thủ tục nhập viện.

### 4. Đăng nhập sinh trắc học (WebAuthn / Passkey)
Ứng dụng công nghệ chuẩn WebAuthn, cho phép nhân viên y tế đăng nhập siêu tốc bằng FaceID hoặc Vân tay (TouchID), triệt tiêu hoàn toàn rủi ro lộ lọt mật khẩu truyền thống.

### 5. Ứng dụng PWA Đa nền tảng (Tối ưu cho Người cao tuổi)
Hệ thống được xây dựng chuẩn Progressive Web App (PWA), cho phép bệnh nhân cài đặt trực tiếp Website lên điện thoại di động như một App độc lập mà không cần tải qua App Store/CH Play. Giao diện App được thiết kế riêng với phông chữ lớn, nút bấm to, thao tác vuốt chạm tinh gọn nhằm giúp người cao tuổi dễ dàng theo dõi sức khỏe và tra cứu bệnh án mọi lúc.

---

## 🛡️ AN TOÀN THÔNG TIN & BẢO MẬT DỮ LIỆU (PRIVACY-BY-DESIGN)

An toàn dữ liệu y tế là ưu tiên số một của EyeCU. Hệ thống tuân thủ các quy định khắt khe thông qua kiến trúc **Trục dọc dữ liệu không lưu trữ (Zero-Retention Pipeline)** gồm 3 lớp:

1. **Che mờ tại biên (Edge Anonymization):**
   Luồng video từ camera nội trú được xử lý trực tiếp tại thiết bị biên (Local Edge). Thuật toán AI tự động **che mờ hoàn toàn (heavy blur)** cơ thể bệnh nhân và chỉ hiển thị "Khung xương" (Skeleton Overlay) về trạm điều khiển để theo dõi tư thế. Trong trường hợp xảy ra sự cố ngã, hình ảnh chuyển sang mờ nhẹ (light blur) để nhân viên y tế chẩn đoán chấn thương. **Dữ liệu hình ảnh thật không bao giờ rời khỏi phòng bệnh.**
2. **Không lưu trữ (Zero-Retention):**
   Dữ liệu video đệm chỉ lưu tạm thời trên bộ nhớ RAM để nhận diện hành vi và sẽ bị **xóa bỏ vĩnh viễn** tự động sau mỗi 10 giây nếu không có sự cố nào kích hoạt.
3. **Mã hóa thực thể (Data Tokenization):**
   Các dữ liệu cá nhân (PII) bóc tách từ CCCD hay phiếu xét nghiệm (qua eKYC, OCR) được hệ thống lập tức mã hóa theo chuẩn **AES-256** và gắn định danh ẩn danh (Tokenization) trước khi lưu vào CSDL, triệt tiêu rủi ro khai thác từ bên ngoài.

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT 1-LỆNH (ONE-COMMAND DEPLOYMENT)

Dự án được đóng gói toàn diện bằng **Docker**, đảm bảo môi trường độc lập và có thể khởi chạy chỉ bằng một câu lệnh duy nhất trên bất kỳ hạ tầng nào.

### Yêu cầu hệ thống:
- Đã cài đặt [Docker](https://www.docker.com/products/docker-desktop/) và [Docker Compose](https://docs.docker.com/compose/install/).
- Git (Để clone repo).

### Bước 1: Clone mã nguồn
```bash
git clone https://github.com/KhoaNghiNoahDang/EyeCU.git
cd eyecu
```

### Bước 2: Cấu hình biến môi trường (Tokens & API Keys)
Bạn cần cấu hình các Token của VNPT và Gemini API để hệ thống hoạt động đầy đủ tính năng.
1. Copy file mẫu `.env.example` thành `.env` trong thư mục `backend`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   *(Trên Windows Command Prompt bạn có thể dùng lệnh `copy backend\.env.example backend\.env`)*
2. Mở file `backend/.env` và điền các giá trị thực tế cho các biến (như `GEMINI_API_KEY`, `VNPT_*`, `DATABASE_URL`, v.v.).

### Bước 3: Khởi chạy hệ thống (Deployment)
Chỉ cần thực thi lệnh sau tại thư mục gốc của dự án:
```bash
docker-compose up --build -d
```
*Lệnh này sẽ tự động tải các image cần thiết, khởi chạy Backend (FastAPI) tại cổng `8000` và Frontend (React/Vite) tại cổng `5173`. Tuỳ chọn `-d` giúp hệ thống chạy ngầm (Detached mode).*

### Bước 4: Truy cập hệ thống
Sau khi quá trình build hoàn tất, mở trình duyệt và truy cập:
- **Giao diện Người dùng (Frontend):** `http://localhost:5173`
- **Tài liệu API Backend (Swagger UI):** `http://localhost:8000/docs`

### Chạy hệ thống Edge AI (Dành cho Camera Phòng bệnh)
Vì Edge AI cần truy cập trực tiếp vào luồng video của Camera nội bộ (RTSP/Webcam), tiến trình này cần chạy trực tiếp trên thiết bị (không qua Docker backend):
```bash
cd edge_ai
pip install -r requirements_edge.txt
python main.py
```

---

## 🏗️ KIẾN TRÚC MÃ NGUỒN (ARCHITECTURE)

Hệ thống được thiết kế theo kiến trúc Microservices để tối ưu hóa hiệu suất và dễ dàng mở rộng (Scale-up):
- `/frontend`: Xây dựng bằng **React (Vite)** + TypeScript. Giao diện tối giản, tích hợp WebSocket nhận cảnh báo realtime.
- `/backend`: Khung ứng dụng **FastAPI** (Python). Quản lý REST API, WebSocket Gateway và tích hợp SQLAlchemy.
- `/edge_ai`: Ứng dụng **Python (OpenCV, MediaPipe)**. Xử lý thuật toán Computer Vision, Pose Estimation ngay tại camera biên với cơ chế Adaptive FPS tiết kiệm băng thông.

---

*Phát triển bởi đội ngũ EyeCU - Nâng tầm y tế thông minh bằng công nghệ nhận thức không gian.*
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
- **Trải nghiệm PWA Mượt mà:** Khả năng lưu trữ Cache Offline giúp Website App tải tức thì ngay cả khi mạng chập chờn. Bệnh nhân có thể dùng tính năng "Thêm vào màn hình chính" (Add to Home Screen) để sử dụng mượt mà như một ứng dụng Native đích thực.
- **Chỉ báo trực quan:** Quá trình chờ xử lý FaceID được lót lớp nền ảnh làm mờ (Frosted glass) giảm cảm giác sốt ruột cho người dùng.

---

## Kịch bản Test Tự động
Để kiểm chứng tính ổn định (đảm bảo chạy >= 3 lần không lỗi), dự án bao gồm Test Script tích hợp:
```bash
# Chạy bộ test hệ thống Backend (Tự động chuyển sang cách 2 qua module python nếu cách 1 báo lỗi)
cd backend && pytest tests/ || python -m pytest tests/
```

---
**EyeCU - Thấu hiểu. Dự báo. Chữa lành.**
> Mang tương lai y tế Ambient Computing đến Việt Nam.
