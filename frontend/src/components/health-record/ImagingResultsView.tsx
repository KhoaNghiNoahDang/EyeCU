import React from "react";
import { ArrowLeft, Image as ImageIcon } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function ImagingResultsView({ onBack, data }: Props) {
  const imaging = data?.imagingResults || [];

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden absolute inset-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-white text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm border-b border-slate-100">
        <button onClick={onBack} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-2">Kết quả CĐHA</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {imaging.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">Chưa có kết quả chẩn đoán hình ảnh</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
