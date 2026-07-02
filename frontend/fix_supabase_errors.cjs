const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Add Supabase import at the top
content = content.replace(
  'import { useAuth, type WorkMode } from "../lib/auth/auth-context";',
  'import { supabase } from "../lib/supabase";\nimport { useAuth, type WorkMode } from "../lib/auth/auth-context";'
);

// 2. Add HistoryIcon to lucide-react imports
content = content.replace(
  'import {\n  Activity,\n  Plus,\n  Eye,',
  'import {\n  Activity,\n  Plus,\n  Eye,\n  History as HistoryIcon,'
);

// 3. Fix HistoryView rendering to use HistoryIcon
content = content.replace(
  '<History className="w-5 h-5" />',
  '<HistoryIcon className="w-5 h-5" />'
);

// 4. Update LprScanner component to accept onScanComplete prop
const lprSigOld = `function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
  hospitalId,
}: {
  plate: string;
  onNotify: () => void;
  queue: AmbulanceUnit[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
  hospitalId?: string;
}) {`;

const lprSigNew = `function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
  hospitalId,
  onScanComplete,
}: {
  plate: string;
  onNotify: () => void;
  queue: AmbulanceUnit[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
  hospitalId?: string;
  onScanComplete?: (plate: string) => void;
}) {`;

content = content.replace(lprSigOld, lprSigNew);

// Trigger onScanComplete inside LprScanner
const scanClickOld = `      setScanState("success");
      setScannedPlate(randomAmbulance.plate);
      setScannedImg(randomAmbulance.img || "");`;
const scanClickNew = `      setScanState("success");
      setScannedPlate(randomAmbulance.plate);
      setScannedImg(randomAmbulance.img || "");
      if (onScanComplete) onScanComplete(randomAmbulance.plate);`;

content = content.replace(scanClickOld, scanClickNew);

// 5. Update AmbulanceView state and Supabase active record sync
const ambStateOld = `function AmbulanceView() {
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, DispatchRecord>>({});`;

const ambStateNew = `function AmbulanceView() {
  const [ambulances, setAmbulances] = useState<AmbulanceUnit[]>([]);
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, any>>({});

  useEffect(() => {
    supabase.from('dispatch_records').select('*').eq('status', 'active').then(({ data }) => {
      if (data) {
        const r = {};
        data.forEach(d => { r[d.plate] = d; });
        setDispatchRecords(r);
      }
    });

    const sub = supabase.channel('active_dispatch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_records', filter: 'status=eq.active' }, (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          setDispatchRecords(prev => ({ ...prev, [payload.new.plate]: payload.new }));
        } else if (payload.eventType === 'DELETE') {
          setDispatchRecords(prev => {
            const copy = { ...prev };
            delete copy[payload.old.plate];
            return copy;
          });
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);`;

content = content.replace(ambStateOld, ambStateNew);

// 6. Remove old BOX 3: LỊCH SỬ CẤP CỨU from AmbulanceView
// We replace the block from "BOX 3: LỊCH SỬ CẤP CỨU" to the close tag of AmbulanceView
const oldBox3 = `        {/* ═══════════════════════════════════════════════════════════════
            BOX 3: LỊCH SỬ CẤP CỨU
        ═══════════════════════════════════════════════════════════════ */}
        {historyRecords.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" style={{ color: ACCENT }} />
                  Lịch sử Cấp cứu
                </h3>
                <p className="text-[11px] text-slate-500 font-geist">
                  Đã hoàn thành {historyRecords.length} ca
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[1000px]">
                <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="px-3 py-3 whitespace-nowrap">Biển số xe</th>
                    <th className="px-3 py-3 whitespace-nowrap">Tên bệnh nhân</th>
                    <th className="px-3 py-3 whitespace-nowrap">Giới tính</th>
                    <th className="px-3 py-3 whitespace-nowrap">Độ tuổi</th>
                    <th className="px-3 py-3 whitespace-nowrap">Số CCCD</th>
                    <th className="px-3 py-3 whitespace-nowrap">Bệnh nền</th>
                    <th className="px-3 py-3 whitespace-nowrap">Dị ứng thuốc</th>
                    <th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                    <th className="px-3 py-3 whitespace-nowrap">Kíp CC</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((rec, idx) => (
                    <tr key={\`\${rec.plate}-\${idx}\`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                      <td className="px-3 py-3"><span className="font-mono font-bold text-slate-600 text-[13px]">{rec.plate}</span></td>
                      <td className="px-3 py-3"><span className="font-semibold text-slate-600">{rec.patientName || "—"}</span></td>
                      <td className="px-3 py-3 text-slate-500">{rec.gender || "—"}</td>
                      <td className="px-3 py-3 text-slate-500">{rec.age || "—"}</td>
                      <td className="px-3 py-3 font-mono text-[12px] text-slate-500">{rec.cccd || "—"}</td>
                      <td className="px-3 py-3 max-w-[180px]">
                        {rec.chronicConditions && rec.chronicConditions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rec.chronicConditions.map((c) => (
                              <span key={c} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{c}</span>
                            ))}
                          </div>
                        ) : <span className="text-slate-400 text-xs">Không có</span>}
                      </td>
                      <td className="px-3 py-3 max-w-[160px]">
                        {rec.allergies && rec.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rec.allergies.map((a) => (
                              <span key={a} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{a}</span>
                            ))}
                          </div>
                        ) : <span className="text-slate-400 text-xs">Không có</span>}
                      </td>
                      <td className="px-3 py-3">
                        {rec.alertLabel ? (
                          <span className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 whitespace-nowrap">{rec.alertLabel}</span>
                        ) : <span className="text-slate-400 text-xs">Chưa có</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-500 text-xs font-semibold">{rec.erTeam || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}`;

