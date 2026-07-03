import React from "react";
import { ArrowLeft, Pill, Syringe, FileWarning, Clock } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function MedicationsView({ onBack, data }: Props) {
  const medications = data?.medications || [];

  return (
    <div className="p-4 space-y-4 bg-white">
        {medications.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">Chưa có đơn thuốc nào</div>
        ) : (
          medications.map((med: any, i: number) => (
            <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
              <div className="flex items-start gap-3 border-b border-slate-100 pb-3 mb-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 flex items-center justify-center mt-1">
                  <Pill className="h-5 w-5 text-indigo-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-[#0d1f2d]">{med.medicine_name}</h3>
                  <p className="text-sm font-medium text-slate-500 mt-0.5">{med.dosage}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-slate-600">{med.instructions || "Theo chỉ dẫn của bác sĩ"}</p>
                </div>
                <div className="flex items-start gap-2">
                  <FileWarning className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-orange-600">Uống sau khi ăn no. Không dùng chung với sữa.</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
