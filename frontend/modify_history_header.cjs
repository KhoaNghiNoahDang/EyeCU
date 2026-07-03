const fs = require('fs');

const path = "d:\\\\HACKAITHON\\\\EyeCU\\\\frontend\\\\src\\\\routes\\\\index.tsx";
let content = fs.readFileSync(path, 'utf8');

// The header block we want to remove:
const headerRegex = /<div className="flex items-center gap-4 mb-8">\s*<div>\s*<h1 className="text-2xl font-black text-slate-900 font-geist tracking-tight flex items-center gap-3">\s*<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900\/20">\s*<HistoryIcon className="w-5 h-5" \/>\s*<\/div>\s*Lịch sử Điều phối Cấp cứu\s*<\/h1>\s*<p className="text-slate-500 font-medium mt-1 ml-13 flex items-center gap-2">\s*Theo dõi các ca cấp cứu ngoại viện đã hoàn thành\s*<\/p>\s*<\/div>\s*<\/div>/;

if (headerRegex.test(content)) {
  content = content.replace(headerRegex, '');
  fs.writeFileSync(path, content, 'utf8');
  console.log("Done removing duplicate header");
} else {
  console.log("Could not find the header block");
}
