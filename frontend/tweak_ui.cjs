const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Remove EtaCountdown setInterval
const oldEta = `function EtaCountdown({ initialSeconds }: { initialSeconds: number }) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    if (secs <= 0) return;
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{fmtEta(secs)}</span>;
}`;

const newEta = `function EtaCountdown({ initialSeconds }: { initialSeconds: number }) {
  return <span>{fmtEta(initialSeconds)}</span>;
}`;
content = content.replace(oldEta, newEta);


// 2. Remove ErStaffCard from AmbulanceView Box 1 right column
const rightColStr = `<div className="overflow-y-auto scrollbar-hide bg-slate-50/50 p-3 flex flex-col gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  Quét biển số · Mở cửa Barrier
                </h4>
                <LprScanner
                  plate={lprPlate}
                  onNotify={handleNotify}
                  queue={ambulances}
                  activeId={selectedId}
                  onSelectQueue={handleSelectMap}
                />
              </div>
              <ErStaffCard onCall={(name) => showToast(\` Đang gọi nội bộ \${name}...\`)} />
            </div>`;
const rightColNew = `<div className="overflow-y-auto scrollbar-hide bg-slate-50/50 p-3 flex flex-col gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <ScanLine className="w-3.5 h-3.5" style={{ color: ACCENT }} />
                  Quét biển số · Mở cửa Barrier
                </h4>
                <LprScanner
                  plate={lprPlate}
                  onNotify={handleNotify}
                  queue={ambulances}
                  activeId={selectedId}
                  onSelectQueue={handleSelectMap}
                />
              </div>
            </div>`;
content = content.replace(rightColStr, rightColNew);

// 3. Shrink map in AmbulanceView
const mapGridOld = `<div className="grid grid-cols-1 lg:grid-cols-2 lg:h-[500px]">
            {/* COL LEFT: Bản đồ xe cấp cứu */}
            <div className="relative border-r border-slate-100 overflow-hidden bg-slate-100 h-[380px] lg:h-auto min-h-[380px]">`;
const mapGridNew = `<div className="grid grid-cols-1 lg:grid-cols-2 lg:h-[400px]">
            {/* COL LEFT: Bản đồ xe cấp cứu */}
            <div className="relative border-r border-slate-100 overflow-hidden bg-slate-100 h-[300px] lg:h-auto min-h-[300px]">`;
content = content.replace(mapGridOld, mapGridNew);

// 4. EmsView add routeInfoRef and send eta_seconds in GPS_START and GPS_UPDATE
// First, insert routeInfoRef after routeInfo state
const routeInfoState = `const [routeInfo, setRouteInfo] = useState<{km: string, mins: number, destName: string} | null>(null);`;
const routeInfoStateNew = `const [routeInfo, setRouteInfo] = useState<{km: string, mins: number, destName: string} | null>(null);
  const routeInfoRef = useRef(routeInfo);
  useEffect(() => { routeInfoRef.current = routeInfo; }, [routeInfo]);`;
content = content.replace(routeInfoState, routeInfoStateNew);

// Now update the getCurrentPosition inside toggleGpsBroadcast
const getPosOld = `// Lay vi tri lan dau tien -> gui GPS_START kem bien so
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsState({ lat: latitude, lng: longitude });
          // GPS_START: dang ky bien so + toa do dau tien voi backend
          send({
            type: "GPS_START",
            data: { plate: savedPlate, lat: latitude, lng: longitude },
          });
        },`;
const getPosNew = `// Lay vi tri lan dau tien -> gui GPS_START kem bien so
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
content = content.replace(getPosOld, getPosNew);

// Update watchPosition inside toggleGpsBroadcast
const watchPosOld = `watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setGpsState({ lat: latitude, lng: longitude });
          send({
            type: "GPS_UPDATE",
            data: { plate: savedPlate, ambulance_id: "current", lat: latitude, lng: longitude },
          });
        },`;
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
        },`;
content = content.replace(watchPosOld, watchPosNew);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log('Done tweaking AmbulanceView and EmsView');
