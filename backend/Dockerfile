FROM python:3.11-slim

WORKDIR /app

# Chỉ cài thư viện tối thiểu cần cho opencv-headless
# (bỏ ffmpeg vì LPR chỉ xử lý ảnh tĩnh, không cần encode video)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Cài Python dependencies trước (tận dụng Docker layer cache)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ source code backend
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
