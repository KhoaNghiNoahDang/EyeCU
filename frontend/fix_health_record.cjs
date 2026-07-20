const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// ===== FIX 1: Add health_record_list to ViewState =====
content = content.replace(
  'type ViewState = "home" | "health_dashboard" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "question_thread" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";',
  'type ViewState = "home" | "health_record_list" | "health_dashboard" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "question_thread" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";'
);
console.log('Fix 1 done: ViewState');

// ===== FIX 2: Add states after showFiles =====
if (!content.includes('healthRecordFilterYear')) {
  content = content.replace(
    /const \[showFiles, setShowFiles\] = useState\(false\);/,
    `const [showFiles, setShowFiles] = useState(false);
  const [healthRecordFilterYear, setHealthRecordFilterYear] = useState<string>("all");
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>("1/4/2026");`
  );
  console.log('Fix 2 done: added states');
} else {
  console.log('Fix 2 skip: states already exist');
}

// ===== FIX 3: Fix home page button to go to health_record_list =====
content = content.replace(
  '{ label: "Hồ sơ sức khỏe", icon: Activity, onClick: () => setCurrentView("health_dashboard") }',
  '{ label: "Hồ sơ sức khỏe", icon: Activity, onClick: () => setCurrentView("health_record_list") }'
);
console.log('Fix 3 done: home button');

// ===== FIX 4: Fix profile tab health_record button to go to health_record_list =====
content = content.replace(
  `onClick={() => { setActiveTab("home"); setCurrentView("health_record"); }}`,
  `onClick={() => { setActiveTab("home"); setCurrentView("health_record_list"); }}`
);
console.log('Fix 4 done: profile tab button');

// ===== FIX 5: Back button in renderHealthRecord should go to health_record_list =====
// Find the renderHealthRecord back button - it goes to "home", change to "health_record_list"
const healthRecordBackOld = `const renderHealthRecord = () => (
    <div className="flex-1 flex flex-col bg-[#88E8F2] overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm relative">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95 absolute left-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 text-center font-bold text-[18px]">
          Hồ sơ sức khoẻ
        </div>
      </div>`;

const healthRecordBackNew = `const renderHealthRecord = () => (
    <div className="flex-1 flex flex-col bg-[#88E8F2] overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm relative">
        <button onClick={() => setCurrentView("health_record_list")} className="p-1 active:scale-95 absolute left-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 text-center font-bold text-[18px]">
          Hồ sơ sức khoẻ — {selectedRecordDate}
        </div>
      </div>`;

if (content.includes('const renderHealthRecord = () => (')) {
  content = content.replace(healthRecordBackOld, healthRecordBackNew);
  console.log('Fix 5 done: health record back button and title');
} else {
  console.log('Fix 5 FAILED: could not find health record render function');
}

// ===== FIX 6: Add Dashboard button at the top of the accordion list =====
const accordionListOld = `        {/* Services List as Accordion */}
        <div className="bg-slate-50 mt-4 pt-2 flex-1 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] min-h-screen relative">
              {[
                { id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} /> },`;

const accordionListNew = `        {/* Services List as Accordion */}
        <div className="bg-slate-50 mt-4 pt-2 flex-1 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] min-h-screen relative">
              {[
                { id: "dashboard_link", icon: Activity, label: "Dashboard tổng quan", isLink: true, Component: null as any },
                { id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} isEmpty={selectedRecordDate !== "1/4/2026"} /> },`;

content = content.replace(accordionListOld, accordionListNew);
console.log('Fix 6 done: added dashboard button to accordion');

// ===== FIX 7: Update isSpecial check and onClick to handle link items =====
const accordionSpecialOld = `                 const isExpanded = expandedSection === item.id;
                 const isSpecial = item.id === "file_results";
                 // Always pass ONLY extractedRecordData to the components (except file_results) so they are completely empty before extraction
                 const mergedData = isSpecial ? clinicalBundle : (extractedRecordData ? { extractedRecordData } : {});
                 return (
                   <div key={i} className={\`border-b border-slate-200/60 last:border-0 \${isSpecial ? "mx-4 mt-2 mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200" : "bg-white"}\`}>
                     <button 
                        onClick={() => setExpandedSection(isExpanded ? null : item.id)} 
                        className={\`flex w-full items-center justify-between px-4 py-4 text-left transition-colors duration-200 \${
                           isSpecial
                             ? "bg-[#88E8F2] text-[#0d1f2d]"
                             : isExpanded 
                               ? "bg-[#88E8F2]" 
                               : "bg-white active:bg-slate-50"
                        }\`}
                     >`;

