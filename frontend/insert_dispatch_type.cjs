const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

const MARKER = '/* ---------- Main AmbulanceView ---------- */';
const idx = content.indexOf(MARKER);
if (idx === -1) {
  console.log('Marker not found!');
  process.exit(1);
}

// Find the line after "type MapFilter = ..."
const afterMarker = content.indexOf('\n', idx);
const lineEnd = content.indexOf('\n', afterMarker + 1);

const insertion = `\r\n\r\n// Dispatch Record — realtime from EMS WebSocket\r\ninterface DispatchRecord {\r\n  plate: string;\r\n  eta: number | null;\r\n  patientName: string | null;\r\n  gender: string | null;\r\n  age: string | null;\r\n  cccd: string | null;\r\n  chronicConditions: string[] | null;\r\n  allergies: string[] | null;\r\n  alertLabel: string | null;\r\n  erTeam: string;\r\n  addedAt: number;\r\n}`;

// Insert after MapFilter line
content = content.slice(0, lineEnd) + insertion + content.slice(lineEnd);
fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log('Done - DispatchRecord inserted at line after MapFilter');
