import React from "react";
import { User, Phone, MapPin, CreditCard } from "lucide-react";

interface Props {
  onBack: () => void;
  data?: any;
  user?: any;
}

export function AdminInfoView({ onBack, data, user }: Props) {
  const extractedAdmin = data?.extractedRecordData?.admin_info;
  const p = extractedAdmin || user || data || {};

  return (
    <div className="p-4 space-y-4 bg-slate-50 min-h-full">
        {extractedAdmin && (
          <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs font-medium text-center border border-blue-100">
            Dữ liệu được bóc tách từ file Kết quả bằng VNPT AI OCR
          </div>
        )}
        <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
           <h3 className="text-sm font-bold text-[#0d1f2d] uppercase tracking-wide border-b border-slate-100 pb-2 mb-3">Thông tin cơ bản</h3>
           <div className="space-y-3">
              <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Họ và tên</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.name || p.patientName || "--"}</p>
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
              <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <div className="flex-1">
                      <p className="text-xs text-slate-500">Số điện thoại</p>
                      <p className="text-sm font-semibold text-[#0d1f2d]">{p.phone || "--"}</p>
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
  );
}
