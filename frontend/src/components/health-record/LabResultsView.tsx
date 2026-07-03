import React from "react";
import { ArrowLeft, Activity, FileText } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function LabResultsView({ onBack, data }: Props) {
  const labDocs = data?.labDocs || [];

  return (
    <div className="p-4 space-y-4 bg-white">
        {labDocs.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">Chưa có kết quả xét nghiệm</div>
        ) : (
          labDocs.map((doc: any, i: number) => {
            let extracted = null;
            if (doc.extracted_data) {
               try {
                   extracted = typeof doc.extracted_data === 'string' ? JSON.parse(doc.extracted_data) : doc.extracted_data;
               } catch (e) {
                   extracted = doc.extracted_data;
               }
            }
            return (
              <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-[#0d1f2d] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-bold">{doc.doc_type === "blood_test" ? "Xét nghiệm máu" : "Xét nghiệm"}</span>
                  </div>
                  <span className="text-xs text-white/70">{new Date(doc.uploaded_at).toLocaleDateString('vi-VN')}</span>
                </div>
                
                <div className="p-4">
                   {doc.image_url && (
                       <img src={doc.image_url} alt="Phiếu xét nghiệm" className="w-full rounded-lg border border-slate-200 mb-4 object-cover max-h-48" />
                   )}
                   
                   <div className="space-y-2">
                       <h4 className="text-[13px] font-bold text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-500" /> Dữ liệu trích xuất (AI OCR)
                       </h4>
                       {!extracted ? (
                           <p className="text-sm text-slate-500 italic">Hệ thống đang xử lý hình ảnh...</p>
                       ) : (
                           <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px]">
                               {Object.entries(extracted).map(([key, val], idx) => (
                                   <React.Fragment key={idx}>
                                       <div className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}</div>
                                       <div className="font-medium text-[#0d1f2d] text-right">{String(val)}</div>
                                   </React.Fragment>
                               ))}
                           </div>
                       )}
                   </div>
                </div>
              </div>
            );
          })
        )}
    </div>
  );
}
