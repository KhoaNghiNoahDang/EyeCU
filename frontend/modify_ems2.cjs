const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

const regex = /<label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoảng tuổi<\/label>\s*<input type="text" value=\{manualAgeRange\} onChange=\{e => setManualAgeRange\(e\.target\.value\)\} placeholder="VD: 20-30, 40-50" className="w-full px-3 py-2 rounded-lg border border-slate-300" \/>\s*<\/div>\s*<button\s*className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"\s*onClick=\{[^}]*\}\s*>Xác nhận<\/button>/g;

const replacement = `<label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoảng tuổi</label>
                  <input type="text" value={manualAgeRange} onChange={e => setManualAgeRange(e.target.value)} placeholder="VD: 20-30, 40-50" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Liên hệ khẩn cấp</label>
                  <input type="text" value={manualEmergencyContact} onChange={e => setManualEmergencyContact(e.target.value)} placeholder="Tên & SĐT người thân" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bệnh nền</label>
                  <input type="text" value={manualChronic} onChange={e => setManualChronic(e.target.value)} placeholder="VD: Cao huyết áp..." className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Dị ứng thuốc</label>
                  <input type="text" value={manualAllergies} onChange={e => setManualAllergies(e.target.value)} placeholder="VD: Kháng sinh..." className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <button
                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"
                  onClick={() => {
                    const c_cond = manualChronic.trim() ? manualChronic.split(',').map(s=>s.trim()) : ["Không"];
                    const c_allergy = manualAllergies.trim() ? manualAllergies.split(',').map(s=>s.trim()) : ["Không"];
                    const e_contact = manualEmergencyContact.trim() || "Không";
                    const fakePatient = { 
                      name: typeof manualName !== 'undefined' ? manualName : "Không rõ", 
                      gender: manualGender, 
                      age: manualAgeRange, 
                      cccd: null, 
                      chronic_conditions: c_cond, 
                      allergies: c_allergy,
                      emergencyContactName: e_contact
                    };
                    setScannedPatient({ 
                      full_name: typeof manualName !== 'undefined' ? manualName : "Không rõ danh tính", 
                      gender: manualGender, 
                      dob: null, 
                      cccd_number: null, 
                      chronic_conditions: c_cond, 
                      allergies: c_allergy,
                      emergencyContactName: e_contact
                    });
                    sendPatientUpdate(fakePatient);
                  }}
                >Xác nhận</button>`;

if (regex.test(content)) {
  console.log("Found matches! Replacing...");
  content = content.replace(regex, replacement);
  fs.writeFileSync(path, content, 'utf8');
} else {
  console.log("Could not match the target content.");
}
