import { FileText, ChevronRight } from "lucide-react";

export const FileResultsView = ({ data: clinicalBundle }: { data: any }) => {
  if (!clinicalBundle) return <div className="p-4 text-center text-slate-500 text-[13px]">Đang tải...</div>;
  const allFiles: any[] = [];
  if (clinicalBundle.labDocs) {
    clinicalBundle.labDocs.forEach((d: any) => allFiles.push({ title: "Phiếu xét nghiệm", type: "lab", ...d }));
  }
  if (clinicalBundle.imagingResults) {
    clinicalBundle.imagingResults.forEach((d: any) => allFiles.push({ title: "Phiếu CĐHA: " + (d.image_type || "Chung"), type: "imaging", ...d }));
  }
  if (allFiles.length === 0) return <div className="p-4 text-center text-slate-500 text-[13px]">Chưa có file kết quả nào</div>;
  return (
    <div className="px-4 py-2 flex flex-col gap-3">
      {allFiles.map((file, i) => (
        <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <FileText className="h-5 w-5 text-red-500 shrink-0" />
            <span className="text-[14px] font-medium text-slate-700 truncate">{file.title}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
        </div>
      ))}
    </div>
  );
};
