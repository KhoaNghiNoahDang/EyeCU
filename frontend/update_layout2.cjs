const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Add Supabase import
if (!content.includes('import { supabase }')) {
  content = content.replace('import { useAuth }', 'import { supabase } from "../lib/supabase";\\nimport { useAuth }');
}
if (!content.includes('import { History }')) {
  content = content.replace('import {\\n  Eye,', 'import {\\n  Eye,\\n  History,');
}

// 2. ViewKey and Navigation
const newViewKey = "type ViewKey =\\n" +
  "  | 'ambient'\\n" +
  "  | 'ambulance'\\n" +
  "  | 'history'\\n" +
  "  | 'records'\\n" +
  "  | 'voice'\\n" +
  "  | 'chatbot'\\n" +
  "  | 'patient'\\n" +
  "  | 'ems'\\n" +
  "  | 'admin_dashboard';";
content = content.replace(/type ViewKey =[\s\S]*?\| "admin_dashboard";/, newViewKey);

const oldNav = '  { key: "ambient", Icon: Eye, label: "Giám sát Không gian" },\\n  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },\\n  { key: "records", Icon: ScanLine, label: "Hồ sơ Bệnh nhân" },';
const newNav = '  { key: "ambient", Icon: Eye, label: "Giám sát Không gian" },\\n  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },\\n  { key: "history" as ViewKey, Icon: History, label: "Lịch sử Cấp cứu" },\\n  { key: "records", Icon: ScanLine, label: "Hồ sơ Bệnh nhân" },';
if (content.includes(oldNav)) {
  content = content.replace(oldNav, newNav);
}

const oldRole = '    views: ["ambient", "ambulance"],';
const newRole = '    views: ["ambient", "ambulance", "history"],';
if (content.includes(oldRole)) {
  content = content.replace(oldRole, newRole);
}

// 3. Render HistoryView in Main Layout
const oldRender = '            {activeView === "ambulance" && (\\n              <MapErrorBoundary>\\n                <AmbulanceView />\\n              </MapErrorBoundary>\\n            )}\\n            {activeView === "records" && <RecordsView />}';
const newRender = '            {activeView === "ambulance" && (\\n              <MapErrorBoundary>\\n                <AmbulanceView />\\n              </MapErrorBoundary>\\n            )}\\n            {activeView === "history" && <HistoryView />}\\n            {activeView === "records" && <RecordsView />}';
if (content.includes(oldRender)) {
  content = content.replace(oldRender, newRender);
}

// 4. Change "Demo" to "Nhập thủ công"
content = content.replace(
  /<button\s+onClick=\{handleScanClick\}[\s\S]*?>\s*Demo\s*<\/button>/g,
  '<button onClick={handleScanClick} className="w-full py-3 bg-[#88E8F2] text-slate-900 font-bold text-sm uppercase tracking-wider rounded-xl border border-cyan-300 hover:bg-cyan-200 transition-colors">Nhập thủ công</button>'
);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Routing & layout updated.");
