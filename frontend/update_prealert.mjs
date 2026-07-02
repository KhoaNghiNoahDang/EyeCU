import fs from 'fs';
import path from 'path';

const filePath = 'd:\\HACKAITHON\\EyeCU\\frontend\\src\\routes\\index.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Pattern to extract Panel 4
const panel4Regex = /(    \{\/\* ── 4\. Pre-Alert Panel ── \*\/[\s\S]*?)(    \{\/\* (── 1\.|Floating GPS))/;
const match = content.match(panel4Regex);

if (!match) {
  console.error("Could not find Panel 4");
  process.exit(1);
}

let panel4Original = match[1];
const followingMarker = match[2];

// Remove Panel 4 from its original position
content = content.replace(panel4Original, '');

// Create new Panel 4 UI
const newPanel4 = `    {/* ── 4. Pre-Alert Panel ── */}
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
          <Mic className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Cảnh báo Trước (Pre-Alert)</h3>
          <p className="text-[11px] text-slate-500 font-geist">
            Gửi cảnh báo đến phòng cấp cứu bệnh viện
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center py-6 bg-slate-50 rounded-xl border border-slate-100">
        <button 
          className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center hover:bg-red-200 hover:scale-105 active:scale-95 transition-all shadow-sm border border-red-200"
        >
          <Mic className="w-8 h-8 text-red-600" />
        </button>
        <p className="mt-4 text-sm font-bold text-slate-700">Chạm để ghi âm</p>
        <p className="mt-1 text-[11px] text-slate-500 text-center px-4 max-w-xs">
          Ghi âm tình trạng bệnh nhân, chỉ số sinh tồn và gửi trực tiếp về kíp trực cấp cứu.
        </p>
      </div>
    </div>
`;

// Insert the new Panel 4 right before Panel 2
const panel2Pattern = /(    \{\/\* ── 2\. GPS Map Panel ── \*\/)/;
content = content.replace(panel2Pattern, newPanel4 + '\n$1');

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Done updating Pre-Alert panel.');
