import React, { useState } from "react";
import { FileText, ChevronRight, ScanLine, X } from "lucide-react";

interface Props {
  onExtract?: (urls: string[]) => void;
  isExtracting?: boolean;
  isEmpty?: boolean;
  selectedDate?: string;
}

export const FileResultsView = ({ onExtract, isExtracting, isEmpty, selectedDate }: Props) => {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);

  let sampleFiles: { title: string; url: string; date: string }[] = [];

  if (selectedDate === "23/3/2026") {
    sampleFiles = [
      { title: "Kết quả Xét nghiệm sinh hóa 01", url: "/xetnghiem_01_2303.pdf", date: "23/03/2026" },
      { title: "Kết quả Xét nghiệm sinh hóa 02", url: "/xetnghiem_02_2303.pdf", date: "23/03/2026" },
      { title: "Kết quả CĐHA chung 01", url: "/chandoan_01_2303.pdf", date: "23/03/2026" },
      { title: "Kết quả CĐHA chung 02", url: "/chandoan_02_2303.pdf", date: "23/03/2026" },
      { title: "Kết quả CĐHA chung 03", url: "/chandoan_03_2303.pdf", date: "23/03/2026" },
      { title: "Đơn thuốc", url: "/donthuoc_2303.pdf", date: "23/03/2026" },
    ];
  } else if (selectedDate === "23/1/2026") {
    sampleFiles = [
      { title: "Kết quả Xét nghiệm sinh hóa 01", url: "/xetnghiem_01_2301.pdf", date: "23/01/2026" },
      { title: "Kết quả Xét nghiệm sinh hóa 02", url: "/xetnghiem_02_2301.pdf", date: "23/01/2026" },
      { title: "Kết quả CĐHA chung 01", url: "/chandoan_01_2301.pdf", date: "23/01/2026" },
      { title: "Kết quả CĐHA chung 02", url: "/chandoan_02_2301.pdf", date: "23/01/2026" },
      { title: "Đơn thuốc", url: "/donthuoc_2301.pdf", date: "23/01/2026" },
    ];
  } else if (selectedDate === "16/12/2025") {
    sampleFiles = [
      { title: "Kết quả Xét nghiệm sinh hóa 01", url: "/xetnghiem_01_1612.pdf", date: "16/12/2025" },
      { title: "Kết quả Xét nghiệm sinh hóa 02", url: "/xetnghiem_02_1612.pdf", date: "16/12/2025" },
      { title: "Kết quả CĐHA chung 01", url: "/chandoan_01_1612.pdf", date: "16/12/2025" },
      { title: "Kết quả CĐHA chung 02", url: "/chandoan_02_1612.pdf", date: "16/12/2025" },
      { title: "Đơn thuốc", url: "/donthuoc_1612.pdf", date: "16/12/2025" },
    ];
  } else if (selectedDate === "1/4/2026" || (!selectedDate && !isEmpty)) {
    sampleFiles = [
      { title: "Kết quả Xét nghiệm sinh hóa 01", url: "/mau_xet_nghiem_1.pdf", date: "01/04/2026" },
      { title: "Kết quả Xét nghiệm sinh hóa 02", url: "/mau_xet_nghiem_2.pdf", date: "01/04/2026" },
      { title: "Kết quả CĐHA chung 01", url: "/chan_doan_1.pdf", date: "01/04/2026" },
      { title: "Kết quả CĐHA chung 02", url: "/chan_doan_2.pdf", date: "01/04/2026" },
      { title: "Kết quả CĐHA chung 03", url: "/chan_doan_3.pdf", date: "01/04/2026" },
      { title: "Đơn thuốc", url: "/don_thuoc.pdf", date: "01/04/2026" },
    ];
  }

  return (
    <div className="flex flex-col relative">
      {selectedPdf && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0d1f2d] text-white shrink-0">
            <span className="font-bold text-[16px] truncate pr-4">Xem tài liệu</span>
            <button onClick={() => setSelectedPdf(null)} className="p-2 -mr-2 active:scale-95">
              <X className="h-6 w-6" />
            </button>
          </div>
          <iframe 
            src={`${selectedPdf}#toolbar=0`} 
            className="flex-1 w-full bg-slate-100" 
            title="PDF Viewer"
          />
        </div>
      )}

      {sampleFiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <FileText className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-[15px] font-medium text-slate-600 mb-1">Chưa có file kết quả</p>
          <p className="text-[13px] text-slate-500">Hồ sơ của ngày này hiện chưa có tài liệu nào được tải lên.</p>
        </div>
      ) : sampleFiles.map((file, i) => (
         <div 
            key={i} 
            className="flex items-center justify-between px-4 py-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group cursor-pointer"
            onClick={() => setSelectedPdf(file.url)}
         >
          <div className="flex items-center gap-4 overflow-hidden flex-1">
            <div className="h-10 w-10 shrink-0 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
               <FileText className="h-5 w-5 text-red-500" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
               <span className="text-[15px] font-bold text-slate-800 truncate leading-snug">{file.title}</span>
               <span className="text-[13px] text-slate-500 mt-0.5">Tài liệu PDF • {file.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-blue-50 transition-colors">
               <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-500" />
            </div>
          </div>
        </div>
      ))}
      
      {/* Global Cập nhật kết quả button */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
         <button
            onClick={(e) => {
               e.stopPropagation();
               const urlsToExtract = sampleFiles.map(f => f.url);
               if (onExtract) onExtract(urlsToExtract);
            }}
            disabled={isExtracting}
            className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold text-[15px] px-6 py-3 rounded-full shadow-[0_4px_14px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Đang gom file và xử lý VNPT AI...
              </span>
            ) : (
              <>
                <ScanLine className="h-5 w-5" />
                Cập nhật kết quả
              </>
            )}
          </button>
      </div>
    </div>
  );
};
