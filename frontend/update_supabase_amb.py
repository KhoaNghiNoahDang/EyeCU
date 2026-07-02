import re

with open('src/routes/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

history_view_code = """
/* ---------- HistoryView (Supabase Connected) ---------- */
function HistoryView() {
  const [historyRecords, setHistoryRecords] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from('dispatch_records')
      .select('*')
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .then(({ data }) => {
        if (data) setHistoryRecords(data);
      });

    const sub = supabase
      .channel('history_channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'dispatch_records', filter: 'status=eq.completed' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setHistoryRecords(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setHistoryRecords(prev => {
              const idx = prev.findIndex(r => r.plate === payload.new.plate);
              if (idx === -1) return [payload.new, ...prev];
              const copy = [...prev];
              copy[idx] = payload.new;
              return copy;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col p-6 max-h-screen overflow-hidden bg-slate-50/50">
      <div className="flex items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-geist tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20">
              <History className="w-5 h-5" />
            </div>
            Lịch sử Điều phối Cấp cứu
          </h1>
          <p className="text-slate-500 font-medium mt-1 ml-13 flex items-center gap-2">
            Theo dõi các ca cấp cứu ngoại viện đã hoàn thành
          </p>
        </div>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" style={{ color: '#88E8F2' }} />
              Danh sách Đã hoàn thành
            </h3>
            <p className="text-[11px] text-slate-500 font-geist">
              Tổng số {historyRecords.length} ca
            </p>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 h-0">
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
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
                <th className="px-3 py-3 whitespace-nowrap">Kết thúc lúc</th>
              </tr>
            </thead>
            <tbody>
              {historyRecords.length === 0 ? (
                <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">Chưa có ca cấp cứu nào hoàn thành</td></tr>
              ) : historyRecords.map((rec, idx) => (
                <tr key={`${rec.plate}-${idx}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-3"><span className="font-mono font-bold text-slate-600 text-[13px]">{rec.plate}</span></td>
                  <td className="px-3 py-3"><span className="font-semibold text-slate-600">{rec.patient_name || "—"}</span></td>
                  <td className="px-3 py-3 text-slate-500">{rec.gender || "—"}</td>
                  <td className="px-3 py-3 text-slate-500">{rec.age || "—"}</td>
                  <td className="px-3 py-3 font-mono text-[12px] text-slate-500">{rec.cccd || "—"}</td>
                  <td className="px-3 py-3 max-w-[180px]">
                    {rec.chronic_conditions && rec.chronic_conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {rec.chronic_conditions.map((c: string) => (
                          <span key={c} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{c}</span>
                        ))}
                      </div>
                    ) : <span className="text-slate-400 text-xs">Không có</span>}
                  </td>
                  <td className="px-3 py-3 max-w-[160px]">
                    {rec.allergies && rec.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {rec.allergies.map((a: string) => (
                          <span key={a} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{a}</span>
                        ))}
                      </div>
                    ) : <span className="text-slate-400 text-xs">Không có</span>}
                  </td>
                  <td className="px-3 py-3">
                    {rec.alert_label ? (
                      <span className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 whitespace-nowrap">{rec.alert_label}</span>
                    ) : <span className="text-slate-400 text-xs">Chưa có</span>}
                  </td>
                  <td className="px-3 py-3 text-slate-500 text-xs font-semibold">{rec.er_team || "—"}</td>
                  <td className="px-3 py-3 text-slate-500 text-xs">{rec.completed_at ? new Date(rec.completed_at).toLocaleTimeString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main AmbulanceView ---------- */
"""

content = content.replace("/* ---------- Main AmbulanceView ---------- */", history_view_code)

amb_start = """function AmbulanceView() {
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, DispatchRecord>>({});"""

amb_new = """function AmbulanceView() {
  const [dispatchRecords, setDispatchRecords] = useState<Record<string, any>>({});

  // Sync with Supabase
  useEffect(() => {
    supabase.from('dispatch_records').select('*').eq('status', 'active').then(({ data }) => {
      if (data) {
        const r: Record<string, any> = {};
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
  }, []);"""
content = content.replace(amb_start, amb_new)

# Remove old history box from AmbulanceView
# Using regex to remove from BOX 3: LỊCH SỬ CẤP CỨU until the end of AmbulanceView (but keep the closing tag)
content = re.sub(r'\{\/\* ═+ BOX 3: LỊCH SỬ CẤP CỨU ═+ \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*<\/>\s*\);\s*\})', '', content)

# Remove unused history state
content = content.replace("const [historyRecords, setHistoryRecords] = useState<DispatchRecord[]>([]);\n", "")

content = content.replace("const hasPatient = rec.patientName !== null;", "const hasPatient = rec.patient_name !== null;")
content = content.replace("rec.patientName", "rec.patient_name")
content = content.replace("rec.chronicConditions", "rec.chronic_conditions")
content = content.replace("rec.alertLabel", "rec.alert_label")
content = content.replace("rec.erTeam", "rec.er_team")
content = content.replace("rec.addedAt", "rec.added_at")
content = content.replace("rec.eta !== null", "rec.eta != null")

btn_old = """                              setHistoryRecords(prev => [{...rec, completedAt: Date.now()}, ...prev]);
                              setDispatchRecords(prev => {
                                const copy = { ...prev };
                                delete copy[rec.plate];
                                return copy;
                              });
                              showToast(`Đã hoàn thành hồ sơ xe ${rec.plate}`);"""

btn_new = """                              supabase.from('dispatch_records').update({ status: 'completed', completed_at: Date.now() }).eq('plate', rec.plate).then(() => {
                                showToast(`Đã hoàn thành hồ sơ xe ${rec.plate}`);
                              });"""
content = content.replace(btn_old, btn_new)

with open('src/routes/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