const accordionSpecialNew = `                 const isExpanded = expandedSection === item.id;
                 const isSpecial = item.id === "file_results" || item.id === "dashboard_link";
                 const isLink = (item as any).isLink;
                 // Always pass ONLY extractedRecordData to the components (except file_results) so they are completely empty before extraction
                 const mergedData = isSpecial ? clinicalBundle : (extractedRecordData ? { extractedRecordData } : {});
                 return (
                   <div key={i} className={\`border-b border-slate-200/60 last:border-0 \${isSpecial ? "mx-4 mt-2 mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200" : "bg-white"}\`}>
                     <button 
                        onClick={() => isLink ? setCurrentView("health_dashboard") : setExpandedSection(isExpanded ? null : item.id)} 
                        className={\`flex w-full items-center justify-between px-4 py-4 text-left transition-colors duration-200 \${
                           isSpecial
                             ? "bg-[#88E8F2] text-[#0d1f2d]"
                             : isExpanded 
                               ? "bg-[#88E8F2]" 
                               : "bg-white active:bg-slate-50"
                        }\`}
                     >`;

content = content.replace(accordionSpecialOld, accordionSpecialNew);
console.log('Fix 7 done: accordion onclick handling');

// ===== FIX 8: Update accordion content render to skip links =====
const accordionContentOld = `                     {/* Accordion Content */}
                     {isExpanded && (
                       <div className={\`animate-in slide-in-from-top-2 duration-200 \${isSpecial ? "bg-white p-2" : "border-t border-[#88E8F2]/30"}\`}>
                          <item.Component data={mergedData} user={user} onBack={() => setExpandedSection(null)} />
                       </div>
                     )}`;

const accordionContentNew = `                     {/* Accordion Content */}
                     {isExpanded && !isLink && item.Component && (
                       <div className={\`animate-in slide-in-from-top-2 duration-200 \${isSpecial ? "bg-white p-2" : "border-t border-[#88E8F2]/30"}\`}>
                          <item.Component data={mergedData} user={user} onBack={() => setExpandedSection(null)} />
                       </div>
                     )}`;

content = content.replace(accordionContentOld, accordionContentNew);
console.log('Fix 8 done: accordion content render');

// ===== FIX 9: Add routing for health_record_list in the view switcher =====
content = content.replace(
  ') : currentView === "health_dashboard" ? (\n            renderHealthDashboard()\n          ) : currentView === "health_record" ? (\n            renderHealthRecord()',
  ') : currentView === "health_record_list" ? (\n            renderHealthRecordList()\n          ) : currentView === "health_dashboard" ? (\n            renderHealthDashboard()\n          ) : currentView === "health_record" ? (\n            renderHealthRecord()'
);
console.log('Fix 9 done: added health_record_list route in switcher');

// ===== FIX 10: Add the renderHealthRecordList function =====
const APPOINTMENT_DATA = `
  const HEALTH_RECORD_APPOINTMENTS = [
    { date: "1/4/2026", displayDate: "01/04/2026", hospital: "Bệnh viện Nội Tiết Trung ương", year: 2026 },
    { date: "23/3/2026", displayDate: "23/03/2026", hospital: "Bệnh viện Bạch Mai", year: 2026 },
    { date: "23/1/2026", displayDate: "23/01/2026", hospital: "Bệnh viện Trung ương Quân Đội 108", year: 2026 },
    { date: "16/12/2025", displayDate: "16/12/2025", hospital: "Bệnh viện Hữu Nghị Việt Đức", year: 2025 },
  ];

  const renderHealthRecordList = () => {
    const filtered = healthRecordFilterYear === "all"
      ? HEALTH_RECORD_APPOINTMENTS
      : HEALTH_RECORD_APPOINTMENTS.filter(a => a.year === parseInt(healthRecordFilterYear));

    return (
      <div className="flex-1 flex flex-col bg-[#f8f9fc] overflow-hidden">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm relative">
          <button onClick={() => { setActiveTab("home"); setCurrentView("home"); }} className="p-1 active:scale-95 absolute left-3">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex-1 text-center font-bold text-[18px]">Hồ sơ sức khoẻ</div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 shrink-0">
          {["all", "2026", "2025"].map(yr => (
            <button
              key={yr}
              onClick={() => setHealthRecordFilterYear(yr)}
              className={\`px-4 py-1.5 rounded-full text-[13px] font-semibold transition-all \${
                healthRecordFilterYear === yr
                  ? "bg-[#88E8F2] text-[#0d1f2d]"
                  : "bg-slate-100 text-slate-500"
              }\`}
            >
              {yr === "all" ? "Tất cả" : yr}
            </button>
          ))}
        </div>

        {/* Appointments List */}
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
        </div>
      </div>
    );
  };
`;

// Insert before renderHealthDashboard
content = content.replace(
  '  const renderHealthDashboard = () => {',
  APPOINTMENT_DATA + '\n  const renderHealthDashboard = () => {'
);
console.log('Fix 10 done: added renderHealthRecordList function');

fs.writeFileSync(filePath, content);
console.log('\n=== ALL FIXES DONE ===');
