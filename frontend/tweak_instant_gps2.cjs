const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// Replace getCurrentPosition block
const currentPosRegex = /\/\/\s*Lay vi tri lan dau tien -> gui GPS_START kem bien so\s*navigator\.geolocation\.getCurrentPosition\(\s*\(\s*pos\s*\)\s*=>\s*\{([\s\S]*?)data:\s*\{\s*plate:\s*savedPlate,\s*lat:\s*latitude,\s*lng:\s*longitude\s*\}\s*\,\s*\}\)\;\s*\}\,/;

const currentPosNew = `// Lay vi tri lan dau tien -> gui GPS_START kem bien so
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsState({ lat: latitude, lng: longitude });
          const distKm = Math.sqrt(Math.pow(latitude - 21.0011, 2) + Math.pow(longitude - 105.8418, 2)) * 111;
          const etaSeconds = routeInfoRef.current ? routeInfoRef.current.mins * 60 : Math.max(60, Math.round((distKm / 40) * 3600));
          // GPS_START: dang ky bien so + toa do dau tien voi backend
          send({
            type: "GPS_START",
            data: { plate: savedPlate, lat: latitude, lng: longitude, eta_seconds: etaSeconds },
          });
        },`;

if (currentPosRegex.test(content)) {
  content = content.replace(currentPosRegex, currentPosNew);
  console.log("getCurrentPosition updated.");
} else {
  console.log("getCurrentPosition NOT matched.");
}

// Replace watchPosition block
const watchPosRegex = /watchIdRef\.current\s*=\s*navigator\.geolocation\.watchPosition\(\s*\(\s*pos\s*\)\s*=>\s*\{([\s\S]*?)data:\s*\{\s*plate:\s*savedPlate,\s*ambulance_id:\s*"current",\s*lat:\s*latitude,\s*lng:\s*longitude\s*\}\s*\,\s*\}\)\;\s*\}/;

const watchPosNew = `watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsState({ lat: latitude, lng: longitude });
          const distKm = Math.sqrt(Math.pow(latitude - 21.0011, 2) + Math.pow(longitude - 105.8418, 2)) * 111;
          const etaSeconds = routeInfoRef.current ? routeInfoRef.current.mins * 60 : Math.max(60, Math.round((distKm / 40) * 3600));
          send({
            type: "GPS_UPDATE",
            data: { plate: savedPlate, ambulance_id: "current", lat: latitude, lng: longitude, eta_seconds: etaSeconds },
          });
        }`;

if (watchPosRegex.test(content)) {
  content = content.replace(watchPosRegex, watchPosNew);
  console.log("watchPosition updated.");
} else {
  console.log("watchPosition NOT matched.");
}

// Add the immediate GPS_START dispatch
const setupRegex = /setPlateConfirmed\(savedPlate\);\s*setIsBroadcasting\(true\);/;
const setupNew = `setPlateConfirmed(savedPlate);
      setIsBroadcasting(true);

      // GỬI NGAY LẬP TỨC để bảng nhận được thông tin mà không cần chờ thiết bị định vị
      const initLat = gpsState?.lat ?? 21.0011;
      const initLng = gpsState?.lng ?? 105.8418;
      const initDistKm = Math.sqrt(Math.pow(initLat - 21.0011, 2) + Math.pow(initLng - 105.8418, 2)) * 111;
      const initEta = routeInfoRef.current ? routeInfoRef.current.mins * 60 : Math.max(60, Math.round((initDistKm / 40) * 3600));
      send({
        type: "GPS_START",
        data: { plate: savedPlate, lat: initLat, lng: initLng, eta_seconds: initEta },
      });`;

if (setupRegex.test(content)) {
  content = content.replace(setupRegex, setupNew);
  console.log("Immediate GPS_START added.");
} else {
  console.log("setupRegex NOT matched.");
}

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
