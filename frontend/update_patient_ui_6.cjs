const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add Filter state
if (!content.includes('const [healthRecordFilterYear')) {
  content = content.replace(
    '  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");',
    '  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");\n  const [healthRecordFilterYear, setHealthRecordFilterYear] = useState<string>("all");'
  );
}

// 2. Profile tab navigation to health_record_list
content = content.replace(
  'onClick={() => { setActiveTab("home"); setCurrentView("health_record"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50"',
  'onClick={() => { setActiveTab("home"); setCurrentView("health_record_list"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50"'
);

// 3. Update renderHealthRecordList entirely
const listStartIdx = content.indexOf('const renderHealthRecordList = () => (');
const listEndIdx = content.indexOf('  // Render Health Record View');
if (listStartIdx !== -1 && listEndIdx !== -1) {
  const newList = `  const filteredDates = healthRecordDates.filter(item => 
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

`;
  content = content.substring(0, listStartIdx) + newList + content.substring(listEndIdx);
}

// 4. Update back button in renderHealthRecord
content = content.replace(
  '<button onClick={() => setCurrentView("home")} className="p-1 active:scale-95 absolute left-3">',
  '<button onClick={() => setCurrentView("health_record_list")} className="p-1 active:scale-95 absolute left-3">'
);

// 5. Update Profile Card inside renderHealthRecord
const oldProfileCard = `        {/* Profile Card */}
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

const newProfileCard = `        {/* Profile Card */}
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
               <div className="bg-[#88E8F2] text-[#0d1f2d] px-2 py-1 rounded-md text-[11px] font-bold text-center w-full">
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

content = content.replace(oldProfileCard, newProfileCard);

// 6. Pass isEmpty to FileResultsView inside renderHealthRecord
content = content.replace(
  '{ id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} /> },',
  '{ id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} isEmpty={selectedRecordDate !== "1/4/2026"} /> },'
);

// 7. Make sure health_record_list is added to render tree
const renderTreeSearchStr = `{activeTab === "home" ? (
          currentView === "home" ? (`;
const renderTreeReplaceStr = `{activeTab === "home" ? (
          currentView === "health_record_list" ? (
            renderHealthRecordList()
          ) : currentView === "home" ? (`;

if (!content.includes('currentView === "health_record_list" ? (')) {
  content = content.replace(renderTreeSearchStr, renderTreeReplaceStr);
}

fs.writeFileSync(targetFile, content);
console.log("update_patient_ui_6 done!");
