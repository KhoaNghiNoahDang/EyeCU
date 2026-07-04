import React from "react";
import { Stethoscope, AlertCircle, FileText, CalendarClock } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function RecordSummaryView({ onBack, data }: Props) {
  const extractedSummary = data?.extractedRecordData?.summary;
  const rec = data?.latestRecord;

  return (
    <div className="bg-white p-4 space-y-4 h-full">
      {!extractedSummary ? (
         <div className="text-center text-slate-500 italic py-6 h-full flex items-center justify-center">Chưa có dữ liệu</div>
      ) : (
        <>
          {/* Khám bệnh theo yêu cầu header */}
      {/* Khám bệnh theo yêu cầu header */}
      <div>
        <h3 className="text-blue-600 font-bold uppercase mb-3">KHÁM BỆNH THEO YÊU CẦU</h3>
        <div className="grid grid-cols-[100px_1fr] gap-x-2 gap-y-2 text-[14px]">
          <div className="text-slate-500 font-medium">Phòng khám:</div>
          <div className="text-slate-900 font-medium font-sans">{extractedSummary?.clinic || "PK Số 02 Yêu Cầu - Tầng 1"}</div>

          <div className="text-slate-500 font-medium">Khoa:</div>
          <div className="text-slate-900 font-medium font-sans">{extractedSummary?.department || "Khoa Nội Tiết"}</div>
        </div>
      </div>

      {/* Kết luận section */}
      <div className="pt-2">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-blue-600 font-bold uppercase whitespace-nowrap">KẾT LUẬN</h3>
          <div className="h-[1px] bg-slate-200 w-full" />
        </div>

        <div className="space-y-4">
          <div>
            <div className="font-bold text-slate-800 text-[15px] mb-1">Chẩn đoán sơ bộ</div>
            <div className="text-slate-800 text-[15px]">{extractedSummary?.pre_diagnosis || "BGN chưa FNA"}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-[15px] mb-1">Chẩn đoán bệnh</div>
            <div className="text-slate-800 text-[15px]">{extractedSummary?.diagnosis || "E04.9-Bướu giáp không độc, không xác định"}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-[15px] mb-1">Lời dặn</div>
            <div className="text-slate-800 text-[15px]">{extractedSummary?.advice || "- Dùng thuốc theo đơn, tái khám theo hẹn - Có bất thường tái khám lại ngay"}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-[15px] mb-1">Quá trình bệnh lý</div>
            <div className="text-slate-800 text-[15px]">{extractedSummary?.history || "Bệnh nhân thấy vướng cổ đi khám bệnh"}</div>
          </div>

          <div>
            <div className="font-bold text-slate-800 text-[15px] mb-1">Lưu ý</div>
            <div className="text-slate-800 text-[15px]">{extractedSummary?.note || "Không có"}</div>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
