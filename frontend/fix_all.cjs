const fs = require('fs');
const path = require('path');

const patientPortalPath = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let ppContent = fs.readFileSync(patientPortalPath, 'utf8');

// 1. Inject renderHealthRecordList before renderHealthRecord
const renderHealthRecordListStr = `  const healthRecordDates = [
    { date: "01", monthYear: "04/2026", full: "1/4/2026", location: "Bệnh viện Nội Tiết Trung ương" },
    { date: "23", monthYear: "03/2026", full: "23/3/2026", location: "Bệnh viện Bạch Mai" },
    { date: "23", monthYear: "01/2026", full: "23/1/2026", location: "Bệnh viện Trung ương Quân Đội 108" },
    { date: "16", monthYear: "12/2025", full: "16/12/2025", location: "Bệnh viện Hữu Nghị Việt Đức" },
  ];

  const filteredDates = healthRecordDates.filter(item => 
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
          className={\`px-5 py-2 rounded-full font-bold text-[14px] active:scale-95 transition-transform \${healthRecordFilterYear === "all" ? "bg-[#88E8F2] text-[#0d1f2d]" : "bg-white text-[#0d1f2d] border border-[#0d1f2d]"}\`}
        >
          Tất cả
        </button>
        <button 
          onClick={() => setHealthRecordFilterYear("2026")}
          className={\`px-5 py-2 rounded-full font-bold text-[14px] active:scale-95 transition-transform \${healthRecordFilterYear === "2026" ? "bg-[#88E8F2] text-[#0d1f2d]" : "bg-white text-[#0d1f2d] border border-[#0d1f2d]"}\`}
        >
          2026
        </button>
        <button 
          onClick={() => setHealthRecordFilterYear("2025")}
          className={\`px-5 py-2 rounded-full font-bold text-[14px] active:scale-95 transition-transform \${healthRecordFilterYear === "2025" ? "bg-[#88E8F2] text-[#0d1f2d]" : "bg-white text-[#0d1f2d] border border-[#0d1f2d]"}\`}
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
            <div className="flex flex-col items-center justify-center shrink-0 w-16 py-2">
               <span className="text-[32px] font-black text-[#0d1f2d] leading-none">{item.date}</span>
               <span className="text-[13px] font-bold text-[#0d1f2d] mt-1">{item.monthYear}</span>
            </div>
            
            <div className="h-16 w-px bg-slate-200 shrink-0"></div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
               <div className="bg-[#88E8F2] text-[#0d1f2d] px-3 py-1 rounded-full w-fit mb-2">
                  <span className="text-[12px] font-bold uppercase truncate">{user?.name || "Bệnh nhân"}</span>
               </div>
               <p className="text-[14px] text-slate-700 font-medium leading-tight">{item.location}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  // Render Health Record View`;

if (!ppContent.includes('const renderHealthRecordList = () => (')) {
  ppContent = ppContent.replace('  // Render Health Record View', renderHealthRecordListStr);
}

// 2. Fix the back button in renderHealthRecord
const targetStr = '<button onClick={() => setCurrentView("home")} className="p-1 active:scale-95 absolute left-3">';
const replaceStr = '<button onClick={() => setCurrentView("health_record_list")} className="p-1 active:scale-95 absolute left-3">';
const healthRecordStart = ppContent.indexOf('  // Render Health Record View');
if (healthRecordStart !== -1) {
  const searchIdx = ppContent.indexOf(targetStr, healthRecordStart);
  if (searchIdx !== -1) {
    ppContent = ppContent.substring(0, searchIdx) + replaceStr + ppContent.substring(searchIdx + targetStr.length);
  }
}

