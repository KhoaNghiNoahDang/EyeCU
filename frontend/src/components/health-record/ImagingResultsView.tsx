import React from "react";
import { Image as ImageIcon } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function ImagingResultsView({ onBack, data }: Props) {
  const extractedImg = data?.extractedRecordData?.imaging_results;
  const imaging = data?.imagingResults || [];

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-full">
        {extractedImg ? (
          <>
            <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs font-medium text-center border border-blue-100">
              Dữ liệu được bóc tách từ file Kết quả bằng VNPT AI OCR
            </div>
            {Object.entries(extractedImg).map(([key, val]: [string, any], i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-[#0d1f2d] px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-bold uppercase">{key}</span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                   <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                       <p className="text-[12px] text-slate-500 mb-1 font-medium uppercase tracking-wide">Kỹ thuật</p>
                       <p className="text-[14px] text-slate-800 leading-relaxed font-medium">{val["kỹ thuật"]}</p>
                   </div>
                   
                   <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                       <p className="text-[12px] text-red-500 mb-1 font-bold uppercase tracking-wide">Kết luận</p>
                       <p className="text-[14px] text-red-900 leading-relaxed font-medium">{val["kết luận"]}</p>
                   </div>
                   
                   {val["hình ảnh"] && val["hình ảnh"].length > 0 && (
                     <div className="mt-3">
                        <img src={val["hình ảnh"][0]} alt={key} className="w-full rounded-lg border border-slate-200 shadow-sm" />
                     </div>
                   )}
                </div>
              </div>
            ))}
          </>
        ) : imaging.length > 0 ? (
          imaging.map((img: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="bg-[#0d1f2d] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm font-bold uppercase">{img.image_type}</span>
                </div>
                <span className="text-xs text-white/70">{new Date(img.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
              
              <div className="p-4 space-y-3">
                 <img src={img.image_url} alt={img.image_type} className="w-full rounded-lg border border-slate-200" />
                 
                 <div className="bg-slate-50 rounded-lg p-3">
                     <p className="text-[12px] text-slate-500 mb-1 font-medium uppercase tracking-wide">Mô tả tổn thương</p>
                     <p className="text-[14px] text-slate-800 leading-relaxed">{img.description || "Không có mô tả chi tiết."}</p>
                 </div>

                 <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                     <p className="text-[12px] text-red-500 mb-1 font-bold uppercase tracking-wide">Kết luận</p>
                     <p className="text-[14px] text-red-900 leading-relaxed font-medium">{img.conclusion || "Chưa có kết luận chính thức."}</p>
                 </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-500 mt-10">Chưa có kết quả chẩn đoán hình ảnh</div>
        )}
    </div>
  );
}
