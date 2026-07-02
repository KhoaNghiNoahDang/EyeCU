const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Remove ETA cards from map
const etaCardsRegex = /\{\/\* ETA cards top-right \*\/\}(.|\n)*?<\/div>\s*<div className="absolute bottom-2 left-2/;
content = content.replace(etaCardsRegex, `<div className="absolute bottom-2 left-2`);
if (!content.includes(`<div className="absolute bottom-2 left-2`)) {
  console.log("ETA Cards replace failed");
} else {
  console.log("ETA Cards removed");
}

// 2. Update GPS_START to use eta_seconds
const gpsStartOld = `      if (msg.type === "GPS_START" && msg.data) {
        const { plate } = msg.data as { plate: string };
        if (plate) {
          setDispatchRecords((prev) => ({
            ...prev,
            [plate]: {
              plate,
              eta: null,`;
const gpsStartNew = `      if (msg.type === "GPS_START" && msg.data) {
        const { plate, eta_seconds } = msg.data as { plate: string, eta_seconds?: number };
        if (plate) {
          setDispatchRecords((prev) => ({
            ...prev,
            [plate]: {
              plate,
              eta: typeof eta_seconds === 'number' ? eta_seconds : null,`;
content = content.replace(gpsStartOld, gpsStartNew);
if (content.includes("typeof eta_seconds")) {
  console.log("GPS_START updated");
}

// 3. Update GATE events
const gateOld = `      // ── GATE events ──────────────────────────────────────────────────
      if ((msg.type === "GATE_ARRIVED" || msg.type === "GATE_OPEN") && msg.data) {
        const { plate } = msg.data as { plate: string };
        setLprPlate(plate);
        showToast(\`Xe \${plate} đã đến cổng - Barrier tự động mở\`);
      }`;
const gateNew = `      // ── GATE events ──────────────────────────────────────────────────
      if ((msg.type === "GATE_ARRIVED" || msg.type === "GATE_OPEN") && msg.data) {
        const { plate } = msg.data as { plate: string };
        setLprPlate(plate);
        showToast(\`Xe \${plate} đã đến cổng - Barrier tự động mở\`);
        setDispatchRecords((prev) => {
          if (!prev[plate]) return prev;
          return { ...prev, [plate]: { ...prev[plate], eta: -1 } };
        });
      }`;
content = content.replace(gateOld, gateNew);
if (content.includes("eta: -1")) {
  console.log("GATE events updated");
}

// 4. Update Table Rendering for ETA
const tableRowOld = `                  {dispatchList.map((rec) => {
                    const hasPatient = rec.patientName !== null;
                    const etaText = rec.eta !== null ? \`\${Math.max(0, Math.round(rec.eta / 60))} phút\` : null;
                    return (
                      <tr key={rec.plate} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                        {/* Biển số */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="relative flex w-2 h-2 flex-shrink-0">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-[13px]">{rec.plate}</span>
                          </div>
                        </td>
                        {/* ETA */}
                        <td className="px-3 py-3">
                          {etaText ? (
                            <span className="font-bold text-orange-600 text-[13px]">{etaText}</span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>`;
                        
const tableRowNew = `                  {dispatchList.map((rec) => {
                    const hasPatient = rec.patientName !== null;
                    const isArrived = rec.eta === -1;
                    const etaText = rec.eta !== null && rec.eta !== -1 ? \`\${Math.max(0, Math.round(rec.eta / 60))} phút\` : null;
                    return (
                      <tr key={rec.plate} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                        {/* Biển số */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="relative flex w-2 h-2 flex-shrink-0">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="font-mono font-bold text-slate-900 text-[13px]">{rec.plate}</span>
                          </div>
                        </td>
                        {/* ETA */}
                        <td className="px-3 py-3">
                          {isArrived ? (
                            <span className="font-bold text-emerald-600 text-[13px] bg-emerald-100 px-2 py-1 rounded-md">Đã đến</span>
                          ) : etaText ? (
                            <span className="font-bold text-orange-600 text-[13px]">{etaText}</span>
                          ) : (
                            <LoadingCell />
                          )}
                        </td>`;
content = content.replace(tableRowOld, tableRowNew);
if (content.includes("isArrived")) {
  console.log("Table render updated");
}

// 5. Update LprScanner to mock GATE_OPEN
// We find LprScanner usage in AmbulanceView
const lprUsageOld = `<LprScanner
                  plate={lprPlate}
                  onNotify={handleNotify}
                  queue={ambulances}
                  activeId={selectedId}
                  onSelectQueue={handleSelectMap}
                />`;
const lprUsageNew = `<LprScanner
                  plate={lprPlate}
                  onNotify={handleNotify}
                  queue={ambulances}
                  activeId={selectedId}
                  onSelectQueue={handleSelectMap}
                  onScanComplete={(plate) => handleSocketMessage({ type: "GATE_OPEN", data: { plate } })}
                />`;
content = content.replace(lprUsageOld, lprUsageNew);

// Update LprScanner component signature and logic
const lprSigOld = `function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
}: {
  plate: string;
  onNotify: () => void;
  queue: any[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
}) {`;
const lprSigNew = `function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
  onScanComplete,
}: {
  plate: string;
  onNotify: () => void;
  queue: any[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
  onScanComplete?: (plate: string) => void;
}) {`;
content = content.replace(lprSigOld, lprSigNew);

const lprScanOld = `      setScanState("success");
      setScannedPlate(randomAmbulance.plate);
      setScannedImg(randomAmbulance.img || "");`;
const lprScanNew = `      setScanState("success");
      setScannedPlate(randomAmbulance.plate);
      setScannedImg(randomAmbulance.img || "");
      if (onScanComplete) onScanComplete(randomAmbulance.plate);`;
content = content.replace(lprScanOld, lprScanNew);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Done");
