const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

const historyViewCode = 
"/* ---------- HistoryView (Supabase Connected) ---------- */\n" +
"function HistoryView() {\n" +
"  const [historyRecords, setHistoryRecords] = useState<any[]>([]);\n" +
"\n" +
"  useEffect(() => {\n" +
"    supabase\n" +
"      .from('dispatch_records')\n" +
"      .select('*')\n" +
"      .eq('status', 'completed')\n" +
"      .order('completed_at', { ascending: false })\n" +
"      .then(({ data }) => {\n" +
"        if (data) setHistoryRecords(data);\n" +
"      });\n" +
"\n" +
"    const sub = supabase\n" +
"      .channel('history_channel')\n" +
"      .on(\n" +
"        'postgres_changes',\n" +
"        { event: '*', schema: 'public', table: 'dispatch_records', filter: 'status=eq.completed' },\n" +
"        (payload) => {\n" +
"          if (payload.eventType === 'INSERT') {\n" +
"            setHistoryRecords(prev => [payload.new, ...prev]);\n" +
"          } else if (payload.eventType === 'UPDATE') {\n" +
"            setHistoryRecords(prev => {\n" +
"              const idx = prev.findIndex(r => r.plate === payload.new.plate);\n" +
"              if (idx === -1) return [payload.new, ...prev];\n" +
"              const copy = [...prev];\n" +
"              copy[idx] = payload.new;\n" +
"              return copy;\n" +
"            });\n" +
"          }\n" +
"        }\n" +
"      )\n" +
"      .subscribe();\n" +
"\n" +
"    return () => {\n" +
"      supabase.removeChannel(sub);\n" +
"    };\n" +
"  }, []);\n" +
"\n" +
"  return (\n" +
"    <div className=\"flex-1 flex flex-col p-6 max-h-screen overflow-hidden bg-slate-50/50\">\n" +
"      <div className=\"flex items-center gap-4 mb-8\">\n" +
"        <div>\n" +
"          <h1 className=\"text-2xl font-black text-slate-900 font-geist tracking-tight flex items-center gap-3\">\n" +
"            <div className=\"w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20\">\n" +
"              <History className=\"w-5 h-5\" />\n" +
"            </div>\n" +
"            Lịch sử Điều phối Cấp cứu\n" +
"          </h1>\n" +
"          <p className=\"text-slate-500 font-medium mt-1 ml-13 flex items-center gap-2\">\n" +
"            Theo dõi các ca cấp cứu ngoại viện đã hoàn thành\n" +
"          </p>\n" +
"        </div>\n" +
"      </div>\n" +
"      \n" +
"      <div className=\"bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col\">\n" +
"        <div className=\"flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2\">\n" +
"          <div>\n" +
"            <h3 className=\"text-base font-bold text-slate-900 flex items-center gap-2\">\n" +
"              <CheckCircle2 className=\"w-4 h-4\" style={{ color: '#88E8F2' }} />\n" +
"              Danh sách Đã hoàn thành\n" +
"            </h3>\n" +
"            <p className=\"text-[11px] text-slate-500 font-geist\">\n" +
"              Tổng số {historyRecords.length} ca\n" +
"            </p>\n" +
"          </div>\n" +
"        </div>\n" +
"\n" +
"        <div className=\"overflow-x-auto flex-1 h-0\">\n" +
"          <table className=\"w-full text-sm text-left min-w-[1000px]\">\n" +
"            <thead className=\"text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0 z-10\">\n" +
"              <tr>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Biển số xe</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Tên bệnh nhân</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Giới tính</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Độ tuổi</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Số CCCD</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Bệnh nền</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Dị ứng thuốc</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Nhãn cấp cứu</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Kíp CC</th>\n" +
"                <th className=\"px-3 py-3 whitespace-nowrap\">Kết thúc lúc</th>\n" +
"              </tr>\n" +
"            </thead>\n" +
"            <tbody>\n" +
"              {historyRecords.length === 0 ? (\n" +
"                <tr><td colSpan={10} className=\"px-4 py-8 text-center text-slate-400\">Chưa có ca cấp cứu nào hoàn thành</td></tr>\n" +
"              ) : historyRecords.map((rec, idx) => (\n" +
"                <tr key={`${rec.plate}-${idx}`} className=\"border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors\">\n" +
"                  <td className=\"px-3 py-3\"><span className=\"font-mono font-bold text-slate-600 text-[13px]\">{rec.plate}</span></td>\n" +
"                  <td className=\"px-3 py-3\"><span className=\"font-semibold text-slate-600\">{rec.patient_name || \"—\"}</span></td>\n" +
"                  <td className=\"px-3 py-3 text-slate-500\">{rec.gender || \"—\"}</td>\n" +
"                  <td className=\"px-3 py-3 text-slate-500\">{rec.age || \"—\"}</td>\n" +
"                  <td className=\"px-3 py-3 font-mono text-[12px] text-slate-500\">{rec.cccd || \"—\"}</td>\n" +
"                  <td className=\"px-3 py-3 max-w-[180px]\">\n" +
"                    {rec.chronic_conditions && rec.chronic_conditions.length > 0 ? (\n" +
"                      <div className=\"flex flex-wrap gap-1\">\n" +
"                        {rec.chronic_conditions.map((c: string) => (\n" +
"                          <span key={c} className=\"px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500\">{c}</span>\n" +
"                        ))}\n" +
"                      </div>\n" +
"                    ) : <span className=\"text-slate-400 text-xs\">Không có</span>}\n" +
"                  </td>\n" +
"                  <td className=\"px-3 py-3 max-w-[160px]\">\n" +
"                    {rec.allergies && rec.allergies.length > 0 ? (\n" +
"                      <div className=\"flex flex-wrap gap-1\">\n" +
"                        {rec.allergies.map((a: string) => (\n" +
"                          <span key={a} className=\"px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500\">{a}</span>\n" +
"                        ))}\n" +
"                      </div>\n" +
"                    ) : <span className=\"text-slate-400 text-xs\">Không có</span>}\n" +
"                  </td>\n" +
"                  <td className=\"px-3 py-3\">\n" +
"                    {rec.alert_label ? (\n" +
"                      <span className=\"px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 bg-slate-100 border border-slate-200 whitespace-nowrap\">{rec.alert_label}</span>\n" +
"                    ) : <span className=\"text-slate-400 text-xs\">Chưa có</span>}\n" +
"                  </td>\n" +
"                  <td className=\"px-3 py-3 text-slate-500 text-xs font-semibold\">{rec.er_team || \"—\"}</td>\n" +
"                  <td className=\"px-3 py-3 text-slate-500 text-xs\">{rec.completed_at ? new Date(rec.completed_at).toLocaleTimeString() : \"—\"}</td>\n" +
"                </tr>\n" +
"              ))}\n" +
"            </tbody>\n" +
"          </table>\n" +
"        </div>\n" +
"      </div>\n" +
"    </div>\n" +
"  );\n" +
"}\n\n/* ---------- Main AmbulanceView ---------- */\n";

