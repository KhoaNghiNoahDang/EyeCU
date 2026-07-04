import React from "react";
import { Heart, Thermometer, Droplets, Activity, ActivitySquare } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function VitalSignsView({ onBack, data }: Props) {
  // Use OCR extracted data if available, fallback to DB data
  const extractedVs = data?.extractedRecordData?.vital_signs;
  const vs = data?.vitalSigns;

  const displayData = extractedVs ? {
    heart_rate: extractedVs.mach,
    blood_pressure: extractedVs.huyet_ap,
    spo2: "--", // OCR mock didn't extract this
    temperature: extractedVs.nhiet_do,
    measured_at: new Date().toISOString(), // Mock current time for OCR
    respiratory_rate: extractedVs.nhip_tho,
    weight: extractedVs.can_nang,
    height: extractedVs.chieu_cao,
    bmi: extractedVs.bmi
  } : vs;

  return (
    <div className="p-4 space-y-3 bg-white">
        {!displayData ? (
          <div className="text-center text-slate-500 mt-10">Chưa có dữ liệu sinh hiệu</div>
        ) : (
          <>
            {extractedVs && (
              <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs font-medium text-center border border-blue-100 mb-2">
                Dữ liệu được bóc tách từ file Kết quả bằng VNPT AI OCR
              </div>
            )}
            
            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-50 flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">Nhịp tim (Mạch)</p>
                <p className="text-xl font-bold text-[#0d1f2d]">{displayData.heart_rate || "--"} <span className="text-sm font-normal text-slate-400">l/p</span></p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium">Huyết áp</p>
                <p className="text-xl font-bold text-[#0d1f2d]">{displayData.blood_pressure || "--"} <span className="text-sm font-normal text-slate-400">mmHg</span></p>
              </div>
            </div>

            {displayData.respiratory_rate && (
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-50 flex items-center justify-center">
                  <ActivitySquare className="h-6 w-6 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-500 font-medium">Nhịp thở</p>
                  <p className="text-xl font-bold text-[#0d1f2d]">{displayData.respiratory_rate} <span className="text-sm font-normal text-slate-400">l/p</span></p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center mb-2">
                  <Thermometer className="h-5 w-5 text-orange-500" />
                </div>
                <p className="text-xs text-slate-500 font-medium">Nhiệt độ</p>
                <p className="text-lg font-bold text-[#0d1f2d]">{displayData.temperature || "--"}<span className="text-xs text-slate-400">°C</span></p>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center mb-2">
                  <Droplets className="h-5 w-5 text-cyan-500" />
                </div>
                <p className="text-xs text-slate-500 font-medium">SpO2</p>
                <p className="text-lg font-bold text-[#0d1f2d]">{displayData.spo2 || "--"}<span className="text-xs text-slate-400">%</span></p>
              </div>
            </div>

            {displayData.weight && displayData.height && (
              <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex justify-around text-center">
                <div>
                  <p className="text-xs text-slate-500 font-medium">Cân nặng</p>
                  <p className="text-lg font-bold text-[#0d1f2d]">{displayData.weight}<span className="text-xs text-slate-400">kg</span></p>
                </div>
                <div className="w-px bg-slate-100" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">Chiều cao</p>
                  <p className="text-lg font-bold text-[#0d1f2d]">{displayData.height}<span className="text-xs text-slate-400">cm</span></p>
                </div>
                <div className="w-px bg-slate-100" />
                <div>
                  <p className="text-xs text-slate-500 font-medium">BMI</p>
                  <p className="text-lg font-bold text-[#0d1f2d]">{displayData.bmi}</p>
                </div>
              </div>
            )}

            <p className="text-xs text-center text-slate-400 mt-4">
              Cập nhật lần cuối: {new Date(displayData.measured_at || Date.now()).toLocaleString('vi-VN')}
            </p>
          </>
        )}
    </div>
  );
}
