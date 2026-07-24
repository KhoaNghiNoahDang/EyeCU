<p align="center">
  <img src="frontend/public/logo.png" alt="EyeCU Logo" width="250"><br>
  <i><b>Giải phóng đôi tay, kịp thời cấp cứu.</b></i>
</p>

# 🏥 [EyeCU] Hướng dẫn Cài đặt & Trải nghiệm

**Truy cập ngay phiên bản thử nghiệm (Live Demo):** [https://eyecu.vercel.app/login](https://eyecu.vercel.app/login)

---

## 🔐 Danh sách Tài khoản Demo
*(Nhập các thông tin dưới đây để trải nghiệm ngay hệ thống)*

| Vai trò | Tên đăng nhập | Mật khẩu | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Bác sĩ** | `BS0012` | `password123` | Bác sĩ Phan Minh Hương (Khoa Dị ứng - Miễn dịch lâm sàng) |
| **Admin** | `AD001` | `password123` | Quản trị viên toàn hệ thống |
| **Bệnh nhân** | `001306000000` | `password123` | Dùng để test tính năng đặt lịch |

> ⚠️ **LƯU Ý VỀ KIỂM TRA THÔNG BÁO LỊCH KHÁM (DÀNH CHO BÁC SĨ):**
> Lịch trực chỉ gửi thông báo đích danh đến bác sĩ mà người dùng lựa chọn. Do đó, bạn cần dùng tài khoản **Bệnh nhân** để đặt lịch khám (Chọn *Khoa Dị ứng - Miễn dịch lâm sàng* ➔ Chọn *BS Phan Minh Hương*). Sau khi xác nhận đặt lịch thành công, hãy đăng nhập lại bằng tài khoản **Bác sĩ** demo ở trên để kiểm tra thông báo (nhấn vào biểu tượng hình chuông góc trên bên trái giao diện).

> ⚠️ **LƯU Ý VỀ API VNPT TRÊN WEB DEMO:**
> Các Access Token của VNPT có cơ chế bảo mật rất khắt khe (hiệu lực tối đa 8 tiếng). Do đó, đôi khi môi trường Web Demo sẽ mất khả năng gọi API nếu đội ngũ phát triển chưa kịp cấp mới Token. Để Ban giám khảo có thể chấm điểm toàn vẹn 100%, vui lòng làm theo **Hướng dẫn khởi chạy cục bộ (Local)** bên dưới để tự nhập Token của bạn.

---

## 💻 Hướng Dẫn Khởi Chạy Toàn Hệ Thống Cục Bộ (Local Deployment)

Chỉ với Docker, bạn có thể thiết lập toàn bộ hệ thống ngay trên máy tính cá nhân để có thể tự điền Token API:

**Bước 1: Clone mã nguồn**
```bash
git clone https://github.com/KhoaNghiNoahDang/EyeCU.git
cd EyeCU
```

**Bước 2: Thiết lập biến môi trường (Cung cấp Token)**
Hệ thống yêu cầu các khóa API (VNPT, Gemini) để hoạt động. Copy file mẫu trong backend (hoặc tạo mới file `backend/.env`):
```bash
cp backend/.env.example backend/.env
```
Mở file `backend/.env` bằng trình soạn thảo và điền các khóa API theo cấu trúc sau:
```env
# ====== CẤU HÌNH API BÊN THỨ 3 ======
VNPT_ACCESS_TOKEN="nhập_access_token_vnpt_vào_đây"
VNPT_TOKEN_ID="nhập_token_id_vnpt_vào_đây"
GEMINI_API_KEY=
HUGGINGFACE_TOKEN=

# ====== CẤU HÌNH DATABASE & BẢO MẬT ======
# Nếu chạy qua Docker, thông số Database thường được giữ nguyên
DATABASE_URL=
PYTHON_VERSION=3.11.0
SECRET_KEY=
```

**Bước 3: Khởi chạy bằng Docker Compose**
```bash
docker compose up -d --build
```

**Bước 4: Truy cập hệ thống**
*   **Giao diện người dùng:** [http://localhost:5173](http://localhost:5173)
*   **API Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧠 Các Thư Viện Mã Nguồn Mở & Module AI Cốt Lõi (Edge AI)

Dự án EyeCU tận dụng sức mạnh của các thư viện mã nguồn mở hàng đầu để xây dựng các phân hệ thị giác máy tính (Computer Vision) tại biên (Edge). Các module độc lập bao gồm:

1. **Phát hiện té ngã (Fall Detection):** Sử dụng `MediaPipe Pose` (của Google) và `Ultralytics YOLOv8-Pose` để trích xuất ma trận tọa độ khung xương (Skeleton Extraction). Thuật toán phân tích vector rơi tự do để phát hiện bất thường mà không cần lưu trữ luồng video.
2. **Giám sát bình truyền dịch (IV Drip Monitoring):** Sử dụng `OpenCV` để thực hiện xử lý ảnh, phát hiện chuyển động của giọt dịch (Background Subtraction & Contour Detection) nhằm đếm số giọt/phút và dự báo thời gian cạn bình.
3. **Phân tích đám đông (Crowd AI):** Sử dụng `YOLOv8` (Object Detection) kết hợp thuật toán theo dõi (Tracking) để đếm số lượng bệnh nhân tại khu vực phòng chờ/cấp cứu, giúp điều phối nhân sự y tế tránh tình trạng quá tải.

---

## 🏃 Hướng Dẫn Chạy Độc Lập Các Module AI Cục Bộ (Local Edge AI)

Để chứng minh khả năng chạy Local Edge AI trên máy cá nhân, Ban giám khảo có thể chạy trực tiếp các module bằng Python.

**1. Clone mã nguồn và cài đặt thư viện lõi:**
```bash
git clone https://github.com/KhoaNghiNoahDang/EyeCU.git
cd EyeCU/edge_ai
pip install -r requirements_edge.txt
```
*(Thư viện yêu cầu: `opencv-python`, `mediapipe`, `ultralytics`, `numpy`,...)*

**2. Trải nghiệm Module Phát Hiện Té Ngã (Fall Detection):**
```bash
python run_fall_detection.py
```
> **Trải nghiệm thực tế qua Webcam:** Khi bạn thực hiện tư thế ngã trước camera, AI sẽ bắt khung xương, tự động làm mờ cơ thể (Bảo mật quyền riêng tư) và réo còi cảnh báo đỏ (Fusion Alert) gửi về hệ thống trung tâm.

**3. Trải nghiệm Module Giám Sát Truyền Dịch (IV Drip Monitoring):**
```bash
python run_iv_monitor.py --source demo_iv_video.mp4
```
> **Trải nghiệm:** Khi video bật lên, hệ thống sẽ yêu cầu khoanh vùng quan tâm (ROI). Hãy sử dụng **Chuột trái (Left Mouse Button)** click chọn các góc để khoanh vùng bầu nhỏ giọt hoặc khu vực giường bệnh cần giám sát, sau đó nhấn phím `Enter` để xác nhận. Hệ thống sẽ bắt đầu phân tích luồng video, tính toán Real-time số giọt nhỏ xuống mỗi phút và cảnh báo "CẠN DỊCH" bằng viền đỏ trên màn hình.

**4. Trải nghiệm Module Phân Tích Đám Đông (Crowd AI):**
```bash
python run_crowd_ai.py --source 0  # 0 để dùng Webcam hoặc điền link video
```
> **Trải nghiệm:** Tương tự, nếu hệ thống yêu cầu xác định khu vực, hãy dùng **Chuột trái** để tô vùng không gian phòng chờ/hành lang. YOLOv8 sẽ quét không gian trong vùng đã khoanh, vẽ Bounding Box bao quanh và hiển thị tổng số lượng bệnh nhân/người nhà đang hiện diện tại khu vực giám sát.

*(Lưu ý: Bạn cũng có thể xem nhanh giả lập Logic bằng cách đăng nhập Web App -> Camera giám sát nội trú -> Nhấn nút "Demo").*

---

## 🧪 Kịch Bản Kiểm Thử Tự Động (Automated Testing Scripts)

Dự án có đi kèm các tập test case nghiêm ngặt đánh giá tính ổn định hệ thống. Chúng tôi sử dụng `pytest` trong backend để mô phỏng các luồng request.

Để khởi chạy bộ đánh giá tự động này, di chuyển tới thư mục gốc và nhập lệnh:

```bash
# Câu lệnh này hỗ trợ 2 cơ chế (tự động chuyển sang cách dùng python module nếu cách 1 gặp lỗi PATH)
cd backend 
pytest tests/ || python -m pytest tests/
```

**Bộ kịch bản Test này tự động kiểm tra:**
*   Khả năng mã hóa và phân quyền Role-based JWT của Token.
*   Độ phản hồi của các luồng CRUD dữ liệu nội trú.
*   Cấu trúc giả lập của các gói tin gửi về từ AI Camera và luồng VNPT API.

---
<p align="center">
  <img src="frontend/public/logo.png" alt="EyeCU Logo" width="250"><br>
  <i><b>Giải phóng đôi tay, kịp thời cấp cứu.</b></i>
</p>
