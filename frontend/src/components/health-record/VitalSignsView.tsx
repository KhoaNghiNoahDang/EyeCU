import React from "react";
import { ArrowLeft, Heart, Thermometer, Droplets, Activity } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function VitalSignsView({ onBack, data }: Props) {
  const vs = data?.vitalSigns;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden absolute inset-0 z-50">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm border-b border-slate-100">
        <button onClick={onBack} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-2">Sinh hiệu</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!vs ? (
          <div className="text-center text-slate-500 mt-10">Chưa có dữ liệu sinh hiệu</div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">Nhịp tim</p>
                <p className="text-xl font-bold text-[#0d1f2d]">{vs.heart_rate || "--"} <span className="text-sm font-normal text-slate-400">bpm</span></p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">Huyết áp</p>
                <p className="text-xl font-bold text-[#0d1f2d]">{vs.blood_pressure || "--"} <span className="text-sm font-normal text-slate-400">mmHg</span></p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-cyan-50 flex items-center justify-center">
                <Droplets className="h-6 w-6 text-cyan-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">SpO2 (Oxy trong máu)</p>
                <p className="text-xl font-bold text-[#0d1f2d]">{vs.spo2 || "--"} <span className="text-sm font-normal text-slate-400">%</span></p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                <Thermometer className="h-6 w-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">Nhiệt độ cơ thể</p>
                <p className="text-xl font-bold text-[#0d1f2d]">{vs.temperature || "--"} <span className="text-sm font-normal text-slate-400">°C</span></p>
              </div>
            </div>

            <p className="text-xs text-center text-slate-400 mt-4">Cập nhật lần cuối: {new Date(vs.measured_at).toLocaleString('vi-VN')}</p>
          </>
        )}
      </div>
    </div>
  );
}
