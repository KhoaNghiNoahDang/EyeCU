const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Update ViewState
content = content.replace(
  'type ViewState = "home" | "health_dashboard" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "question_thread" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";',
  'type ViewState = "home" | "health_record_list" | "health_dashboard" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "question_thread" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";'
);

// 2. Add selectedRecordDate state
content = content.replace(
  '  const [currentView, setCurrentView] = useState<ViewState>("home");',
  '  const [currentView, setCurrentView] = useState<ViewState>("home");\n  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");'
);

// 3. Change renderHome navigation
content = content.replace(
  '{ label: "Hồ sơ sức khỏe", icon: Activity, onClick: () => setCurrentView("health_dashboard") },',
  '{ label: "Hồ sơ sức khỏe", icon: Activity, onClick: () => setCurrentView("health_record_list") },'
);

// 4. Add renderHealthRecordList right before renderHealthRecord
const recordListCode = `
  const healthRecordDates = [
    { date: "01", monthYear: "04/2026", full: "1/4/2026", location: "Bệnh viện Nội Tiết Trung ương" },
    { date: "23", monthYear: "03/2026", full: "23/3/2026", location: "Bệnh viện Bạch Mai" },
    { date: "23", monthYear: "01/2026", full: "23/1/2026", location: "Bệnh viện Trung ương Quân Đội 108" },
    { date: "16", monthYear: "12/2025", full: "16/12/2025", location: "Bệnh viện Hữu Nghị Việt Đức" },
  ];

  const renderHealthRecordList = () => (
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
  );

  // Render Health Record View`;
content = content.replace('  // Render Health Record View', recordListCode);

// 5. Add back navigation to renderHealthRecord List in health_record
content = content.replace(
  '<button onClick={() => setCurrentView("home")} className="p-1 active:scale-95 absolute left-3">',
  '<button onClick={() => setCurrentView("health_record_list")} className="p-1 active:scale-95 absolute left-3">'
);

// 6. Add Dashboard button and Profile Card modification to health_record
const dashboardButton = `
        {/* Profile Card */}
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
               <div className="bg-[#88E8F2]/30 text-[#0d1f2d] px-2 py-1 rounded text-[11px] font-bold text-center border border-[#88E8F2]/50">
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
content = content.replace(
  /        {\/\* Profile Card \*\/}\n        <div className="bg-white px-4 pt-6 pb-4 shadow-sm relative">(.|\n)*?<\/div>\n\n        {\/\* Next Appointment Card \(if any\) \*\/}/m,
  dashboardButton + '\n\n        {/* Next Appointment Card (if any) */}'
);

// 7. Render health_record_list in the render chain safely
const searchRegex = /{\s*activeTab === "home" \? \(\s*currentView === "home" \? \(/;

const replacementStr = `{activeTab === "home" ? (
          currentView === "health_record_list" ? (
            renderHealthRecordList()
          ) : currentView === "home" ? (`;

if (searchRegex.test(content)) {
  content = content.replace(searchRegex, replacementStr);
}

// 8. Add isEmpty prop to FileResultsView usage
content = content.replace(
  '{ id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} /> },',
  '{ id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} isEmpty={selectedRecordDate !== "1/4/2026"} /> },'
);

fs.writeFileSync(targetFile, content);

console.log("PatientPortalNew updated");