content = content.replace("/* ---------- Main AmbulanceView ---------- */", historyViewCode);

const ambStart = "function AmbulanceView() {\n  const [dispatchRecords, setDispatchRecords] = useState<Record<string, DispatchRecord>>({});";
const ambNew = "function AmbulanceView() {\n" +
"  const [dispatchRecords, setDispatchRecords] = useState<Record<string, any>>({});\n\n" +
"  // Sync with Supabase\n" +
"  useEffect(() => {\n" +
"    supabase.from('dispatch_records').select('*').eq('status', 'active').then(({ data }) => {\n" +
"      if (data) {\n" +
"        const r: Record<string, any> = {};\n" +
"        data.forEach(d => { r[d.plate] = d; });\n" +
"        setDispatchRecords(r);\n" +
"      }\n" +
"    });\n\n" +
"    const sub = supabase.channel('active_dispatch')\n" +
"      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_records', filter: 'status=eq.active' }, (payload) => {\n" +
"        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {\n" +
"          setDispatchRecords(prev => ({ ...prev, [payload.new.plate]: payload.new }));\n" +
"        } else if (payload.eventType === 'DELETE') {\n" +
"          setDispatchRecords(prev => {\n" +
"            const copy = { ...prev };\n" +
"            delete copy[payload.old.plate];\n" +
"            return copy;\n" +
"          });\n" +
"        }\n" +
"      })\n" +
"      .subscribe();\n\n" +
"    return () => { supabase.removeChannel(sub); };\n" +
"  }, []);";

content = content.replace(ambStart, ambNew);

// Remove History box regex 
content = content.replace(/\{\/\* ═+ BOX 3: LỊCH SỬ CẤP CỨU ═+ \*\/\}[\s\S]*?(?=\s*<\/div>\s*<\/div>\s*<\/>\s*\);\s*\})/, '');

// Remove unused history state
content = content.replace("const [historyRecords, setHistoryRecords] = useState<DispatchRecord[]>([]);\n", "");

content = content.replace(/const hasPatient = rec\.patientName !== null;/g, "const hasPatient = rec.patient_name !== null;");
content = content.replace(/rec\.patientName/g, "rec.patient_name");
content = content.replace(/rec\.chronicConditions/g, "rec.chronic_conditions");
content = content.replace(/rec\.alertLabel/g, "rec.alert_label");
content = content.replace(/rec\.erTeam/g, "rec.er_team");
content = content.replace(/rec\.addedAt/g, "rec.added_at");

const btnOld = "setHistoryRecords(prev => [{...rec, completedAt: Date.now()}, ...prev]);\n" +
"                              setDispatchRecords(prev => {\n" +
"                                const copy = { ...prev };\n" +
"                                delete copy[rec.plate];\n" +
"                                return copy;\n" +
"                              });\n" +
"                              showToast(`Đã hoàn thành hồ sơ xe ${rec.plate}`);";

const btnNew = "supabase.from('dispatch_records').update({ status: 'completed', completed_at: Date.now() }).eq('plate', rec.plate).then(() => {\n" +
"                                showToast(`Đã hoàn thành hồ sơ xe ${rec.plate}`);\n" +
"                              });";
content = content.replace(btnOld, btnNew);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Updated successfully");
