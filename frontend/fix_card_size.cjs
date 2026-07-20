const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add PieChart to imports
const oldImports = `Home, Star, Camera, ScanLine, Share, PlusSquare, Volume2, VolumeX, Pause, Loader2, Scan, BriefcaseMedical, ChevronDown, CheckCircle2 , Landmark, CreditCard, QrCode } from "lucide-react";`;
const newImports = `Home, Star, Camera, ScanLine, Share, PlusSquare, Volume2, VolumeX, Pause, Loader2, Scan, BriefcaseMedical, ChevronDown, CheckCircle2 , Landmark, CreditCard, QrCode, PieChart, ActivitySquare } from "lucide-react";`;

if (content.includes(oldImports)) {
  content = content.replace(oldImports, newImports);
  console.log('SUCCESS: updated lucide imports');
} else {
  console.log('SKIP: imports already updated or not found');
}

const oldCard = `        {/* Patient Info Card */}
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-black text-[#0d1f2d] uppercase leading-tight">{user?.name || "BỆNH NHÂN"}</p>
            <p className="text-[13px] text-slate-500 mt-0.5">
              ({user?.dob || "01/01/1990"}{user?.dob ? (\` \${new Date().getFullYear() - parseInt(user.dob.split("/")[2])} tuổi\`) : " 35 tuổi"})
            </p>
          </div>
          <button
            onClick={() => setCurrentView("health_dashboard")}
            className="flex flex-col items-center gap-1 shrink-0 active:opacity-70"
          >
            <div className="w-10 h-10 bg-[#88E8F2]/20 rounded-xl flex items-center justify-center border border-[#88E8F2]/40">
              <Activity className="h-5 w-5 text-[#0d1f2d]" />
            </div>
            <span className="text-[10px] font-semibold text-[#0d1f2d] text-center leading-tight">Dashboard<br/>tổng quan</span>
          </button>
        </div>`;

const newCard = `        {/* Patient Info Card */}
        <div className="bg-white px-5 py-5 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-black text-[#0d1f2d] uppercase leading-tight">{user?.name || "BỆNH NHÂN"}</p>
            <p className="text-[14px] text-slate-500 mt-1">
              ({user?.dob || "01/01/1990"}{user?.dob ? (\` \${new Date().getFullYear() - parseInt(user.dob.split("/")[2])} tuổi\`) : " 35 tuổi"})
            </p>
          </div>
          <button
            onClick={() => setCurrentView("health_dashboard")}
            className="flex flex-col items-center gap-1.5 shrink-0 active:scale-95 transition-transform"
          >
            <div className="w-[52px] h-[52px] bg-[#e0f7fa] rounded-2xl flex items-center justify-center border border-[#b2ebf2] shadow-sm">
              <PieChart className="h-7 w-7 text-[#00838f]" />
            </div>
            <span className="text-[11px] font-bold text-[#0d1f2d] text-center leading-tight">Dashboard<br/>tổng quan</span>
          </button>
        </div>`;

if (content.includes(oldCard)) {
  content = content.replace(oldCard, newCard);
  fs.writeFileSync(filePath, content);
  console.log('SUCCESS: replaced patient card style');
} else {
  // try LF / CRLF
  const oldCardLF = oldCard.replace(/\r\n/g, '\n');
  const oldCardCRLF = oldCard.replace(/\n/g, '\r\n');
  const newCardCRLF = newCard.replace(/\n/g, '\r\n');
  
  if (content.includes(oldCardLF)) {
    content = content.replace(oldCardLF, newCard);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS: replaced patient card style (LF)');
  } else if (content.includes(oldCardCRLF)) {
    content = content.replace(oldCardCRLF, newCardCRLF);
    fs.writeFileSync(filePath, content);
    console.log('SUCCESS: replaced patient card style (CRLF)');
  } else {
    console.log('FAILED: could not find old card to replace');
  }
}
