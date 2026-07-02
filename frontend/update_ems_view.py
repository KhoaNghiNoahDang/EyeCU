import re

file_path = r"d:\HACKAITHON\EyeCU\frontend\src\routes\index.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add new state variables right after setHospitalAck
state_vars_to_add = """
  const [manualInputMode, setManualInputMode] = useState<"cccd" | "unknown" | "no_cccd">("cccd");
  const [manualGender, setManualGender] = useState("");
  const [manualAgeRange, setManualAgeRange] = useState("");
  const [manualName, setManualName] = useState("");
"""

content = re.sub(
    r'(const \[hospitalAck, setHospitalAck\] = useState\(false\);)',
    r'\1\n' + state_vars_to_add,
    content,
    count=1
)

# 2. Extract Panel 1
panel1_pattern = r"(?s)(    \{\/\* ── 1\. Patient Identification Panel ── \*\/.*?)(    \{\/\* ── 2\. GPS Map Panel ── \*\/)"
match = re.search(panel1_pattern, content)
if not match:
    print("Could not find Panel 1")
    exit(1)

panel1_code = match.group(1)
rest_of_file_marker = match.group(2)

# Remove Panel 1 from its original position
content = content.replace(panel1_code, "")

# Modify Panel 1 to add the new buttons and inputs
# Find the CccdCapture block
cccd_capture_pattern = r"(<CccdCapture.*?/>)"
cccd_capture_match = re.search(cccd_capture_pattern, panel1_code, re.DOTALL)

if cccd_capture_match:
    cccd_capture_original = cccd_capture_match.group(1)
    
    new_ui = """
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => setManualInputMode("cccd")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${manualInputMode === "cccd" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}`}
              >Quét CCCD</button>
              <button 
                onClick={() => setManualInputMode("unknown")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${manualInputMode === "unknown" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}`}
              >Không rõ danh tính</button>
              <button 
                onClick={() => setManualInputMode("no_cccd")}
                className={`flex-1 py-2 rounded-lg text-sm font-bold border transition ${manualInputMode === "no_cccd" ? "bg-cyan-500 text-white border-cyan-500" : "bg-white text-slate-700 border-slate-200"}`}
              >Không có CCCD</button>
            </div>

            {manualInputMode === "cccd" && (
              <>
                """ + cccd_capture_original + """
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
"""
    panel1_code = panel1_code.replace(cccd_capture_original, new_ui)

# 3. Insert Panel 1 right before floating GPS button
target_pattern = r"(    \{\/\* Floating GPS Broadcast Button \*\/})"
content = re.sub(target_pattern, panel1_code + r"\n\1", content, count=1)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done updating index.tsx")
