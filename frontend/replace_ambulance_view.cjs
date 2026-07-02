const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// Find AmbulanceView function start
const startMarker = 'function AmbulanceView() {';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) { console.log('AmbulanceView not found'); process.exit(1); }

// Find end — look for the closing '}\n\n/* ---------- ER Staff Card ---------- */'
const endMarker = '/* ---------- ER Staff Card ---------- */';
const endIdx = content.indexOf(endMarker);
if (endIdx === -1) { console.log('End marker not found'); process.exit(1); }

// Go backwards from endIdx to find the blank line before it
// We want to replace from startIdx to the char before endMarker
const replacement = `function AmbulanceView() {
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, DispatchRecord>>({});

  useEffect(() => {
    fetchApi("/ambulance")
      .then((data: any[]) => {
        const mapped: AmbulanceUnit[] = data.map((d: any) => ({
          id: d.id,
          plate: d.plate,
          status: ["critical", "urgent", "standby"].includes(d.status) ? d.status : "standby",
          patient: "Đang cập nhật...",
          diagnosis: "Đang cập nhật...",
          etaSeconds: 300,
          crew: d.driver || "Chưa phân công",
          mapX: 0,
          mapY: 0,
          departmentId: "er",
          lat: d.lat,
          lng: d.lng,
        }));
        setAmbulances(mapped);
      })
      .catch(console.error);
  }, []);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [lprPlate, setLprPlate] = useState("29A-213.07");
  const [toast, setToast] = useState("");
  const [panelMode, setPanelMode] = useState<"dept" | "vehicle">("dept");
  const [fallAlert, setFallAlert] = useState<{ room: string; imageUrl: string; time: string } | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 4000);
  }, []);

  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const WS_URL = (import.meta.env.VITE_WS_URL ?? \`ws://\${host}:8000\`) + "/api/ambient/ws/live";

  const handleSocketMessage = useCallback(
    (msg: { type: string; data?: Record<string, unknown>; room_id?: string; blurred_image_base64?: string }) => {
      // ── GPS_START: xe mới đăng ký nhiệm vụ ──────────────────────────
      if (msg.type === "GPS_START" && msg.data) {
        const { plate } = msg.data as { plate: string };
        if (plate) {
          setDispatchRecords((prev) => ({
            ...prev,
            [plate]: {
              plate,
              eta: null,
              patientName: null,
              gender: null,
              age: null,
              cccd: null,
              chronicConditions: null,
              allergies: null,
              alertLabel: null,
              erTeam: "",
              addedAt: Date.now(),
              ...(prev[plate] || {}),
              // keep plate always correct
              plate,
            },
          }));
          // Cũng cập nhật ambulances map nếu xe chưa có
          setAmbulances((prev) => {
            if (prev.find((a) => a.plate === plate)) return prev;
            return [
              ...prev,
              {
                id: plate,
                plate,
                status: "urgent" as const,
                patient: "Đang cập nhật...",
                diagnosis: "Đang cập nhật...",
                etaSeconds: 600,
                crew: "Kíp EMS",
                mapX: 0,
                mapY: 0,
                departmentId: "er",
                lat: (msg.data as any).lat ?? undefined,
                lng: (msg.data as any).lng ?? undefined,
              },
            ];
          });
        }
      }
      // ── GPS_UPDATE: cập nhật vị trí + ETA ───────────────────────────
      if (msg.type === "GPS_UPDATE" && msg.data) {
        const { ambulance_id, lat, lng, plate: msgPlate, eta_seconds } = msg.data as {
          ambulance_id: string; lat: number; lng: number; plate?: string; eta_seconds?: number;
        };
        setAmbulances((prev) =>
          prev.map((a) => {
            if (a.id === ambulance_id || (ambulance_id === "current" && a.id === "xe1") || (msgPlate && a.plate === msgPlate)) {
              return { ...a, lat, lng, etaSeconds: eta_seconds ?? a.etaSeconds };
            }
            return a;
          }),
        );
        // Cập nhật ETA trong dispatchRecords
        if (msgPlate) {
          setDispatchRecords((prev) => {
            if (!prev[msgPlate]) return prev;
            return { ...prev, [msgPlate]: { ...prev[msgPlate], eta: eta_seconds ?? prev[msgPlate].eta } };
          });
        }
      }
      // ── PATIENT_UPDATE: bệnh nhân được gắn kèm xe ───────────────────
      if (msg.type === "PATIENT_UPDATE" && msg.data) {
        const d = msg.data as {
          plate: string; name?: string; gender?: string; age?: string; cccd?: string;
          chronic_conditions?: string[]; allergies?: string[]; alert_label?: string;
        };
        if (d.plate) {
          setDispatchRecords((prev) => ({
            ...prev,
            [d.plate]: {
              plate: d.plate,
              eta: prev[d.plate]?.eta ?? null,
              patientName: d.name ?? prev[d.plate]?.patientName ?? null,
              gender: d.gender ?? prev[d.plate]?.gender ?? null,
              age: d.age ?? prev[d.plate]?.age ?? null,
              cccd: d.cccd ?? prev[d.plate]?.cccd ?? null,
              chronicConditions: d.chronic_conditions ?? prev[d.plate]?.chronicConditions ?? null,
              allergies: d.allergies ?? prev[d.plate]?.allergies ?? null,
              alertLabel: d.alert_label ?? prev[d.plate]?.alertLabel ?? null,
              erTeam: prev[d.plate]?.erTeam ?? "",
              addedAt: prev[d.plate]?.addedAt ?? Date.now(),
            },
          }));
        }
      }
      // ── GATE events ──────────────────────────────────────────────────
      if ((msg.type === "GATE_ARRIVED" || msg.type === "GATE_OPEN") && msg.data) {
        const { plate } = msg.data as { plate: string };
        setLprPlate(plate);
        showToast(\`Xe \${plate} đã đến cổng - Barrier tự động mở\`);
      }
      if (msg.type === "CAMERA_STREAM") {
        window.dispatchEvent(new CustomEvent("camera-stream", { detail: { room: msg.room_id, image: (msg as any).image_base64 } }));
      }
      if (msg.type === "FALL_DETECTED") {
        setFallAlert({ room: msg.room_id || "Unknown", imageUrl: msg.blurred_image_base64 || "", time: new Date().toLocaleTimeString() });
        try { new Audio("/alert.mp3").play().catch(() => {}); } catch (e) {}
      }
    },
    [showToast],
  );

  useEyeCUSocket({ url: WS_URL, onMessage: handleSocketMessage });

  const handleSelectMap = (id: string) => {
    const found = ambulances.find((a) => a.id === id);
    if (!found) return;
    setSelectedId(id);
    setLprPlate(found.plate);
    setPanelMode("vehicle");
  };
  const handleNotify = () => showToast("✓ Đã gửi OTT cho kíp trực · Phản hồi trong 30s");

  const visibleAmbs = filter === "all" ? ambulances : ambulances.filter((a) => a.status === filter);
  const selectedAmb = ambulances.find((a) => a.id === selectedId) ?? null;

  // Danh sách hồ sơ dispatch — sắp xếp theo thời gian đến mới nhất
  const dispatchList = Object.values(dispatchRecords).sort((a, b) => b.addedAt - a.addedAt);

  return (
    <>
      {toast && (
        <div className="fixed top-6 right-6 z-[999] bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
      {fallAlert && (
        <div className="fixed top-20 right-6 z-[999] bg-red-950 text-white p-5 rounded-2xl shadow-2xl flex flex-col gap-3 animate-fade-in border border-red-500 max-w-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
              <h3 className="font-bold text-red-400">PHÁT HIỆN TÉ NGÃ</h3>
            </div>
            <button onClick={() => setFallAlert(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <p className="text-sm">Camera AI phát hiện sự cố ngã tại phòng <span className="font-bold text-red-300">{fallAlert.room}</span> lúc {fallAlert.time}</p>
          {fallAlert.imageUrl && <img src={fallAlert.imageUrl} alt="Blurred Body" className="w-full rounded border border-red-900 mt-2" />}
        </div>
      )}

      <div className="space-y-4">
        {/* ═══════════════════════════════════════════════════════════════
            BOX 1: THEO DÕI CẤP CỨU
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header Box 1 */}
          <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapIcon className="w-4 h-4" style={{ color: ACCENT }} />
                Theo dõi Cấp cứu — BV Bạch Mai
              </h3>
              <p className="text-[11px] text-slate-500 font-geist">
                {ambulances.length} xe đang giám sát · GPS Galileo · Thời gian thực
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(["all", "critical", "urgent", "standby"] as MapFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={\`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition \${filter === f ? "text-slate-900" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-400"}\`}
                  style={filter === f ? { backgroundColor: ACCENT } : undefined}
                >
                  {f === "all" ? "Tất cả" : f === "critical" ? "Critical" : f === "urgent" ? "Urgent" : "Standby"}
                </button>
              ))}
              <span className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1" style={{ backgroundColor: ACCENT }}>
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                Live
              </span>
            </div>
          </div>

          {/* 2 cột ngang: Map trái | LPR phải */}
          <div className="grid grid-cols-1 lg:grid-cols-2 lg:h-[500px]">
            {/* COL LEFT: Bản đồ xe cấp cứu */}
            <div className="relative border-r border-slate-100 overflow-hidden bg-slate-100 h-[380px] lg:h-auto min-h-[380px]">
              <ClientAmbulanceMap ambulances={visibleAmbs} selectedId={selectedId} onSelect={handleSelectMap} />
              {/* ETA cards top-right */}
              <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-[400] max-w-[180px]">
                {ambulances.filter((a) => a.status !== "standby").map((amb) => {
                  const s = STATUS_STYLE[amb.status];
                  const isSel = selectedId === amb.id;
                  return (
                    <button
                      key={amb.id}
                      onClick={() => handleSelectMap(amb.id)}
                      className={\`bg-white border-2 \${s.border} rounded-xl shadow-lg px-2.5 py-1.5 text-left transition hover:shadow-xl \${isSel ? "ring-2 ring-offset-1 ring-sky-400" : ""}\`}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="relative flex w-2 h-2">
                          <span className={\`absolute inline-flex h-full w-full rounded-full \${s.dot} opacity-75 animate-ping\`} />
                          <span className={\`relative inline-flex rounded-full h-2 w-2 \${s.dot}\`} />
                        </span>
                        <span className="text-[10px] font-bold text-slate-900 font-mono">{amb.plate}</span>
                        <span className={\`ml-auto text-[8px] font-bold uppercase px-1 py-0.5 rounded \${s.badge} \${s.badgeText}\`}>{s.label}</span>
                      </div>
                      <p className="text-[10px] text-slate-600 truncate">{amb.diagnosis}</p>
                      <p className="text-[10px] font-bold" style={{ color: amb.status === "critical" ? "#DC2626" : "#D97706" }}>
                        ETA: <EtaCountdown initialSeconds={amb.etaSeconds} />
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="absolute bottom-2 left-2 z-[400] bg-white/90 text-[9px] text-slate-500 px-2 py-0.5 rounded shadow">
                OpenStreetMap · BV Bạch Mai, Hà Nội
              </div>
            </div>

            {/* COL RIGHT: Quét biển số mở barrier */}
            <div className="overflow-y-auto scrollbar-hide bg-slate-50/50 p-3 flex flex-col gap-3">
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
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            BOX 2: XỬ LÝ HỒ SƠ
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Header Box 2 */}
          <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4" style={{ color: ACCENT }} />
                Xử lý Hồ sơ Cấp cứu
              </h3>
              <p className="text-[11px] text-slate-500 font-geist">
                {dispatchList.length > 0 ? \`\${dispatchList.length} xe đang trên đường\` : "Chưa có xe nào đang trên đường"}
                {" · "}Cập nhật tự động từ xe EMS
              </p>
            </div>
            <span className="px-2 py-1 rounded text-[10px] font-geist uppercase tracking-wider text-slate-900 flex items-center gap-1" style={{ backgroundColor: ACCENT }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              Realtime
            </span>
          </div>

          {/* Bảng hồ sơ */}
          {dispatchList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Ambulance className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Chưa có xe cấp cứu nào đang trên đường</p>
              <p className="text-xs mt-1">Khi đội EMS bật GPS từ xe, thông tin sẽ hiển thị tại đây</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1100px]">
                <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 whitespace-nowrap">Biển số xe</th>
                    <th className="px-3 py-3 whitespace-nowrap">Dự kiến đến</th>
                    <th className="px-3 py-3 whitespace-nowrap">Tên bệnh nhân</th>
                    <th className="px-3 py-3 whitespace-nowrap">Giới tính</th>
                    <th className="px-3 py-3 whitespace-nowrap">Độ tuổi</th>
                    <th className="px-3 py-3 whitespace-nowrap">Số CCCD</th>
                    <th className="px-3 py-3 whitespace-nowrap">Bệnh nền</th>
                    <th className="px-3 py-3 whitespace-nowrap">Dị ứng thuốc</th>
                    <th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                    <th className="px-3 py-3 whitespace-nowrap">Chỉ định kíp CC</th>
                  </tr>
                </thead>
                <tbody>
                  {dispatchList.map((rec) => {
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
                        </td>
                        {/* Tên */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="font-semibold text-slate-900">{rec.patientName || "—"}</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* Giới tính */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="text-slate-700">{rec.gender || "—"}</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* Độ tuổi */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="text-slate-700">{rec.age || "—"}</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* CCCD */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            <span className="font-mono text-[12px] text-slate-700">{rec.cccd || "—"}</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* Bệnh nền */}
                        <td className="px-3 py-3 max-w-[180px]">
                          {hasPatient ? (
                            rec.chronicConditions && rec.chronicConditions.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rec.chronicConditions.map((c) => (
                                  <span key={c} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-700">{c}</span>
                                ))}
                              </div>
                            ) : <span className="text-slate-400 text-xs">Không có</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* Dị ứng */}
                        <td className="px-3 py-3 max-w-[160px]">
                          {hasPatient ? (
                            rec.allergies && rec.allergies.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {rec.allergies.map((a) => (
                                  <span key={a} className="px-1.5 py-0.5 rounded-full bg-red-100 text-[10px] font-bold text-red-700 border border-red-200">{a}</span>
                                ))}
                              </div>
                            ) : <span className="text-slate-400 text-xs">Không có</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* Nhãn cấp cứu */}
                        <td className="px-3 py-3">
                          {hasPatient ? (
                            rec.alertLabel ? (
                              <span className="px-2 py-1 rounded-lg text-[11px] font-bold text-red-700 bg-red-100 border border-red-200 whitespace-nowrap">{rec.alertLabel}</span>
                            ) : <span className="text-slate-400 text-xs">Chưa có</span>
                          ) : <LoadingCell />}
                        </td>
                        {/* Chỉ định kíp CC */}
                        <td className="px-3 py-3">
                          <input
                            type="text"
                            defaultValue={rec.erTeam}
                            placeholder="Nhập kíp..."
                            onBlur={(e) => {
                              const val = e.target.value;
                              setDispatchRecords((prev) => ({
                                ...prev,
                                [rec.plate]: { ...prev[rec.plate], erTeam: val },
                              }));
                            }}
                            className="w-32 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/** Ô hiển thị khi đang chờ dữ liệu từ EMS */
function LoadingCell() {
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
      <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin flex-shrink-0" />
      Đang lấy thông tin
    </span>
  );
}

`;

const beforeAmbulance = content.slice(0, startIdx);
const afterErStaff = content.slice(endIdx);

content = beforeAmbulance + replacement + afterErStaff;
fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log('Done - AmbulanceView replaced');
