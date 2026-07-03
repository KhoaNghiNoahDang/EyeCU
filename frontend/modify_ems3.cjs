const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// Find the block starting at `manualInputMode === "no_cccd"`
const noCccdIndex = content.indexOf('manualInputMode === "no_cccd"');
if (noCccdIndex === -1) {
  console.log("noCccdIndex not found");
  process.exit(1);
}

// Find the specific button in that block
const buttonSearchStr = '<button\n                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"\n                  onClick={() => {\n                    const fakePatient = { name: manualName, gender: manualGender, age: manualAgeRange, cccd: null, chronic_conditions: [], allergies: [] };\n                    setScannedPatient({ full_name: manualName, gender: manualGender, dob: null, cccd_number: null, chronic_conditions: [], allergies: [] });\n                    sendPatientUpdate(fakePatient);\n                  }}\n                >Xác nhận</button>';
const windowsButtonSearchStr = buttonSearchStr.replace(/\n/g, '\r\n');

let buttonIndex = content.indexOf(buttonSearchStr, noCccdIndex);
let targetStr = buttonSearchStr;
if (buttonIndex === -1) {
    buttonIndex = content.indexOf(windowsButtonSearchStr, noCccdIndex);
    targetStr = windowsButtonSearchStr;
}

if (buttonIndex === -1) {
  console.log("buttonIndex not found");
  process.exit(1);
}

const replacement = `<div>
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
                      name: manualName, 
                      gender: manualGender, 
                      age: manualAgeRange, 
                      cccd: null, 
                      chronic_conditions: c_cond, 
                      allergies: c_allergy,
                      emergencyContactName: e_contact
                    };
                    setScannedPatient({ 
                      full_name: manualName, 
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

const before = content.slice(0, buttonIndex);
const after = content.slice(buttonIndex + targetStr.length);
content = before + replacement + after;

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully replaced the UI block!");

