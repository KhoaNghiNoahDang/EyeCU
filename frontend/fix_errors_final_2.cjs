const fs = require('fs');
let content = fs.readFileSync('src/routes/index.tsx', 'utf8');

// Normalize newlines to \n to avoid carriage return mismatch issues
content = content.replace(/\r\n/g, '\n');

// 1. Remove old historyRecords box (from line 4347 to 4414 in original)
const oldBoxStr = '        {historyRecords.length > 0 && (\n          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden';
const indexOldBox = content.indexOf(oldBoxStr);
if (indexOldBox !== -1) {
  // Let's find the closing brace count matching `{historyRecords.length > 0 && (`
  let endIdx = indexOldBox + 30; // skip `{historyRecords` part
  let braceCount = 1;
  while (braceCount > 0 && endIdx < content.length) {
    if (content[endIdx] === '{') braceCount++;
    if (content[endIdx] === '}') braceCount--;
    endIdx++;
  }
  content = content.slice(0, indexOldBox) + content.slice(endIdx);
  console.log("Old historyRecords box removed.");
} else {
  // Fallback regex removal
  content = content.replace(/\{historyRecords\.length > 0 && \([\s\S]*?\)\}/, '');
  console.log("Old historyRecords box removed (fallback).");
}

// 2. Add types to maps in AmbulanceView table
content = content.replace(
  'rec.chronic_conditions.map((c) =>',
  'rec.chronic_conditions.map((c: string) =>'
);
content = content.replace(
  'rec.allergies.map((a) =>',
  'rec.allergies.map((a: string) =>'
);
console.log("Table mapping types added.");

// 3. Fix other TS7006 implicit any parameters in unmodified parts of the file if needed
content = content.replace(
  'prescription.medications.map((med) =>',
  'prescription.medications.map((med: any) =>'
);
content = content.replace(
  'fee.items.map((item) =>',
  'fee.items.map((item: any) =>'
);
console.log("Prescription/fee map types fixed.");

// Convert back to CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('src/routes/index.tsx', content, 'utf8');
console.log("Done.");
