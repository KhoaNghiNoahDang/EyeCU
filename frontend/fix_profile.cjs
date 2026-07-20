const fs = require('fs');
const path = require('path');

const patientPortalPath = path.join(__dirname, 'src/components/PatientPortalNew.tsx');
let ppContent = fs.readFileSync(patientPortalPath, 'utf8');

const profileCardMarker = '        {/* Profile Card */}';
const nextAppointmentMarker = '        {/* Next Appointment Card (if any) */}';

const startIndex = ppContent.indexOf(profileCardMarker);
const endIndex = ppContent.indexOf(nextAppointmentMarker);

if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
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
        </div>

`;
  
  // Notice the extra empty line to preserve formatting before the Next Appointment Card
  ppContent = ppContent.substring(0, startIndex) + newProfileCardStr + ppContent.substring(endIndex);
  fs.writeFileSync(patientPortalPath, ppContent);
  console.log("Successfully replaced Profile Card and added Dashboard Button!");
} else {
  console.log("Error: markers not found or in wrong order");
}
