import ws from 'k6/ws';
import { check } from 'k6';

// Cấu hình K6: Chạy 200 CCU (200 kết nối WebSocket đồng thời) trong 1 phút
export const options = {
  stages: [
    { duration: '15s', target: 200 }, // Ramp-up lên 200 CCU trong 15 giây
    { duration: '30s', target: 200 }, // Giữ nguyên 200 CCU trong 30 giây (Stress test)
    { duration: '15s', target: 0 },   // Ramp-down từ từ về 0
  ],
};

export default function () {
  const url = 'ws://localhost:8000/api/ambient/ws/live'; 

  const res = ws.connect(url, function (socket) {
    socket.on('open', function () {
      console.log(`[VU ${__VU}] Connected`);
      
      // 1. Đăng ký luồng Camera AI Edge
      socket.send(JSON.stringify({
        type: 'REGISTER',
        room_prefix: `P.1${__VU}` // Mỗi VU là 1 phòng khác nhau (P.100, P.101...)
      }));

      // 2. Định kỳ gửi tín hiệu Telemetry / Camera Stream (giả lập gửi Frame siêu nhẹ từ Edge AI)
      socket.setInterval(function timeout() {
        socket.send(JSON.stringify({
          type: 'CAMERA_STREAM',
          room_id: `P.1${__VU}`,
          image: 'base64_skeleton_data_placeholder_super_lightweight_3kb', // Edge AI xử lý xong chỉ ném khung xương/ảnh bé lên
          timestamp: Date.now()
        }));
      }, 500); // 2 FPS - Giả lập mức tải bình thường của 1 luồng theo dõi té ngã

      // 3. Thi thoảng giả lập phát hiện người té ngã (Alert khẩn cấp)
      socket.setTimeout(function () {
        socket.send(JSON.stringify({
          type: 'FALL_DETECTED',
          room_id: `P.1${__VU}`,
          severity: 'critical',
          description: 'AI Camera: Phát hiện bệnh nhân té ngã'
        }));
        console.log(`[VU ${__VU}] SENT FALL_DETECTED SIGNAL!`);
      }, Math.random() * 20000 + 5000); // Gửi ngẫu nhiên trong khoảng từ 5s - 25s
    });

    socket.on('message', function (msg) {
      // Nhận phản hồi từ Server (vd: ACK hoặc ROOM_ASSIGNED)
      // console.log(`[VU ${__VU}] Message from server: ${msg}`);
    });

    socket.on('close', function () {
      // console.log(`[VU ${__VU}] Disconnected`);
    });

    socket.on('error', function (e) {
      if (e.error() !== 'websocket: close sent') {
        console.log('Unexpected error: ', e.error());
      }
    });

    // Chạy giữ kết nối trong suốt vòng đời của 1 Virtual User
    socket.setTimeout(function () {
      socket.close();
    }, 45000); // Đóng kết nối sau 45s
  });

  // Verify rằng kết nối WebSocket được thiết lập thành công (HTTP 101 Switching Protocols)
  check(res, { 'WebSocket connection success (HTTP 101)': (r) => r && r.status === 101 });
}
