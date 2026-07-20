const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldCard = `          <button
            onClick={() => setCurrentView("health_dashboard")}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-[52px] h-[52px] bg-[#e0f7fa] rounded-2xl flex items-center justify-center border border-[#b2ebf2] shadow-sm">
              <PieChart className="h-7 w-7 text-[#00838f]" />
            </div>
            <span className="text-[11px] font-bold text-[#0d1f2d] text-center leading-tight">Dashboard<br/>tổng quan</span>
          </button>`;

const newCard = `          <button
            onClick={() => setCurrentView("health_dashboard")}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-[52px] h-[52px] bg-[#e0f7fa] rounded-2xl flex items-center justify-center border border-[#b2ebf2] shadow-sm">
              <Activity className="h-7 w-7 text-[#00838f]" />
            </div>
            <span className="text-[11px] font-bold text-[#0d1f2d] text-center leading-tight">Dashboard<br/>tổng quan</span>
          </button>`;

if (content.includes(oldCard)) {
  content = content.replace(oldCard, newCard);
  fs.writeFileSync(filePath, content);
  console.log('SUCCESS: replaced PieChart with Activity');
} else {
  const oldCardCRLF = oldCard.replace(/\n/g, '\r\n');
  const newCardCRLF = newCard.replace(/\n/g, '\r\n');
  if (content.includes(oldCardCRLF)) {
    content = content.replace(oldCardCRLF, newCardCRLF);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS: replaced PieChart with Activity (CRLF)');
  } else {
    console.log('FAILED to find block');
  }
}
