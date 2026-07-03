const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// Normalize to LF
content = content.replace(/\r\n/g, '\n');

// Update Box 2 to grid
const box2_start = `        {/* ═══════════════════════════════════════════════════════════════
            BOX 2: XỬ LÝ HỒ SƠ
        ═══════════════════════════════════════════════════════════════ */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">`;

const box2_new = `        {/* ═══════════════════════════════════════════════════════════════
            BOX 2: XỬ LÝ HỒ SƠ & LỊCH SỬ CẤP CỨU
        ═══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* LỊCH SỬ CẤP CỨU (Trái) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="flex flex-wrap justify-between items-center px-4 py-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <HistoryIcon className="w-4 h-4" style={{ color: '#88E8F2' }} />
                  Lịch sử Cấp cứu
                </h3>
                <p className="text-[11px] text-slate-500 font-geist">
                  Đã hoàn thành {historyRecords.length} ca
                </p>
              </div>
            </div>
            
            {historyRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <HistoryIcon className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Chưa có dữ liệu lịch sử</p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-sm text-left min-w-[900px]">
                  <thead className="text-[10px] text-slate-500 font-geist uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 whitespace-nowrap">Biển số xe</th>
                      <th className="px-3 py-3 whitespace-nowrap">Tên bệnh nhân</th>
                      <th className="px-3 py-3 whitespace-nowrap">Giới tính</th>
                      <th className="px-3 py-3 whitespace-nowrap">Độ tuổi</th>
                      <th className="px-3 py-3 whitespace-nowrap">Số CCCD</th>
                      <th className="px-3 py-3 whitespace-nowrap">Bảo hiểm Y Tế</th>
                      <th className="px-3 py-3 whitespace-nowrap">Liên hệ khẩn cấp</th>
                      <th className="px-3 py-3 whitespace-nowrap">Bệnh nền</th>
                      <th className="px-3 py-3 whitespace-nowrap">Dị ứng thuốc</th>
                      <th className="px-3 py-3 whitespace-nowrap">Nhãn cấp cứu</th>
                      <th className="px-3 py-3 whitespace-nowrap">Cảnh báo trước</th>
                      <th className="px-3 py-3 whitespace-nowrap">Kíp CC</th>
                      <th className="px-3 py-3 whitespace-nowrap">Kết thúc lúc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((rec, idx) => (
                      <tr key={rec.plate + idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                        <td className="px-3 py-3"><span className="font-mono font-bold text-slate-900 text-[13px]">{rec.plate}</span></td>
                        <td className="px-3 py-3"><span className="font-semibold text-slate-900">{rec.patient_name || "—"}</span></td>
                        <td className="px-3 py-3 text-slate-700">{rec.gender || "—"}</td>
                        <td className="px-3 py-3 text-slate-700">{rec.age || "—"}</td>
                        <td className="px-3 py-3 font-mono text-[12px] text-slate-700">{rec.cccd || "—"}</td>
                        <td className="px-3 py-3 font-mono text-[12px] text-slate-700">{rec.bhxh_code || "—"}</td>
                        <td className="px-3 py-3 text-[11px] text-slate-600">
                          {rec.emergency_contact_name ? (
                            <div className="flex flex-col">
                              <span className="font-semibold">{rec.emergency_contact_name}</span>
                              <span>{rec.emergency_contact_phone}</span>
                            </div>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-3 max-w-[150px]">
                          {rec.chronic_conditions && rec.chronic_conditions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {rec.chronic_conditions.map((c) => (
                                <span key={c} className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">{c}</span>
                              ))}
                            </div>
                          ) : <span className="text-slate-400 text-xs">Không có</span>}
                        </td>
                        <td className="px-3 py-3 max-w-[150px]">
                          {rec.allergies && rec.allergies.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {rec.allergies.map((a) => (
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
                        <td className="px-3 py-3 max-w-[200px] text-xs">
                          {rec.pre_alert_text || "Không có"}
                        </td>
                        <td className="px-3 py-3 text-slate-500 text-xs font-semibold">{rec.er_team || "—"}</td>
                        <td className="px-3 py-3 text-slate-500 text-xs whitespace-nowrap">{rec.completed_at ? new Date(rec.completed_at).toLocaleTimeString() : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* XỬ LÝ HỒ SƠ CẤP CỨU (Phải) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">`;

content = content.replace(box2_start, box2_new);

const box2_end = `                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}`;

const box2_end_new = `                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}`;

content = content.replace(box2_end, box2_end_new);

// Write back preserving LF
fs.writeFileSync(path, content, 'utf8');

console.log("Done adding history box");
