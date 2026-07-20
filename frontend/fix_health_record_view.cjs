const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Hospital names map
const hospitalMap = {
  "1/4/2026":   "Bệnh viện Nội Tiết Trung ương",
  "23/3/2026":  "Bệnh viện Bạch Mai",
  "23/1/2026":  "Bệnh viện Trung ương Quân Đội 108",
  "16/12/2025": "Bệnh viện Hữu Nghị Việt Đức",
};

// New renderHealthRecord function
const newRenderHealthRecord = `  // Render Health Record View
  const renderHealthRecord = () => {
    const HOSPITAL_MAP: Record<string, string> = {
      "1/4/2026":   "Bệnh viện Nội Tiết Trung ương",
      "23/3/2026":  "Bệnh viện Bạch Mai",
      "23/1/2026":  "Bệnh viện Trung ương Quân Đội 108",
      "16/12/2025": "Bệnh viện Hữu Nghị Việt Đức",
    };
    const hospital = HOSPITAL_MAP[selectedRecordDate] || "Cơ sở Y tế";
    const isEmpty = selectedRecordDate !== "1/4/2026";

    return (
    <div className="flex-1 flex flex-col bg-[#f8f9fc] overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm relative">
        <button onClick={() => setCurrentView("health_record_list")} className="p-1 active:scale-95 absolute left-3">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 text-center">
          <div className="font-bold text-[16px] leading-tight">Hồ sơ sức khoẻ</div>
          <div className="text-[12px] font-medium opacity-80">{selectedRecordDate}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide pb-24">
        {/* Profile Card */}
        <div className="bg-white px-4 pt-5 pb-4 shadow-sm relative">
           <div className="flex items-start gap-3">
             <div className="h-14 w-14 shrink-0 rounded-full border border-slate-100 bg-white p-1 shadow-sm overflow-hidden">
                <img src={user?.avatar || DEFAULT_AVATAR} alt="EyeCU" className="h-full w-full object-cover rounded-full" />
             </div>
             <div className="flex-1 min-w-0">
               <h2 className="text-[15px] font-bold text-[#0d1f2d] uppercase mb-0.5">{user?.name || "Bệnh nhân"}</h2>
               <div className="flex flex-wrap gap-1 mb-2">
                 <span className="inline-block rounded bg-[#88E8F2]/30 px-2 py-0.5 text-[11px] font-semibold text-[#0d1f2d]">Ngoại trú</span>
                 <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">{selectedRecordDate}</span>
               </div>
               <div className="flex flex-col gap-1 text-[12px] text-slate-500">
                  <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {user?.dob || "01/01/1990"}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {hospital}</div>
               </div>
             </div>
             <button className="h-9 w-9 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                <QrCode className="h-4 w-4 text-[#0d1f2d]" />
             </button>
           </div>
        </div>

        {/* Services List as Accordion */}
        <div className="bg-slate-50 mt-3 pt-2 flex-1 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] min-h-screen relative">
              {[
                { id: "dashboard_link", icon: Activity, label: "Dashboard tổng quan", isLink: true, Component: null as any },
                { id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: (props: any) => <FileResultsView {...props} onExtract={handleExtractData} isExtracting={isExtracting} isEmpty={isEmpty} /> },
                { id: "record_summary", icon: Stethoscope, label: "Kết quả khám", Component: RecordSummaryView },
                { id: "vital_signs", icon: Heart, label: "Sinh hiệu", Component: VitalSignsView },
                { id: "lab_results", icon: Activity, label: "Kết quả xét nghiệm", Component: LabResultsView },
                { id: "imaging_results", icon: FileText, label: "Kết quả CĐHA và thăm dò chức năng", Component: ImagingResultsView },
                { id: "medications", icon: Receipt, label: "Thuốc", Component: MedicationsView },
                { id: "admin_info", icon: FileText, label: "Thông tin hành chính", Component: AdminInfoView },
              ].map((item, i) => {
                 const isExpanded = expandedSection === item.id;
                 const isSpecial = item.id === "file_results" || item.id === "dashboard_link";
                 const isLink = (item as any).isLink;
                 const mergedData = item.id === "file_results" ? clinicalBundle : (extractedRecordData ? { extractedRecordData } : {});
                 return (
                   <div key={i} className={\`border-b border-slate-200/60 last:border-0 \${isSpecial ? "mx-4 mt-2 mb-2 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200" : "bg-white"}\`}>
                     <button
                        onClick={() => isLink ? setCurrentView("health_dashboard") : setExpandedSection(isExpanded ? null : item.id)}
                        className={\`flex w-full items-center justify-between px-4 py-4 text-left transition-colors duration-200 \${
                           isSpecial
                             ? "bg-[#88E8F2] text-[#0d1f2d]"
                             : isExpanded
                               ? "bg-[#88E8F2]"
                               : "bg-white active:bg-slate-50"
                        }\`}
                     >
                        <div className="flex items-center gap-3">
                           <item.icon className="h-5 w-5 text-[#0d1f2d]" strokeWidth={1.5} />
                           <span className="text-[15px] font-semibold text-[#0d1f2d]">{item.label}</span>
                        </div>
                        <ChevronRight className={\`h-5 w-5 transition-transform duration-200 \${isExpanded && !isLink ? "rotate-90" : ""} \${isSpecial ? "text-[#0d1f2d]" : "text-slate-400"}\`} />
                     </button>

                     {/* Accordion Content */}
                     {isExpanded && !isLink && item.Component && (
                       <div className={\`animate-in slide-in-from-top-2 duration-200 \${isSpecial ? "bg-white p-2" : "border-t border-[#88E8F2]/30"}\`}>
                          <item.Component data={mergedData} user={user} onBack={() => setExpandedSection(null)} />
                       </div>
                     )}
                   </div>
                 );
              })}
           </div>
      </div>
    </div>
    );
  };

`;

// Find and replace the old renderHealthRecord
const startMarker = '  // Render Health Record View\n  const renderHealthRecord = () => (';
const endMarker = '  // Render Community QA';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1) {
  console.log('FAILED: could not find start of renderHealthRecord');
  process.exit(1);
}
if (endIdx === -1) {
  console.log('FAILED: could not find end marker');
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);
content = before + newRenderHealthRecord + after;

fs.writeFileSync(filePath, content);
console.log('SUCCESS: renderHealthRecord replaced');
