const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// ─── CHANGE 1: After CCCD scan success, also send PATIENT_UPDATE via WS ───────
// Find the line: setScannedPatient(dbRes.data);
// We need to add a sendPatientUpdate call after it, but the 'send' function isn't available yet
// We'll do it differently: add a useEffect that watches scannedPatient + plateConfirmed
// and sends PATIENT_UPDATE when both are set.

// ─── Actually, the cleanest approach: add a helper function sendPatientUpdate 
//     right after the { send } = useEyeCUSocket line, and call it in the right places.

// CHANGE 1: After processEkycBase64 sets scannedPatient, we'll trigger via useEffect
// We'll add a useEffect watching [scannedPatient, plateConfirmed] to send PATIENT_UPDATE

// First, let's find the insertion point: after "const { send } = useEyeCUSocket..."
const wsHookLine = `  const { send } = useEyeCUSocket({ url: WS_URL, onMessage: handleSocketMessage });`;
if (!content.includes(wsHookLine)) {
  console.log('WS hook line not found'); process.exit(1);
}

const patientUpdateEffect = `  const { send } = useEyeCUSocket({ url: WS_URL, onMessage: handleSocketMessage });

  // Khi scannedPatient được cập nhật và xe đã có biển số → gửi PATIENT_UPDATE lên dispatch
  const sendPatientUpdate = useCallback((patient: any, alertLabel?: string) => {
    const activePlate = plate.trim() || localStorage.getItem("ems_plate") || "";
    if (!activePlate || !patient) return;
    const age = patient.dob
      ? String(new Date().getFullYear() - new Date(patient.dob).getFullYear())
      : patient.age ?? null;
    send({
      type: "PATIENT_UPDATE",
      data: {
        plate: activePlate,
        name: patient.full_name || patient.name || null,
        gender: patient.gender || null,
        age,
        cccd: patient.cccd_number || patient.cccd || null,
        chronic_conditions: patient.chronic_conditions || patient.chronicConditions || [],
        allergies: patient.allergies || [],
        alert_label: alertLabel || selectedAlert || null,
      },
    });
  }, [plate, send, selectedAlert]);`;

content = content.replace(wsHookLine, patientUpdateEffect);

// ─── CHANGE 2: After setScannedPatient(dbRes.data) → call sendPatientUpdate ────
// Find the EKYC success block
const ekycSuccess = `            setScannedPatient(dbRes.data);`;
const ekycSuccessNew = `            setScannedPatient(dbRes.data);
            sendPatientUpdate(dbRes.data);`;

// Only replace the first occurrence (in processEkycBase64)
const idx = content.indexOf(ekycSuccess);
if (idx !== -1) {
  content = content.slice(0, idx) + ekycSuccessNew + content.slice(idx + ekycSuccess.length);
  console.log('CHANGE 2: CCCD success sendPatientUpdate inserted');
} else {
  console.log('CHANGE 2: CCCD success line not found');
}

// ─── CHANGE 3: Manual "unknown" confirm button → send PATIENT_UPDATE ─────────
// Find: <button className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2">Xác nhận</button>
// There are 2 of these (unknown and no_cccd). We need to distinguish them.

// For "unknown" mode: replace first Xác nhận button
const unknownConfirm = `                <button className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2">Xác nhận</button>`;
const unknownConfirmNew = `                <button
                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"
                  onClick={() => {
                    const fakePatient = { name: "Không rõ", gender: manualGender, age: manualAgeRange, cccd: null, chronic_conditions: [], allergies: [] };
                    setScannedPatient({ full_name: "Không rõ danh tính", gender: manualGender, dob: null, cccd_number: null, chronic_conditions: [], allergies: [] });
                    sendPatientUpdate(fakePatient);
                  }}
                >Xác nhận</button>`;

const idx3 = content.indexOf(unknownConfirm);
if (idx3 !== -1) {
  content = content.slice(0, idx3) + unknownConfirmNew + content.slice(idx3 + unknownConfirm.length);
  console.log('CHANGE 3: unknown confirm button updated');
} else {
  console.log('CHANGE 3: unknown confirm button not found');
}

// ─── CHANGE 4: "no_cccd" confirm button → send PATIENT_UPDATE ────────────────
// Second occurrence of the same pattern
const noCccdConfirm = `                <button className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2">Xác nhận</button>`;
const noCccdConfirmNew = `                <button
                  className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2"
                  onClick={() => {
                    const fakePatient = { name: manualName, gender: manualGender, age: manualAgeRange, cccd: null, chronic_conditions: [], allergies: [] };
                    setScannedPatient({ full_name: manualName, gender: manualGender, dob: null, cccd_number: null, chronic_conditions: [], allergies: [] });
                    sendPatientUpdate(fakePatient);
                  }}
                >Xác nhận</button>`;

const idx4 = content.indexOf(noCccdConfirm);
if (idx4 !== -1) {
  content = content.slice(0, idx4) + noCccdConfirmNew + content.slice(idx4 + noCccdConfirm.length);
  console.log('CHANGE 4: no_cccd confirm button updated');
} else {
  console.log('CHANGE 4: no_cccd confirm button not found');
}

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log('All EmsView changes done!');
