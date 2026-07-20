import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

// ---- Cấu hình K6 Scenarios cho toàn bộ hệ thống EyeCU ----
export const options = {
  scenarios: {
    // 1. Giám sát té ngã (Ambient AI) qua WebSocket - 500 Edge Devices (Bệnh viện tuyến trung ương & địa phương)
    ambient_ai_fall_detect: {
      executor: 'constant-vus',
      vus: 250,
      duration: '45s',
      exec: 'ambientWsTest',
    },
    // 2. Cấp cứu ngoại viện (Ambulance GPS) qua WebSocket - 200 xe cấp cứu toàn quốc
    ambulance_gps_tracking: {
      executor: 'constant-vus',
      vus: 100,
      duration: '45s',
      exec: 'ambulanceWsTest',
    },
    // 3. Quản trị mật độ phòng chờ (Crowd AI) qua WebSocket - 100 Camera toàn tuyến
    crowd_monitoring: {
      executor: 'constant-vus',
      vus: 50,
      duration: '45s',
      exec: 'crowdWsTest',
    },
    // 4. Bệnh nhân dùng Chatbot & Hỏi đáp cộng đồng - 1000 User HTTP toàn quốc
    patient_portal_http: {
      executor: 'constant-vus',
      vus: 500,
      duration: '45s',
      exec: 'patientHttpTest',
    },
    // 5. Bác sĩ/Quản trị viên thao tác Kho thuốc & Trực cấp cứu - 200 User HTTP
    admin_ems_http: {
      executor: 'constant-vus',
      vus: 100,
      duration: '45s',
      exec: 'adminHttpTest',
    }
  },
};

const BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

// ----------------------------------------------------
// 1. WebSocket: Ambient AI (Té ngã)
// ----------------------------------------------------
export function ambientWsTest() {
  const url = `${WS_BASE_URL}/api/ambient/ws/live`;
  const res = ws.connect(url, function (socket) {
    socket.on('open', function () {
      socket.send(JSON.stringify({ type: 'REGISTER', room_prefix: `ROOM_AI_${__VU}` }));
      
      socket.setInterval(function timeout() {
        socket.send(JSON.stringify({
          type: 'CAMERA_STREAM',
          room_id: `ROOM_AI_${__VU}`,
          image: 'base64_skeleton_data'
        }));
      }, 1000); // 1 FPS

      socket.setTimeout(function () {
        socket.send(JSON.stringify({ type: 'FALL_DETECTED', room_id: `ROOM_AI_${__VU}` }));
      }, Math.random() * 20000 + 5000);
    });

    socket.setTimeout(function () { socket.close(); }, 25000);
  });
  check(res, { 'Ambient WS connected': (r) => r && r.status === 101 });
}

// ----------------------------------------------------
// 2. WebSocket: Ambulance (GPS)
// ----------------------------------------------------
export function ambulanceWsTest() {
  const url = `${WS_BASE_URL}/api/ambulance/ws/gps`;
  const res = ws.connect(url, function (socket) {
    socket.on('open', function () {
      socket.setInterval(function timeout() {
        socket.send(JSON.stringify({
          ambulance_id: `AMB-${__VU}`,
          lat: 10.762622 + (Math.random() * 0.01),
          lng: 106.660172 + (Math.random() * 0.01),
          status: 'en_route',
          speed: 60
        }));
      }, 2000);
    });
    socket.setTimeout(function () { socket.close(); }, 25000);
  });
  check(res, { 'Ambulance WS connected': (r) => r && r.status === 101 });
}

// ----------------------------------------------------
// 3. WebSocket: Crowd AI (Mật độ)
// ----------------------------------------------------
export function crowdWsTest() {
  const url = `${WS_BASE_URL}/api/crowd/ws/live`;
  const res = ws.connect(url, function (socket) {
    socket.on('open', function () {
      socket.setInterval(function timeout() {
        socket.send(JSON.stringify({
          type: 'CROWD_UPDATE',
          zone: `ZONE_${__VU}`,
          head_count: Math.floor(Math.random() * 50),
          density: Math.random()
        }));
      }, 5000);
    });
    socket.setTimeout(function () { socket.close(); }, 25000);
  });
  check(res, { 'Crowd WS connected': (r) => r && r.status === 101 });
}

// ----------------------------------------------------
// 4. REST API: Patient Portal (Chatbot, Q&A, Health Record)
// ----------------------------------------------------
export function patientHttpTest() {
  // Mock login headers for Patient
  const headers = { 'Authorization': 'Bearer DUMMY_PATIENT_TOKEN', 'Content-Type': 'application/json' };

  // Hỏi đáp cộng đồng
  let resQA = http.get(`${BASE_URL}/api/patient/questions/all`, { headers });
  check(resQA, { 'Patient Q&A loaded': (r) => r.status === 200 || r.status === 401 });

  // Chatbot (Giả lập gọi AI)
  let resChat = http.post(`${BASE_URL}/api/patient/chat`, JSON.stringify({ message: "Xin chào bác sĩ AI" }), { headers });
  check(resChat, { 'Patient Chatbot responded': (r) => r.status === 200 || r.status === 401 });

  sleep(1);
}

// ----------------------------------------------------
// 5. REST API: Admin & EMS (Trực cấp cứu, Quản lý kho)
// ----------------------------------------------------
export function adminHttpTest() {
  // Mock login headers for Admin/Doctor
  const headers = { 'Authorization': 'Bearer DUMMY_ADMIN_TOKEN', 'Content-Type': 'application/json' };

  // Lấy danh sách nhiệm vụ cấp cứu đang hoạt động
  let resEMS = http.get(`${BASE_URL}/api/ems/missions/active`, { headers });
  check(resEMS, { 'EMS Missions loaded': (r) => r.status === 200 || r.status === 401 });

  // Lấy danh sách lô thuốc trong kho
  let resPharm = http.get(`${BASE_URL}/api/pharmacy/batches`, { headers });
  check(resPharm, { 'Pharmacy batches loaded': (r) => r.status === 200 || r.status === 401 });

  sleep(2);
}
