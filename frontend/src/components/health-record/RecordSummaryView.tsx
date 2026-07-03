import React from "react";
import { ArrowLeft, Stethoscope, AlertCircle, FileText, CalendarClock } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function RecordSummaryView({ onBack, data }: Props) {
  const rec = data?.latestRecord;

  return (
    <div className="p-4 space-y-4 bg-white">
        {!rec ? (
          <div className="text-center text-slate-500 mt-10">Chưa có kết quả khám</div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm space-y-4">
               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                   <div className="flex items-center gap-2">
                       <CalendarClock className="h-4 w-4 text-slate-400" />
                       <span className="text-xs font-semibold text-slate-500 uppercase">Ngày khám</span>
                   </div>
                   <span className="text-sm font-bold text-[#0d1f2d]">{new Date(rec.created_at).toLocaleDateString('vi-VN')}</span>
               </div>
               
               <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                   <div className="flex items-center gap-2">
                       <Stethoscope className="h-4 w-4 text-slate-400" />
                       <span className="text-xs font-semibold text-slate-500 uppercase">Bác sĩ khám</span>
                   </div>
                   <span className="text-sm font-bold text-[#0d1f2d]">{rec.doctor_name || "BS. Điều trị"}</span>
               </div>

               <div>
                   <div className="flex items-center gap-2 mb-2">
                       <AlertCircle className="h-4 w-4 text-orange-500" />
                       <h3 className="text-sm font-bold text-[#0d1f2d] uppercase">Lý do khám / Triệu chứng</h3>
                   </div>
                   <div className="bg-orange-50 rounded-lg p-3 border border-orange-100 text-[13px] text-orange-900 leading-relaxed">
                       {rec.symptoms || "Không ghi nhận triệu chứng bất thường."}
                   </div>
               </div>

               <div>
                   <div className="flex items-center gap-2 mb-2">
                       <Stethoscope className="h-4 w-4 text-blue-500" />
                       <h3 className="text-sm font-bold text-[#0d1f2d] uppercase">Chẩn đoán</h3>
                   </div>
                   <div className="bg-blue-50 rounded-lg p-3 border border-blue-100 text-[13px] text-blue-900 leading-relaxed font-medium">
                       {rec.diagnosis || "Đang theo dõi..."}
                   </div>
               </div>

               <div>
                   <div className="flex items-center gap-2 mb-2">
                       <FileText className="h-4 w-4 text-emerald-500" />
                       <h3 className="text-sm font-bold text-[#0d1f2d] uppercase">Lời dặn của Bác sĩ</h3>
                   </div>
                   <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 text-[13px] text-emerald-900 leading-relaxed">
                       {rec.notes || "Không có ghi chú thêm."}
                   </div>
               </div>
            </div>

            {rec.is_signed && (
               <div className="flex items-center justify-center gap-2 py-4">
                  <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 text-xs font-bold">✓</span>
                  </div>
                  <span className="text-sm font-bold text-green-700">Bệnh án đã được ký điện tử</span>
               </div>
            )}
          </>
        )}
    </div>
  );
}
