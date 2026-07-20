const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldBlock = `              <div className="w-[90px] flex flex-col items-center justify-center shrink-0 border-r border-slate-100 py-4">
                <span className="text-[36px] font-black text-[#085b9c] leading-none tracking-tighter">{appt.displayDate.split("/")[0]}</span>
                <span className="text-[13px] font-bold text-[#085b9c] mt-1 tracking-tight">
                  {appt.displayDate.split("/")[1]}/{appt.displayDate.split("/")[2]}
                </span>
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                 <div className="bg-[#085b9c] text-white text-[12px] font-bold uppercase px-3 py-1.5 rounded-br-[12px] self-start mb-2 inline-block max-w-full truncate">
                    {user?.name || "BỆNH NHÂN"}
                 </div>`;

const newBlock = `              <div className="w-[90px] flex flex-col items-center justify-center shrink-0 border-r border-slate-100 py-4">
                <span className="text-[36px] font-black text-[#0d1f2d] leading-none tracking-tighter">{appt.displayDate.split("/")[0]}</span>
                <span className="text-[13px] font-bold text-[#0d1f2d] mt-1 tracking-tight">
                  {appt.displayDate.split("/")[1]}/{appt.displayDate.split("/")[2]}
                </span>
              </div>
              <div className="flex-1 flex flex-col min-w-0">
                 <div className="bg-[#88E8F2] text-[#0d1f2d] text-[12px] font-bold uppercase px-3 py-1.5 rounded-br-[12px] self-start mb-2 inline-block max-w-full truncate">
                    {user?.name || "BỆNH NHÂN"}
                 </div>`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(filePath, content);
  console.log("SUCCESS: Replaced colors (LF)");
} else {
  const oldBlockCRLF = oldBlock.replace(/\n/g, '\r\n');
  const newBlockCRLF = newBlock.replace(/\n/g, '\r\n');
  if (content.includes(oldBlockCRLF)) {
    content = content.replace(oldBlockCRLF, newBlockCRLF);
    fs.writeFileSync(filePath, content);
    console.log("SUCCESS: Replaced colors (CRLF)");
  } else {
    console.log("FAILED to find block to replace");
  }
}
