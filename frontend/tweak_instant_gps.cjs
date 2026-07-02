const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

const oldCode = `      setPlateConfirmed(savedPlate);
      setIsBroadcasting(true);

      // Lay vi tri lan dau tien -> gui GPS_START kem bien so`;

const newCode = `      setPlateConfirmed(savedPlate);
      setIsBroadcasting(true);

      // GỬI NGAY LẬP TỨC để bảng nhận được thông tin mà không cần chờ thiết bị định vị
      const initLat = gpsState?.lat ?? 20.99; // Giả lập toạ độ gần đó
      const initLng = gpsState?.lng ?? 105.83;
      const initDistKm = Math.sqrt(Math.pow(initLat - 21.0011, 2) + Math.pow(initLng - 105.8418, 2)) * 111;
      const initEta = routeInfoRef.current ? routeInfoRef.current.mins * 60 : Math.max(60, Math.round((initDistKm / 40) * 3600));
      send({
        type: "GPS_START",
        data: { plate: savedPlate, lat: initLat, lng: initLng, eta_seconds: initEta },
      });

      // Lay vi tri lan dau tien -> gui GPS_START kem bien so`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
  console.log("GPS_START instant emit added.");
} else {
  console.log("Could not find the target code to replace.");
}
