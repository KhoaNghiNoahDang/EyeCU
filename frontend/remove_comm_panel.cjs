const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// Find the start of the block
const startIdx = content.indexOf('{/* ── 3. Communication Panel ── */}');
if (startIdx === -1) {
  console.log("Could not find start index");
  process.exit(1);
}

// The box is a div. It ends before ── 1. Patient Identification Panel ──
const nextSectionIdx = content.indexOf('{/* ── 1. Patient Identification Panel ── */}');
if (nextSectionIdx === -1) {
  console.log("Could not find next section index");
  process.exit(1);
}

// Remove everything from startIdx to nextSectionIdx
content = content.slice(0, startIdx) + content.slice(nextSectionIdx);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully removed Communication Panel");
