FROM python:3.11-slim

WORKDIR /app

# Cài thư viện hệ thống
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Cài thư viện Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ backend
COPY . .

# Tạo DB + Seed dữ liệu khi container khởi động lần đầu
RUN python seed_data.py || true

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