// 3. Fix the Profile Card AND add Dashboard Button
// We will replace using string split / join to avoid regex problems.
const oldProfileCardStr = `        {/* Profile Card */}
        <div className="bg-white px-4 pt-6 pb-4 shadow-sm relative">
           <div className="flex items-start gap-3">
             <div className="h-16 w-16 shrink-0 rounded-full border border-slate-100 bg-white p-1 shadow-sm overflow-hidden">
                <img src={user?.avatar || DEFAULT_AVATAR} alt="EyeCU" className="h-full w-full object-cover rounded-full" />
             </div>
             <div className="flex-1 min-w-0">
               <h2 className="text-[16px] font-bold text-[#0d1f2d] uppercase mb-1">{user?.name || "Bệnh nhân"}</h2>
               <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 mb-2">Ngoại trú</span>
               <div className="flex flex-col gap-1 text-[13px] text-slate-500">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {user?.dob || "01/01/1990"}</div>
                  <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {user?.gender || "Nam"}</div>
                  <div className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {user?.cccd || "0123456789"}</div>
               </div>
             </div>
             <button className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <QrCode className="h-5 w-5 text-[#0d1f2d]" />
             </button>
           </div>
        </div>`;

const newProfileCardStr = `        {/* Profile Card */}
        <div className="bg-white px-4 pt-6 pb-4 shadow-sm relative">
           <div className="flex items-start gap-3">
             <div className="h-16 w-16 shrink-0 rounded-full border border-slate-100 bg-white p-1 shadow-sm overflow-hidden">
                <img src={user?.avatar || DEFAULT_AVATAR} alt="EyeCU" className="h-full w-full object-cover rounded-full" />
             </div>
             <div className="flex-1 min-w-0">
               <h2 className="text-[16px] font-bold text-[#0d1f2d] uppercase mb-1">{user?.name || "Bệnh nhân"}</h2>
               <div className="flex flex-col gap-1 text-[13px] text-slate-500">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {user?.dob || "01/01/1990"}</div>
                  <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> {user?.gender || "Nam"}</div>
                  <div className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5" /> {user?.cccd || "0123456789"}</div>
               </div>
             </div>
             <div className="flex flex-col items-center gap-2">
               <button className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  <QrCode className="h-5 w-5 text-[#0d1f2d]" />
               </button>
               <div className="bg-[#88E8F2] text-[#0d1f2d] px-2 py-1 rounded text-[11px] font-bold text-center border border-[#88E8F2]/50">
                 {selectedRecordDate}
               </div>
             </div>
           </div>
        </div>

        {/* Dashboard Button */}
        <div className="px-4 mt-4">
          <button 
            onClick={() => setCurrentView("health_dashboard")}
            className="w-full flex items-center justify-between gap-2 rounded-xl bg-[#88E8F2] text-[#0d1f2d] p-4 shadow-sm active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[15px] font-semibold">Dashboard tổng quan</span>
            </div>
            <ChevronRight className="h-5 w-5 text-[#0d1f2d]" />
          </button>
        </div>`;

if (ppContent.includes(oldProfileCardStr)) {
  ppContent = ppContent.replace(oldProfileCardStr, newProfileCardStr);
} else {
  console.log("Could not find the exact old profile card block.");
}

// 4. Fix FileResultsView invocation
ppContent = ppContent.replace(
  '{ id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} /> },',
  '{ id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} isEmpty={selectedRecordDate !== "1/4/2026"} /> },'
);

// 5. Fix renderTree
const searchRegex = /{\s*activeTab === "home" \? \(\s*currentView === "home" \? \(/;
const replacementStr = `{activeTab === "home" ? (
          currentView === "health_record_list" ? (
            renderHealthRecordList()
          ) : currentView === "home" ? (`;

if (searchRegex.test(ppContent) && !ppContent.includes('currentView === "health_record_list" ?')) {
  ppContent = ppContent.replace(searchRegex, replacementStr);
}

// 6. Fix renderProfileTab routing
const profileRouteStr = '<button onClick={() => { setActiveTab("home"); setCurrentView("health_record"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">';
const profileRouteNewStr = '<button onClick={() => { setActiveTab("home"); setCurrentView("health_record_list"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">';
if (ppContent.includes(profileRouteStr)) {
  ppContent = ppContent.replace(profileRouteStr, profileRouteNewStr);
} else {
  console.log("Could not find the exact profile route button string.");
}

fs.writeFileSync(patientPortalPath, ppContent);
console.log("Fixed PatientPortalNew.tsx");
