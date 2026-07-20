const fs = require('fs');
const filePath = 'src/components/PatientPortalNew.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// ===== FIX 1: Dashboard back button: health_record -> health_record_list =====
const dashBackOld = `          <button onClick={() => setCurrentView("health_record")} className="p-1 active:scale-95 absolute left-3">`;
const dashBackNew = `          <button onClick={() => setCurrentView("health_record_list")} className="p-1 active:scale-95 absolute left-3">`;

if (content.includes(dashBackOld)) {
  content = content.replace(dashBackOld, dashBackNew);
  console.log('Fix 1 done: Dashboard back button -> health_record_list');
} else {
  // Try with \r\n
  const dashBackOldCRLF = dashBackOld.replace(/\n/g, '\r\n');
  if (content.includes(dashBackOldCRLF)) {
    content = content.replace(dashBackOldCRLF, dashBackNew);
    console.log('Fix 1 done (CRLF): Dashboard back button -> health_record_list');
  } else {
    console.log('Fix 1 SKIP: back button already updated or not found');
  }
}

// ===== FIX 2: Remove dashboard_link from renderHealthRecord accordion =====
// The dashboard_link item line
const dashLinkOld = `                { id: "dashboard_link", icon: Activity, label: "Dashboard tổng quan", isLink: true, Component: null as any },\r\n                { id: "file_results"`;
const dashLinkNew = `                { id: "file_results"`;

if (content.includes(dashLinkOld)) {
  content = content.replace(dashLinkOld, dashLinkNew);
  console.log('Fix 2 done: Removed dashboard_link from health record');
} else {
  // try LF
  const dashLinkOldLF = `                { id: "dashboard_link", icon: Activity, label: "Dashboard tổng quan", isLink: true, Component: null as any },\n                { id: "file_results"`;
  if (content.includes(dashLinkOldLF)) {
    content = content.replace(dashLinkOldLF, `                { id: "file_results"`);
    console.log('Fix 2 done (LF): Removed dashboard_link from health record');
  } else {
    console.log('Fix 2 SKIP: dashboard_link line not found (may already be removed)');
  }
}

// ===== FIX 3: Add patient info card to renderHealthRecordList =====
// Replace the Filter Tabs section to add patient card before it

const filterTabsOld = `        {/* Filter Tabs */}\n        <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 shrink-0">`;
const filterTabsNew = `        {/* Patient Info Card */}
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
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 px-4 py-3 bg-white border-b border-slate-100 shrink-0">`;

if (content.includes(filterTabsOld)) {
  content = content.replace(filterTabsOld, filterTabsNew);
  console.log('Fix 3 done: Patient card added to renderHealthRecordList');
} else {
  console.log('Fix 3 SKIP: filter tabs marker not found, trying CRLF...');
  const filterTabsOldCRLF = filterTabsOld.replace(/\n/g, '\r\n');
  const filterTabsNewCRLF = filterTabsNew.replace(/\n/g, '\r\n');
  if (content.includes(filterTabsOldCRLF)) {
    content = content.replace(filterTabsOldCRLF, filterTabsNewCRLF);
    console.log('Fix 3 done (CRLF): Patient card added');
  } else {
    // Try finding it manually
    const idx = content.indexOf('Filter Tabs');
    console.log('Filter Tabs found at:', idx, 'Context:', JSON.stringify(content.substring(idx-5, idx+120)));
  }
}

fs.writeFileSync(filePath, content);
console.log('\n=== ALL FIXES DONE ===');
