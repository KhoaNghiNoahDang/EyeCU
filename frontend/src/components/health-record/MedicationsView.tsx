import React from "react";
import { Pill, Syringe, FileWarning, Clock, FileText, Sun, Moon, Utensils, CheckCircle2 } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function MedicationsView({ onBack, data }: Props) {
  const extractedMedications = data?.extractedRecordData?.medications;
  const medications = data?.medications || [];

  const renderScheduleGrid = (med: any) => {
    // Explicit Vietnamese → ASCII map (more reliable than NFD)
    const normVi = (s: string) =>
      (s || "").toLowerCase()
        .replace(/[àáâãäåāăą]|[ắặằẳẵăấầẩẫậâáàảãạ]/g, "a")
        .replace(/[èéêëēĕęě]|[ếệềểễêéèẻẽẹ]/g, "e")
        .replace(/[ìíîïīĭįı]|[íìỉĩịî]/g, "i")
        .replace(/[òóôõöōŏő]|[ốộồổỗôóòỏõọơớợờởỡ]/g, "o")
        .replace(/[ùúûüūŭůű]|[ướựừửữưúùủũụ]/g, "u")
        .replace(/[ýÿ]|[ýỳỷỹỵ]/g, "y")
        .replace(/[đ]/g, "d");

    const instrRaw = med.instructions || med.dosage || "";
    const instr = normVi(instrRaw);
    
    // Extract only the number from the dosage field
    const dosageNum = instrRaw.match(/[\d\.]+/)?.[0] || "";

    // Detect which sessions are active
    const hasSang  = /sang|buoi sang|an sang|truoc sang|sau sang/.test(instr);
    const hasTrua  = /trua|buoi trua|an trua/.test(instr);
    const hasChieu = /chieu|buoi chieu|an chieu/.test(instr);
    const hasToi   = /toi|buoi toi|an toi|truoc khi ngu/.test(instr);

    // Extract dose number per session (e.g. "1 viên sáng" -> "1", "sáng 2 viên" -> "2")
    const extractDose = (kw: string): string => {
      // Pattern 1: keyword then number then unit (e.g. "sáng 2 viên")
      const m1 = instr.match(new RegExp(`${kw}.{0,15}?([\\d\\.]+)\\s*(?:vien|ong|goi|ml|mg|mcg|g|v)`, "i"));
      if (m1 && m1[1]) return m1[1];

      // Pattern 2: number then unit then keyword (e.g. "2 viên sáng", "1 viên sau ăn sáng")
      const m2 = instr.match(new RegExp(`([\\d\\.]+)\\s*(?:vien|ong|goi|ml|mg|mcg|g|v).{0,20}?${kw}`, "i"));
      if (m2 && m2[1]) return m2[1];

      // Pattern 3: just number next to keyword (e.g. "sáng: 2", "sáng 2"). Reject if followed by time units like "phut"
      const m3 = instr.match(new RegExp(`${kw}[\\s:\\-]*([\\d\\.]+)(?!\\s*(?:phut|p|h|gio))`, "i"));
      if (m3 && m3[1]) return m3[1];

      // fallback: first number from instruction that has a med unit
      const n = instr.match(/([\d\.]+)\s*(?:vien|ong|goi|ml|mg|mcg|g)/i);
      return n ? n[1] : (instrRaw.match(/([\d\.]+)/)?.[1] || "");
    };

    let morning = med.morning || med.schedule?.morning;
    let noon = med.noon || med.schedule?.noon;
    let evening = med.evening || med.schedule?.evening;
    let night = med.night || med.schedule?.night;

    if (!morning && !noon && !evening && !night) {
       morning = hasSang ? extractDose("sang") || dosageNum : "-";
       noon = hasTrua ? extractDose("trua") || dosageNum : "-";
       evening = hasChieu ? extractDose("chieu") || dosageNum : "-";
       night = hasToi ? extractDose("toi") || dosageNum : "-";
    } else {
       morning = morning || "-";
       noon = noon || "-";
       evening = evening || "-";
       night = night || "-";
    }

    const getTimeColor = (val: string) => {
      return val !== "-" ? "text-[#0d1f2d] bg-[#88E8F2]/30 font-bold border-[#88E8F2]/50" : "text-slate-400 bg-slate-50 font-medium border-slate-100";
    };

    const getIconColor = (val: string) => {
      return val !== "-" ? "text-yellow-500" : "text-slate-300";
    };

    return (
      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${getTimeColor(morning)}`}>
          <Sun className={`h-4 w-4 mb-1 transition-colors ${getIconColor(morning)}`} />
          <span className="text-[10px] text-slate-500 mb-0.5 font-normal">Sáng</span>
          <span className="text-[14px]">{morning}</span>
        </div>
        <div className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${getTimeColor(noon)}`}>
          <Utensils className={`h-4 w-4 mb-1 transition-colors ${getIconColor(noon)}`} />
          <span className="text-[10px] text-slate-500 mb-0.5 font-normal">Trưa</span>
          <span className="text-[14px]">{noon}</span>
        </div>
        <div className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${getTimeColor(evening)}`}>
          <Sun className={`h-4 w-4 mb-1 transition-colors ${getIconColor(evening)}`} />
          <span className="text-[10px] text-slate-500 mb-0.5 font-normal">Chiều</span>
          <span className="text-[14px]">{evening}</span>
        </div>
        <div className={`flex flex-col items-center justify-center py-2 rounded-lg border transition-colors ${getTimeColor(night)}`}>
          <Moon className={`h-4 w-4 mb-1 transition-colors ${getIconColor(night)}`} />
          <span className="text-[10px] text-slate-500 mb-0.5 font-normal">Tối</span>
          <span className="text-[14px]">{night}</span>
        </div>
      </div>
    );
  };

  const renderMedicationList = (list: any[]) => {
    return list.map((med: any, i: number) => (
      <div key={i} className="mb-4 pb-4 border-b border-slate-100 last:border-0 last:mb-0 last:pb-0">
        <h3 className="text-[15px] font-bold text-[#0d1f2d] mb-1">
          {i + 1}. {med.name || med.medicine_name} {med.quantity ? `(${med.quantity})` : ""}
        </h3>
        
        {med.active_ingredient && (
          <p className="text-[13px] text-slate-600 mb-1">
            <span className="font-medium text-[#0d1f2d]">Hoạt chất:</span> {med.active_ingredient}
          </p>
        )}
        
        <p className="text-[13px] text-slate-600 mb-2">
          <span className="font-medium text-[#0d1f2d]">Hướng dẫn:</span> {med.dosage || med.instructions}
        </p>
        
        {renderScheduleGrid(med)}
      </div>
    ));
  };

  const medList = extractedMedications || medications;

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-full">
      {extractedMedications && (
        <div className="bg-[#88E8F2]/20 text-[#0d1f2d] p-2 rounded-lg text-xs font-semibold text-center border border-[#88E8F2]/50">
          Dữ liệu đơn thuốc được bóc tách từ ảnh bằng AI OCR
        </div>
      )}
      
      {medList && medList.length > 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header Đơn thuốc */}
          <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-[#88E8F2]/10 to-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-full bg-[#88E8F2]/30 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-[#0d1f2d]" />
              </div>
              <div>
                <p className="text-[13px] text-[#0d1f2d]/80 font-medium leading-none mb-1">Mã đơn thuốc</p>
                <p className="text-[15px] font-bold text-[#0d1f2d] leading-none">01914260auxa-c</p>
              </div>
            </div>
          </div>
          
          {/* Danh sách thuốc */}
          <div className="p-4">
            {renderMedicationList(medList)}
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-500 mt-10">Chưa có đơn thuốc nào</div>
      )}
    </div>
  );
}
