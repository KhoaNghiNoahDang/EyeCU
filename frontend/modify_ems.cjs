const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add states
const stateInsertPoint = `  const [manualName, setManualName] = useState("");`;
const stateReplacement = `  const [manualName, setManualName] = useState("");
  const [manualEmergencyContact, setManualEmergencyContact] = useState("");
  const [manualChronic, setManualChronic] = useState("");
  const [manualAllergies, setManualAllergies] = useState("");`;
content = content.replace(stateInsertPoint, stateReplacement);

// 2. Add Reset logic on GPS Stop
const gpsStopTarget = `      setIsBroadcasting(false);
      setIsMissionStarted(false);
      realStartRef.current = null; // Reset`;
const gpsStopReplacement = `      setIsBroadcasting(false);
      setIsMissionStarted(false);
      realStartRef.current = null; // Reset
      setPlate("");
      setPlateInput("");
      setPlateConfirmed(null);
      setScannedPatient(null);
      setManualName("");
      setManualGender("");
      setManualAgeRange("");
      setManualEmergencyContact("");
      setManualChronic("");
      setManualAllergies("");
      setPreAlertText("");
      setCapturedCccdUrl(null);
      setAlertSent(false);
      setSelectedAlert(null);`;
content = content.replace(gpsStopTarget, gpsStopReplacement);

// 3. Update the no_cccd form
const formTarget = `                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoảng tuổi</label>
                  <input type="text" value={manualAgeRange} onChange={e => setManualAgeRange(e.target.value)} placeholder="VD: 20-30, 40-50" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <button
                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"
                  onClick={() => {
                    const fakePatient = { name: manualName, gender: manualGender, age: manualAgeRange, cccd: null, chronic_conditions: [], allergies: [] };
                    setScannedPatient({ full_name: manualName, gender: manualGender, dob: null, cccd_number: null, chronic_conditions: [], allergies: [] });
                    sendPatientUpdate(fakePatient);
                  }}
                >Xác nhận</button>`;

const formReplacement = `                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoảng tuổi</label>
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
content = content.replace(formTarget, formReplacement);

fs.writeFileSync(path, content, 'utf8');
console.log("Done updating EmsView");
