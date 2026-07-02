const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// Normalize newlines to \n to avoid carriage return mismatch issues
content = content.replace(/\r\n/g, '\n');

// 1. Add 'history' to viewTitles
const oldTitles = "const viewTitles: Record<ViewKey, { title: string; subtitle: string }> = {\n" +
  "  ambient: {\n" +
  "    title: \"Giám sát Không gian — Đa Khoa\",\n" +
  "    subtitle: \"Giám sát AI Nhận thức · Sensor Fusion\",\n" +
  "  },";
const newTitles = "const viewTitles: Record<ViewKey, { title: string; subtitle: string }> = {\n" +
  "  ambient: {\n" +
  "    title: \"Giám sát Không gian — Đa Khoa\",\n" +
  "    subtitle: \"Giám sát AI Nhận thức · Sensor Fusion\",\n" +
  "  },\n" +
  "  history: { title: \"Lịch sử Cấp cứu\", subtitle: \"Theo dõi các ca cấp cứu đã hoàn thành\" },";

if (content.includes(oldTitles)) {
  content = content.replace(oldTitles, newTitles);
  console.log("1. viewTitles updated.");
} else {
  // Try dynamic regex replace
  content = content.replace(
    /const viewTitles: Record<ViewKey, \{ title: string; subtitle: string \}> = \{/,
    "const viewTitles: Record<ViewKey, { title: string; subtitle: string }> = {\n  history: { title: \"Lịch sử Cấp cứu\", subtitle: \"Theo dõi các ca cấp cứu đã hoàn thành\" },"
  );
  console.log("1. viewTitles updated (regex).");
}

// 2. Fix lucide-react imports to import HistoryIcon
content = content.replace(
  /import \{\n\s*Activity,/,
  "import {\n  Activity,\n  History as HistoryIcon,"
);
console.log("2. lucide-react imports updated.");

// 3. Fix LprScanner props signature
const lprScannerDefRegex = /function LprScanner\(\{[\s\S]*?\}\) \{/;
const lprScannerDefNew = `function LprScanner({
  plate,
  onNotify,
  queue,
  activeId,
  onSelectQueue,
  hospitalId,
  onScanComplete,
}: {
  plate: string;
  onNotify: () => void;
  queue: AmbulanceUnit[];
  activeId: string | null;
  onSelectQueue: (id: string) => void;
  hospitalId?: string;
  onScanComplete?: (plate: string) => void;
}) {`;

content = content.replace(lprScannerDefRegex, lprScannerDefNew);
console.log("3. LprScanner signature updated.");

// 4. Fix LprScanner component usage in AmbulanceView
content = content.replace(
  /onScanComplete=\{\(plate\) => handleSocketMessage\(\{ type: "GATE_OPEN", data: \{ plate \} \}\)\}/,
  "onScanComplete={(plate) => handleSocketMessage({ type: 'GATE_OPEN', data: { plate } })}"
);
console.log("4. LprScanner instance updated.");

// 5. Fix type of 'r' in useEffect supabase query to const r: Record<string, any> = {};
content = content.replace(
  "const r = {};",
  "const r: Record<string, any> = {};"
);
console.log("5. Mapped object type fixed.");

// 6. Remove the old Lịch sử cấp cứu box from AmbulanceView
// We can use a regex to match from `{/* ═══════════════════════════════════════════════════════════════\n            BOX 3: LỊCH SỬ CẤP CỨU`
// to the closing of the box. Since it's nested in AmbulanceView, we find the index of the string and replace it.
const box3Index = content.indexOf("BOX 3: LỊCH SỬ CẤP CỨU");
if (box3Index !== -1) {
  // Let's find the starting `{` before this comment
  const startIdx = content.lastIndexOf("{", box3Index);
  // Find matching closing `}`
  let braceCount = 1;
  let endIdx = startIdx + 1;
  while (braceCount > 0 && endIdx < content.length) {
    if (content[endIdx] === "{") braceCount++;
    if (content[endIdx] === "}") braceCount--;
    endIdx++;
  }
  content = content.slice(0, startIdx) + content.slice(endIdx);
  console.log("6. Old Lịch sử box removed.");
} else {
  console.log("6. Old Lịch sử box not found.");
}

// Convert newlines back to Windows CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Done.");
