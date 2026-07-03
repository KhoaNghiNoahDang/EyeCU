import React from "react";
import { ArrowLeft, User, Phone, MapPin, CreditCard } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function AdminInfoView({ onBack, data }: Props) {
  const p = data;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden absolute inset-0 z-50">
      <div className="flex items-center justify-between px-4 py-3 bg-white text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm border-b border-slate-100">
        <button onClick={onBack} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-2">Thông tin hành chính</span>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
           <h3 className="text-sm font-bold text-[#0d1f2d] uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Thông tin cơ bản</h3>
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Họ và tên</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.patientName || "--"}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Giới tính, Ngày sinh</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.gender || "Nam"}, {p.dob || "--"}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">CCCD / CMND</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.cccd || "--"}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Mã BHYT</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.bhxh_code || "--"}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Địa chỉ</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.address || "--"}</p>
                  </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
           <h3 className="text-sm font-bold text-[#0d1f2d] uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Liên hệ khẩn cấp</h3>
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Tên người liên hệ</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.emergency_contact_name || "--"}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Số điện thoại khẩn cấp</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.emergency_contact_phone || "--"}</p>
                  </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
