import { FileText, ChevronRight } from "lucide-react";

export const FileResultsView = () => {
  // Hardcode 2 sample PDFs for all patients as requested
  const sampleFiles = [
    { title: "Kết quả Xét nghiệm sinh hóa 01", url: "/mau_xet_nghiem_1.pdf", date: "Hôm nay" },
    { title: "Kết quả Xét nghiệm sinh hóa 02", url: "/mau_xet_nghiem_2.pdf", date: "Hôm qua" },
    { title: "Kết quả CĐHA chung 01", url: "/chan_doan_1.pdf", date: "Hôm nay" },
    { title: "Kết quả CĐHA chung 02", url: "/chan_doan_2.pdf", date: "Hôm qua" },
    { title: "Kết quả CĐHA chung 03", url: "/chan_doan_3.pdf", date: "Hôm qua" },
    { title: "Đơn thuốc", url: "/don_thuoc.pdf", date: "Hôm nay" },
  ];

  return (
    <div className="flex flex-col">
      {sampleFiles.map((file, i) => (
         <a 
            key={i} 
            href={file.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group"
         >
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
               <FileText className="h-5 w-5 text-red-500" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
               <span className="text-[15px] font-bold text-slate-800 truncate leading-snug">{file.title}</span>
               <span className="text-[13px] text-slate-500 mt-0.5">Tài liệu PDF • {file.date}</span>
            </div>
          </div>
          <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
             <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
          </div>
        </a>
      ))}
    </div>
  );
};