content = content.replace(oldBox3, '');

// 7. Update handleSocketMessage in AmbulanceView to write to Supabase directly so WS inputs propagate
const handleSocketOld = `    (msg: { type: string; data?: Record<string, unknown>; room_id?: string; blurred_image_base64?: string }) => {
      // ── GPS_START: xe mới đăng ký nhiệm vụ ──────────────────────────
      if (msg.type === "GPS_START" && msg.data) {
        const { plate, eta_seconds } = msg.data as { plate: string, eta_seconds?: number };
        if (plate) {
          setDispatchRecords((prev) => ({
            ...prev,
            [plate]: {
              plate,
              eta: typeof eta_seconds === 'number' ? eta_seconds : null,
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
        setDispatchRecords((prev) => {
          if (!prev[plate]) return prev;
          return { ...prev, [plate]: { ...prev[plate], eta: -1 } };
        });
      }`;

const handleSocketNew = `    (msg: { type: string; data?: Record<string, unknown>; room_id?: string; blurred_image_base64?: string }) => {
      // ── GPS_START: xe mới đăng ký nhiệm vụ ──────────────────────────
      if (msg.type === "GPS_START" && msg.data) {
        const { plate, eta_seconds, lat, lng } = msg.data as { plate: string, eta_seconds?: number, lat?: number, lng?: number };
        if (plate) {
          supabase.from('dispatch_records').upsert({
            plate,
            eta: typeof eta_seconds === 'number' ? eta_seconds : null,
            status: 'active',
            lat: lat ?? null,
            lng: lng ?? null,
            added_at: Date.now()
          }).then();

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
                lat: lat ?? undefined,
                lng: lng ?? undefined,
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
          supabase.from('dispatch_records').update({
            lat,
            lng,
            eta: eta_seconds ?? null
          }).eq('plate', msgPlate).then();
        }
      }
      // ── PATIENT_UPDATE: bệnh nhân được gắn kèm xe ───────────────────
      if (msg.type === "PATIENT_UPDATE" && msg.data) {
        const d = msg.data as {
          plate: string; name?: string; gender?: string; age?: string; cccd?: string;
          chronic_conditions?: string[]; allergies?: string[]; alert_label?: string;
        };
        if (d.plate) {
          supabase.from('dispatch_records').update({
            patient_name: d.name ?? null,
            gender: d.gender ?? null,
            age: d.age ?? null,
            cccd: d.cccd ?? null,
            chronic_conditions: d.chronic_conditions ?? null,
            allergies: d.allergies ?? null,
            alert_label: d.alert_label ?? null
          }).eq('plate', d.plate).then();
        }
      }
      // ── GATE events ──────────────────────────────────────────────────
      if ((msg.type === "GATE_ARRIVED" || msg.type === "GATE_OPEN") && msg.data) {
        const { plate } = msg.data as { plate: string };
        setLprPlate(plate);
        showToast(\`Xe \${plate} đã đến cổng - Barrier tự động mở\`);
        supabase.from('dispatch_records').update({
          eta: -1
        }).eq('plate', plate).then();
      }`;

content = content.replace(handleSocketOld, handleSocketNew);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Supabase fixes applied successfully.");
