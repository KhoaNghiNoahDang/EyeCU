const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

let changed = false;

// 1. Update Profile tab navigation button
const targetStr1 = `               <button onClick={() => { setActiveTab("home"); setCurrentView("health_record"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">
                  <div className="text-[#0d1f2d]"><ClipboardList className="w-7 h-7" /></div>
                  <span className="text-[12px] text-center px-2 font-medium text-slate-700 leading-tight">Hồ sơ<br/>sức khỏe</span>
               </button>`;
const replacementStr1 = `               <button onClick={() => { setActiveTab("home"); setCurrentView("health_record_list"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">
                  <div className="text-[#0d1f2d]"><ClipboardList className="w-7 h-7" /></div>
                  <span className="text-[12px] text-center px-2 font-medium text-slate-700 leading-tight">Hồ sơ<br/>sức khỏe</span>
               </button>`;
if (content.includes(targetStr1)) {
  content = content.replace(targetStr1, replacementStr1);
  changed = true;
  console.log("Updated profile tab button");
}

// 2. Add healthRecordFilterYear state
const targetStr2 = `  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");`;
const replacementStr2 = `  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");
  const [healthRecordFilterYear, setHealthRecordFilterYear] = useState<string>("all");`;
if (content.includes(targetStr2)) {
  content = content.replace(targetStr2, replacementStr2);
  changed = true;
  console.log("Added healthRecordFilterYear state");
}

// 3. Update renderHealthRecordList
const targetStr3 = `  const renderHealthRecordList = () => (
    <div className="flex-1 flex flex-col bg-[#f8f9fc] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white z-10 shrink-0 shadow-sm pt-safe">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95 mr-2">
          <ArrowLeft className="h-6 w-6 text-[#0d1f2d]" />
        </button>
        <div className="bg-[#0d1f2d] text-[#88E8F2] px-5 py-2 rounded-full font-bold text-[14px]">
          Tất cả
        </div>
        <div className="bg-white text-[#0d1f2d] px-5 py-2 rounded-full font-bold text-[14px] border border-[#0d1f2d]">
          2026
        </div>
        <div className="bg-white text-[#0d1f2d] px-5 py-2 rounded-full font-bold text-[14px] border border-[#0d1f2d]">
          2025
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 space-y-4 pb-24">
        {healthRecordDates.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => {
              setSelectedRecordDate(item.full);
              setCurrentView("health_record");
            }}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-transform text-left"
          >
            <div className="flex flex-col items-center justify-center shrink-0 w-16">
               <span className="text-[32px] font-black text-[#0d1f2d] leading-none">{item.date}</span>
               <span className="text-[13px] font-bold text-[#0d1f2d] mt-1">{item.monthYear}</span>
            </div>
            
            <div className="h-16 w-px bg-slate-200 shrink-0"></div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
               <div className="bg-[#0d1f2d] text-[#88E8F2] px-3 py-1 rounded-full w-fit mb-2">
                  <span className="text-[12px] font-bold uppercase truncate">{user?.name || "Bệnh nhân"}</span>
               </div>
               <p className="text-[14px] text-slate-700 font-medium leading-tight">{item.location}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );`;

const replacementStr3 = `  const filteredDates = healthRecordDates.filter(item => 
    healthRecordFilterYear === "all" || item.full.includes(healthRecordFilterYear)
  );

  const renderHealthRecordList = () => (
    <div className="flex-1 flex flex-col bg-[#f8f9fc] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-white z-10 shrink-0 shadow-sm pt-safe">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95 mr-2">
          <ArrowLeft className="h-6 w-6 text-[#0d1f2d]" />
        </button>
        <button 
          onClick={() => setHealthRecordFilterYear("all")}
          className={\`px-5 py-2 rounded-full font-bold text-[14px] active:scale-95 transition-transform \${healthRecordFilterYear === "all" ? "bg-[#0d1f2d] text-[#88E8F2]" : "bg-white text-[#0d1f2d] border border-[#0d1f2d]"}\`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setHealthRecordFilterYear("2026")}
          className={\`px-5 py-2 rounded-full font-bold text-[14px] active:scale-95 transition-transform \${healthRecordFilterYear === "2026" ? "bg-[#0d1f2d] text-[#88E8F2]" : "bg-white text-[#0d1f2d] border border-[#0d1f2d]"}\`}
        >
          2026
        </button>
        <button 
          onClick={() => setHealthRecordFilterYear("2025")}
          className={\`px-5 py-2 rounded-full font-bold text-[14px] active:scale-95 transition-transform \${healthRecordFilterYear === "2025" ? "bg-[#0d1f2d] text-[#88E8F2]" : "bg-white text-[#0d1f2d] border border-[#0d1f2d]"}\`}
        >
          2025
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide p-4 space-y-4 pb-24">
        {filteredDates.map((item, idx) => (
          <button 
            key={idx}
            onClick={() => {
              setSelectedRecordDate(item.full);
              setCurrentView("health_record");
            }}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4 active:scale-95 transition-transform text-left"
          >
            <div className="flex flex-col items-center justify-center shrink-0 w-16 bg-[#88E8F2] rounded-xl py-2">
               <span className="text-[32px] font-black text-[#0d1f2d] leading-none">{item.date}</span>
               <span className="text-[13px] font-bold text-[#0d1f2d] mt-1">{item.monthYear}</span>
            </div>
            
            <div className="h-16 w-px bg-slate-200 shrink-0"></div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
               <div className="bg-[#0d1f2d] text-[#88E8F2] px-3 py-1 rounded-full w-fit mb-2">
                  <span className="text-[12px] font-bold uppercase truncate">{user?.name || "Bệnh nhân"}</span>
               </div>
               <p className="text-[14px] text-slate-700 font-medium leading-tight">{item.location}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );`;

if (content.includes(targetStr3)) {
  content = content.replace(targetStr3, replacementStr3);
  changed = true;
  console.log("Updated renderHealthRecordList");
} else {
  // If line endings are different, we might fail to match targetStr3. 
  // Let's print out if it didn't match.
  console.log("Failed to match targetStr3 (renderHealthRecordList)");
}

if (changed) {
  fs.writeFileSync(targetFile, content);
  console.log("PatientPortalNew.tsx updated successfully!");
} else {
  console.log("No changes were made.");
}
