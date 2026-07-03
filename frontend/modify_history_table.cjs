const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// 1. Add "Ngày tháng" to History table headers
const historyHeaderRegex = /<th className="px-3 py-3 whitespace-nowrap">Biển số xe<\/th>/;
const historyHeaderReplacement = `<th className="px-3 py-3 whitespace-nowrap">Ngày tháng</th>
                <th className="px-3 py-3 whitespace-nowrap">Biển số xe</th>`;
content = content.replace(historyHeaderRegex, historyHeaderReplacement);

// 2. Add "Ngày tháng" to History table body
const historyBodyRegex = /<tr key=\{`\$\{rec\.plate\}-\$\{idx\}`\} className="border-b border-slate-100 last:border-0 hover:bg-slate-50\/80 transition-colors">\s*<td className="px-3 py-3">/;
const historyBodyReplacement = `<tr key={\`\${rec.plate}-\${idx}\`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-3 whitespace-nowrap text-slate-500 text-xs">{rec.completed_at ? new Date(rec.completed_at).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-3 py-3">`;
content = content.replace(historyBodyRegex, historyBodyReplacement); // Note: this only replaces the first occurrence! I should use /g if there are multiple, but HistoryView only has one history mapping now.
// Let's use /g just in case.
const historyBodyRegexGlobal = /<tr key=\{`\$\{rec\.plate\}-\$\{idx\}`\} className="border-b border-slate-100 last:border-0 hover:bg-slate-50\/80 transition-colors">\s*<td className="px-3 py-3">/g;
content = content.replace(historyBodyRegexGlobal, historyBodyReplacement);

// 3. Deduplicate historyRecords
const deduplicateRegex = /\) : historyRecords\.map\(\(rec, idx\) => \(/;
const deduplicateReplacement = `) : Array.from(new Map(historyRecords.map(item => [item.plate, item])).values()).map((rec, idx) => (`;
content = content.replace(deduplicateRegex, deduplicateReplacement);

fs.writeFileSync(path, content, 'utf8');

console.log("Done updating history table");
