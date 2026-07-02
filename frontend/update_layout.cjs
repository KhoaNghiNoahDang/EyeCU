const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// 1. Add Supabase import
if (!content.includes('import { supabase }')) {
  content = content.replace('import { useAuth }', 'import { supabase } from "../lib/supabase";\\nimport { useAuth }');
}

// 2. ViewKey and Navigation
content = content.replace(
  /type ViewKey =[\s\S]*?\| "admin_dashboard";/,
  \`type ViewKey =
  | "ambient"
  | "ambulance"
  | "history"
  | "records"
  | "voice"
  | "chatbot"
  | "patient"
  | "ems"
  | "admin_dashboard";\`
);

const oldNav = \`  { key: "ambient", Icon: Eye, label: "Giám sát Không gian" },
  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },
  { key: "records", Icon: ScanLine, label: "Hồ sơ Bệnh nhân" },\`;
const newNav = \`  { key: "ambient", Icon: Eye, label: "Giám sát Không gian" },
  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },
  { key: "history" as ViewKey, Icon: History, label: "Lịch sử Cấp cứu" },
  { key: "records", Icon: ScanLine, label: "Hồ sơ Bệnh nhân" },\`;
if (content.includes(oldNav)) {
  content = content.replace(oldNav, newNav);
} else { console.log('Nav not found'); }

const oldRole = \`    views: ["ambient", "ambulance"],\`;
const newRole = \`    views: ["ambient", "ambulance", "history"],\`;
if (content.includes(oldRole)) {
  content = content.replace(oldRole, newRole);
}

// 3. Render HistoryView in Main Layout
const oldRender = \`            {activeView === "ambulance" && (
              <MapErrorBoundary>
                <AmbulanceView />
              </MapErrorBoundary>
            )}
            {activeView === "records" && <RecordsView />}\`;
const newRender = \`            {activeView === "ambulance" && (
              <MapErrorBoundary>
                <AmbulanceView />
              </MapErrorBoundary>
            )}
            {activeView === "history" && <HistoryView />}
            {activeView === "records" && <RecordsView />}\`;
if (content.includes(oldRender)) {
  content = content.replace(oldRender, newRender);
}

// 4. Change "Demo" to "Nhập thủ công"
content = content.replace(
  /<button\s+onClick=\{handleScanClick\}[\s\S]*?>\s*Demo\s*<\/button>/g,
  \`<button onClick={handleScanClick} className="w-full py-3 bg-[#88E8F2] text-slate-900 font-bold text-sm uppercase tracking-wider rounded-xl border border-cyan-300 hover:bg-cyan-200 transition-colors">
    Nhập thủ công
  </button>\`
);

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Routing & layout updated.");
