# EyeCU – Hệ Điều Hành Nhận Thức Không Gian & Y Tế Thông Minh

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React/Vite-61DAFB.svg)](https://reactjs.org/)

**EyeCU** là giải pháp phần mềm y tế toàn diện (Ambient Intelligence) giúp tự động hoá quy trình làm việc lâm sàng, giám sát an toàn bệnh nhân nội trú 24/7 và thông dịch dữ liệu y khoa. Sản phẩm ứng dụng sâu Hệ sinh thái API của VNPT (SmartVision, SmartVoice, SmartReader) kết hợp cùng kiến trúc Edge-to-Cloud để giải quyết triệt để bài toán quá tải tại các cơ sở y tế.

---

## 🌟 TÍNH NĂNG CỐT LÕI (CORE FEATURES)

### 1. Giám sát Ambient ICU (Phòng thủ an toàn ban đêm)
Hệ thống **Edge AI** (Trí tuệ nhân tạo tại biên) xử lý luồng camera theo thời gian thực (Real-time). Khi phát hiện bệnh nhân té ngã hoặc có âm thanh bất thường (tiếng va đập, kêu cứu), hệ thống tự động kích hoạt Cảnh báo Đỏ (Fusion Alert) về trạm chỉ huy (Command Center) của điều dưỡng dưới 5 giây.

### 2. Trợ lý Bệnh án rảnh tay (Voice-to-EMR)
Tích hợp VNPT SmartVoice, cho phép bác sĩ dùng giọng nói (Speech-to-Text) để đọc y lệnh và nhập liệu trực tiếp vào bệnh án điện tử (EMR) theo chuẩn cấu trúc SOAPE. Tối ưu hoá thời gian hành chính, giải phóng đôi tay để y bác sĩ tập trung thăm khám.

### 3. Tự động điều phối cấp cứu (Ambulance Dispatcher)
Ứng dụng LPR (Nhận diện biển số) từ SmartVision tại cổng viện để tự động định tuyến xe cấp cứu, liên kết tín hiệu phần cứng (mở barrier, giữ thang máy) nhằm tối ưu "Thời gian vàng" cấp cứu.

### 4. Đăng nhập sinh trắc học (WebAuthn / Passkey)
Ứng dụng công nghệ chuẩn WebAuthn, cho phép nhân viên y tế đăng nhập siêu tốc bằng FaceID hoặc Vân tay (TouchID), triệt tiêu hoàn toàn rủi ro lộ lọt mật khẩu truyền thống.

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
git clone https://github.com/your-org/eyecu.git
cd eyecu
```

### Bước 2: Khởi chạy hệ thống (Deployment)
Chỉ cần thực thi lệnh sau tại thư mục gốc của dự án:
```bash
docker-compose up --build -d
```
*Lệnh này sẽ tự động tải các image cần thiết, khởi chạy Backend (FastAPI) tại cổng `8000` và Frontend (React/Vite) tại cổng `5173`. Tuỳ chọn `-d` giúp hệ thống chạy ngầm (Detached mode).*

### Bước 3: Truy cập hệ thống
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
