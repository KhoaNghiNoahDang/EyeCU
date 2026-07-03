const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Replace Demo text
content = content.replace(/title="Nhập biển số trực tiếp \(demo\)"/g, 'title="Nhập thủ công"');
content = content.replace(/⚡ Demo/g, '⚡ Nhập thủ công');

// 2. Add history tab in navItems
const navItemsRegex = /const navItems: \{ key: ViewKey; Icon: typeof Eye; label: string \}\[\] = \[\s*\{ key: "ambient", Icon: Eye, label: "Giám sát Không gian" \},\s*\{ key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" \},/;
const navItemsReplacement = `const navItems: { key: ViewKey; Icon: typeof Eye; label: string }[] = [
  { key: "ambient", Icon: Eye, label: "Giám sát Không gian" },
  { key: "ambulance", Icon: Ambulance, label: "Điều phối Cấp cứu" },
  { key: "history", Icon: HistoryIcon, label: "Lịch sử Cấp cứu" },`;
content = content.replace(navItemsRegex, navItemsReplacement);

// 3. Add HistoryView render in PatientRounds
const renderRegex = /\{activeView === "ambulance" && \(\s*<MapErrorBoundary>\s*<AmbulanceView \/>\s*<\/MapErrorBoundary>\s*\)\}/;
const renderReplacement = `{activeView === "ambulance" && (
              <MapErrorBoundary>
                <AmbulanceView />
              </MapErrorBoundary>
            )}
            {activeView === "history" && <HistoryView />}`;
content = content.replace(renderRegex, renderReplacement);

fs.writeFileSync(path, content, 'utf8');

console.log("Done adding history tab");
