const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldList = `        {/* Appointments List */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
          {filtered.map((appt, i) => (
            <button
              key={i}
              onClick={() => { setSelectedRecordDate(appt.date); setCurrentView("health_record"); }}
              className="w-full flex items-center gap-4 bg-white px-4 py-4 border-b border-slate-100 active:bg-slate-50 transition-colors text-left"
            >
              <div className="flex flex-col items-center justify-center bg-[#88E8F2]/20 rounded-xl px-3 py-2 min-w-[56px]">
                <span className="text-[20px] font-black text-[#0d1f2d] leading-none">{appt.displayDate.split("/")[0]}</span>
                <span className="text-[11px] font-semibold text-[#0d1f2d]/70 mt-0.5">
                  {appt.displayDate.split("/")[1]}/{appt.displayDate.split("/")[2]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-[#0d1f2d] truncate">{appt.hospital}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">Ngày khám: {appt.displayDate}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>`;

const newList = `        {/* Appointments List */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-24 px-4 pt-4 flex flex-col gap-4 bg-[#f8f9fc]">
          {filtered.map((appt, i) => (
            <button
              key={i}
              onClick={() => { setSelectedRecordDate(appt.date); setCurrentView("health_record"); }}
              className="w-full bg-white rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] active:scale-[0.98] transition-transform text-left border border-slate-100 overflow-hidden flex"
            >
              <div className="w-[90px] flex flex-col items-center justify-center shrink-0 border-r border-slate-100 py-4">
                <span className="text-[36px] font-black text-[#085b9c] leading-none tracking-tighter">{appt.displayDate.split("/")[0]}</span>
                <span className="text-[13px] font-bold text-[#085b9c] mt-1 tracking-tight">
                  {appt.displayDate.split("/")[1]}/{appt.displayDate.split("/")[2]}
                </span>
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                 <div className="bg-[#085b9c] text-white text-[12px] font-bold uppercase px-3 py-1.5 rounded-br-[12px] self-start mb-2 inline-block max-w-full truncate">
                    {user?.name || "BỆNH NHÂN"}
                 </div>
                 <div className="px-3 pb-4">
                    <p className="text-[14px] font-medium text-[#0d1f2d] leading-snug">{appt.hospital}</p>
                 </div>
              </div>
            </button>
          ))}
        </div>`;

if (content.includes(oldList)) {
  content = content.replace(oldList, newList);
  fs.writeFileSync(filePath, content);
  console.log('SUCCESS: replaced list style');
} else {
  // try LF and CRLF variations
  const oldListLF = oldList.replace(/\r\n/g, '\n');
  const oldListCRLF = oldList.replace(/\n/g, '\r\n');
  const newListCRLF = newList.replace(/\n/g, '\r\n');

  if (content.includes(oldListLF)) {
    content = content.replace(oldListLF, newList);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS: replaced list style (LF)');
  } else if (content.includes(oldListCRLF)) {
    content = content.replace(oldListCRLF, newListCRLF);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS: replaced list style (CRLF)');
  } else {
    console.log('FAILED: could not find old list string');
    // find index
    const idx = content.indexOf('{/* Appointments List */}');
    console.log('Found at:', idx, 'Content:', JSON.stringify(content.substring(idx, idx + 200)));
  }
}
