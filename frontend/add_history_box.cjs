const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Add historyRecords state
const dispatchStateOld = `const [dispatchRecords, setDispatchRecords] = useState<Record<string, DispatchRecord>>({});`;
const dispatchStateNew = `const [dispatchRecords, setDispatchRecords] = useState<Record<string, DispatchRecord>>({});
  const [historyRecords, setHistoryRecords] = useState<DispatchRecord[]>([]);`;
if (content.includes(dispatchStateOld)) {
  content = content.replace(dispatchStateOld, dispatchStateNew);
  console.log("Added historyRecords state");
} else {
  console.log("dispatchRecords state not found");
}

// 2. Add 'Thao tác' column to active table header
const activeHeaderOld = `<th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                    <th className="px-3 py-3 whitespace-nowrap">Chỉ định kíp CC</th>
                  </tr>`;
const activeHeaderNew = `<th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                    <th className="px-3 py-3 whitespace-nowrap">Chỉ định kíp CC</th>
                    <th className="px-3 py-3 whitespace-nowrap text-right">Thao tác</th>
                  </tr>`;
if (content.includes(activeHeaderOld)) {
  content = content.replace(activeHeaderOld, activeHeaderNew);
  console.log("Added Thao tac to header");
} else {
  console.log("activeHeaderOld not found");
}

// 3. Add 'Hoàn thành' button to active table row
const activeRowOld = `                            className="w-32 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none bg-white"
                          />
                        </td>
                      </tr>`;
const activeRowNew = `                            className="w-32 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none bg-white"
                          />
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => {
                              setHistoryRecords(prev => [{...rec, completedAt: Date.now()}, ...prev]);
                              setDispatchRecords(prev => {
                                const copy = { ...prev };
                                delete copy[rec.plate];
                                return copy;
                              });
                              showToast(\`Đã hoàn thành hồ sơ xe \${rec.plate}\`);
                            }}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            Hoàn thành
                          </button>
                        </td>
                      </tr>`;
if (content.includes(activeRowOld)) {
  content = content.replace(activeRowOld, activeRowNew);
  console.log("Added Hoan thanh to row");
} else {
  console.log("activeRowOld not found");
}

// 4. Add 'Lịch sử Cấp cứu' box
const historyBox = `
        {/* ═══════════════════════════════════════════════════════════════
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
        )}
`;

const endBox2Old = `              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}`;
const endBox2New = `              </table>
            </div>
          )}
        </div>${historyBox}      </div>
    </>
  );
}`;

if (content.includes(endBox2Old)) {
  content = content.replace(endBox2Old, endBox2New);
  console.log("Added History Box");
} else {
  console.log("endBox2Old not found");
}

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
