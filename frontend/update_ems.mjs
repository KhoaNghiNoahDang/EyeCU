import fs from 'fs';
import path from 'path';

const filePath = 'd:\\HACKAITHON\\EyeCU\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add state variables
const stateVars = `
  const [manualInputMode, setManualInputMode] = useState<"cccd" | "unknown" | "no_cccd">("cccd");
  const [manualGender, setManualGender] = useState("");
  const [manualAgeRange, setManualAgeRange] = useState("");
  const [manualName, setManualName] = useState("");
`;

content = content.replace(
  /(const \[hospitalAck, setHospitalAck\] = useState\(false\);)/,
  `$1\n${stateVars}`
);

// 2. Extract Panel 1
const panel1Regex = /(    \{\/\* ── 1\. Patient Identification Panel ── \*\/[\s\S]*?)(    \{\/\* ── 2\. GPS Map Panel ── \*\/)/;
const match = content.match(panel1Regex);
if (!match) {
  console.error("Could not find Panel 1");
  process.exit(1);
}

let panel1Code = match[1];
const restOfFileMarker = match[2];

// Remove Panel 1 from its original position
content = content.replace(panel1Code, '');

// Modify Panel 1
const cccdCaptureRegex = /(<CccdCapture[\s\S]*?\/>)/;
const cccdCaptureMatch = panel1Code.match(cccdCaptureRegex);

if (cccdCaptureMatch) {
  const cccdCaptureOriginal = cccdCaptureMatch[1];
  
  const newUi = `
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setManualInputMode("cccd")}
                className={\`flex-1 py-2 rounded-lg text-sm font-bold border transition \${manualInputMode === "cccd" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}\`}
              >Quét CCCD</button>
              <button 
                onClick={() => setManualInputMode("unknown")}
                className={\`flex-1 py-2 rounded-lg text-sm font-bold border transition \${manualInputMode === "unknown" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}\`}
              >Không rõ danh tính</button>
              <button 
                onClick={() => setManualInputMode("no_cccd")}
                className={\`flex-1 py-2 rounded-lg text-sm font-bold border transition \${manualInputMode === "no_cccd" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}\`}
              >Không có CCCD</button>
            </div>

            {manualInputMode === "cccd" && (
              <>
                ${cccdCaptureOriginal}
              </>
            )}

            {manualInputMode === "unknown" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giới tính</label>
                  <select value={manualGender} onChange={e => setManualGender(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300">
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoảng tuổi</label>
                  <input type="text" value={manualAgeRange} onChange={e => setManualAgeRange(e.target.value)} placeholder="VD: 20-30, 40-50" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <button className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2">Xác nhận</button>
              </div>
            )}

            {manualInputMode === "no_cccd" && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Họ và tên</label>
                  <input type="text" value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Nhập họ và tên" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Giới tính</label>
                  <select value={manualGender} onChange={e => setManualGender(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-300">
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Khoảng tuổi</label>
                  <input type="text" value={manualAgeRange} onChange={e => setManualAgeRange(e.target.value)} placeholder="VD: 20-30, 40-50" className="w-full px-3 py-2 rounded-lg border border-slate-300" />
                </div>
                <button className="w-full py-2 bg-cyan-500 text-white font-bold rounded-lg mt-2">Xác nhận</button>
              </div>
            )}
  `;
  panel1Code = panel1Code.replace(cccdCaptureOriginal, newUi);
}

// 3. Insert Panel 1 right before floating GPS button
content = content.replace(/(    \{\/\* Floating GPS Broadcast Button \*\/})/, panel1Code + '\n$1');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done updating index.tsx');
