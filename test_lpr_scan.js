const http = require('http');

const data = JSON.stringify({});

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/api/ambulance/lpr?img_url=https://example.com/test_plate.jpg',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("🚀 Bắt đầu giả lập Camera Cổng bệnh viện quét biển số xe...");
console.log("📸 Đang gửi ảnh về API VNPT SmartVision thông qua backend EyeCU...");

const req = http.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    console.log("\n✅ Phản hồi từ Server:");
    try {
      console.log(JSON.stringify(JSON.parse(responseData), null, 2));
    } catch (e) {
      console.log(responseData);
    }
    console.log("\n💡 Bạn hãy kiểm tra giao diện trang 'Điều phối Cấp cứu', khung LPR Scanner sẽ tự động cập nhật biển số xe và hệ thống sẽ thông báo!");
  });
});

req.on('error', (error) => {
  console.error("❌ Lỗi kết nối (Backend đã chạy chưa?):", error.message);
});

req.write(data);
req.end();
