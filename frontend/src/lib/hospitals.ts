export interface Hospital {
  id: number;
  name: string;
  province: string;
  latitude: number;
  longitude: number;
}

export const CENTRAL_HOSPITALS: Hospital[] = [
  {"id": 1, "name": "Bệnh viện Bạch Mai", "province": "Hà Nội", "latitude": 21.000572, "longitude": 105.840217},
  {"id": 2, "name": "Bệnh viện Chợ Rẫy", "province": "TP. Hồ Chí Minh", "latitude": 10.756200, "longitude": 106.657900},
  {"id": 3, "name": "Bệnh viện C Đà Nẵng", "province": "Đà Nẵng", "latitude": 16.072500, "longitude": 108.216300},
  {"id": 4, "name": "Bệnh viện Châm cứu Trung ương", "province": "Hà Nội", "latitude": 21.011600, "longitude": 105.819200},
  {"id": 5, "name": "Bệnh viện Y học cổ truyền Trung ương", "province": "Hà Nội", "latitude": 21.027900, "longitude": 105.844800},
  {"id": 6, "name": "Bệnh viện Đa khoa Trung ương Cần Thơ", "province": "Cần Thơ", "latitude": 10.015200, "longitude": 105.748300},
  {"id": 7, "name": "Bệnh viện Phục hồi chức năng Trung ương", "province": "Thanh Hóa", "latitude": 19.742300, "longitude": 105.894200},
  {"id": 8, "name": "Bệnh viện E", "province": "Hà Nội", "latitude": 21.047800, "longitude": 105.789100},
  {"id": 9, "name": "Bệnh viện Hữu Nghị", "province": "Hà Nội", "latitude": 21.014200, "longitude": 105.859600},
  {"id": 10, "name": "Bệnh viện Trung ương Huế", "province": "Thừa Thiên Huế", "latitude": 16.467300, "longitude": 107.585100},
  {"id": 11, "name": "Bệnh viện Đa khoa Trung ương Thái Nguyên", "province": "Thái Nguyên", "latitude": 21.583300, "longitude": 105.833600},
  {"id": 12, "name": "Bệnh viện Đa khoa Trung ương Quảng Nam", "province": "Quảng Nam", "latitude": 15.438200, "longitude": 108.647500},
  {"id": 13, "name": "Bệnh viện K", "province": "Hà Nội", "latitude": 20.970100, "longitude": 105.795400},
  {"id": 14, "name": "Bệnh viện Phổi Trung ương", "province": "Hà Nội", "latitude": 21.040400, "longitude": 105.814300},
  {"id": 15, "name": "Bệnh viện 74 Trung ương", "province": "Vĩnh Phúc", "latitude": 21.284200, "longitude": 105.719600},
  {"id": 16, "name": "Bệnh viện Mắt Trung ương", "province": "Hà Nội", "latitude": 21.017800, "longitude": 105.847500},
  {"id": 17, "name": "Bệnh viện Nhi Trung ương", "province": "Hà Nội", "latitude": 21.025300, "longitude": 105.803200},
  {"id": 18, "name": "Bệnh viện Nội tiết trung ương", "province": "Hà Nội", "latitude": 20.941600, "longitude": 105.812400},
  {"id": 19, "name": "Bệnh viện Phụ Sản Trung Ương", "province": "Hà Nội", "latitude": 21.026900, "longitude": 105.846100},
  {"id": 20, "name": "Bệnh viện Phong - Da liễu TW Quỳnh Lập", "province": "Nghệ An", "latitude": 19.260500, "longitude": 105.753200},
  {"id": 21, "name": "Bệnh viện Phong - Da liễu TW Quy Hòa", "province": "Bình Định", "latitude": 13.738100, "longitude": 109.221500},
  {"id": 22, "name": "Bệnh viện Răng Hàm Mặt TW TP. Hồ Chí Minh", "province": "TP. Hồ Chí Minh", "latitude": 10.755400, "longitude": 106.666300},
  {"id": 23, "name": "Bệnh viện Tai Mũi Họng TW", "province": "Hà Nội", "latitude": 21.002100, "longitude": 105.839800},
  {"id": 24, "name": "Bệnh viện Răng Hàm Mặt TW", "province": "Hà Nội", "latitude": 21.027200, "longitude": 105.846500},
  {"id": 25, "name": "Bệnh viện Tâm thần Trung ương 1", "province": "Hà Nội", "latitude": 20.892500, "longitude": 105.867100},
  {"id": 26, "name": "Bệnh viện Tâm thần Trung ương 2", "province": "Đồng Nai", "latitude": 10.963200, "longitude": 106.840100},
  {"id": 27, "name": "Bệnh viện Thống Nhất", "province": "TP. Hồ Chí Minh", "latitude": 10.793400, "longitude": 106.653100},
  {"id": 28, "name": "Bệnh viện Việt Nam - Cuba Đồng Hới", "province": "Quảng Bình", "latitude": 17.472100, "longitude": 106.623400},
  {"id": 29, "name": "Bệnh viện Việt Nam - Thụy Điển Uông Bí", "province": "Quảng Ninh", "latitude": 21.043500, "longitude": 106.772100},
  {"id": 30, "name": "Bệnh viện Hữu nghị Việt Đức", "province": "Hà Nội", "latitude": 21.027500, "longitude": 105.845200},
  {"id": 31, "name": "Bệnh viện 71 Trung Ương", "province": "Thanh Hóa", "latitude": 19.825100, "longitude": 105.752300},
  {"id": 32, "name": "Bệnh viện Bệnh Nhiệt đới Trung ương", "province": "Hà Nội", "latitude": 21.134200, "longitude": 105.789500},
  {"id": 33, "name": "Bệnh viện Lão khoa Trung ương", "province": "Hà Nội", "latitude": 21.001200, "longitude": 105.840500},
  {"id": 34, "name": "Bệnh viện Da liễu Trung ương", "province": "Hà Nội", "latitude": 21.000800, "longitude": 105.839100},
  {"id": 35, "name": "Bệnh viện Trung ương Quân đội 108", "province": "Hà Nội", "latitude": 21.018200, "longitude": 105.863100},
  {"id": 36, "name": "Bệnh viện Quân Y 175", "province": "TP. Hồ Chí Minh", "latitude": 10.821400, "longitude": 106.678200},
  {"id": 37, "name": "Viện Y học cổ truyền Quân đội", "province": "Hà Nội", "latitude": 20.978100, "longitude": 105.826500},
  {"id": 38, "name": "Bệnh viện Quân y 103", "province": "Hà Nội", "latitude": 20.964200, "longitude": 105.790100},
  {"id": 39, "name": "Bệnh viện Bỏng Quốc gia Lê Hữu Trác", "province": "Hà Nội", "latitude": 20.965100, "longitude": 105.790500}
];

export function getNearestHospital(lat: number, lng: number): Hospital {
  let nearest = CENTRAL_HOSPITALS[0];
  let minDistance = Infinity;

  for (const hospital of CENTRAL_HOSPITALS) {
    const dist = getDistanceFromLatLonInKm(lat, lng, hospital.latitude, hospital.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = hospital;
    }
  }
  return nearest;
}

// Haversine formula
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function getHospitalsByProvince() {
  const grouped: Record<string, Hospital[]> = {};
  for (const h of CENTRAL_HOSPITALS) {
    if (!grouped[h.province]) grouped[h.province] = [];
    grouped[h.province].push(h);
  }
  return grouped;
}
