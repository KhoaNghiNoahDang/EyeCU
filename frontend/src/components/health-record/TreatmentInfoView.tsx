import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, MapPin, Clock, FileText, Star, Headphones, ChevronDown, ChevronUp, Beaker, Activity, RefreshCw, Calendar, PlusSquare, Stethoscope, TestTube2, FlaskConical } from 'lucide-react';
import { fetchApi } from '../../lib/api/client';
import { useAuth } from '../../lib/auth/auth-context';

interface Props {
  onBack: () => void;
  data: any;
}

const EYECU_PRIMARY = '#0A9BAD'; // main brand teal used for headers & CTAs
const EYECU_LIGHT   = '#88E8F2'; // light accent
const EYECU_DARK    = '#0d1f2d'; // navy text
const EYECU_TEAL    = '#0A9BAD';

export const TreatmentInfoView: React.FC<Props> = ({ onBack, data }) => {
  const [activeTab, setActiveTab]           = useState("Tổng quan");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [records, setRecords]               = useState<any[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const { user } = useAuth();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const tabs = ["Tổng quan", "Dịch vụ"];

  const loadData = () => {
    setLoadingRecords(true);
    fetchApi('/patient/treatment-history')
      .then(res => {
        if (res && res.treatment_history) {
          setRecords(res.treatment_history);
          if (res.treatment_history.length > 0 && !selectedRecord) {
            setSelectedRecord(res.treatment_history[0]);
          } else if (selectedRecord) {
            const updated = res.treatment_history.find((r: any) => r.id === selectedRecord.id);
            if (updated) setSelectedRecord(updated);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoadingRecords(false));
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (records.length > 0 && selectedRecord) {
      const updated = records.find((r: any) => r.id === selectedRecord.id);
      if (updated) setSelectedRecord(updated);
    }
  }, [records]);

  const services = selectedRecord?.services || [];

  // Group services by room_type
  const groupedServices = services.reduce((acc: any, srv: any) => {
    const type = srv.room_type ? srv.room_type.toLowerCase().trim() : 'khác';
    if (!acc[type]) acc[type] = [];
    acc[type].push(srv);
    return acc;
  }, {} as Record<string, any[]>);

  const SERVICE_GROUPS = [
    { key: 'khám bệnh',       label: 'Khám bệnh',            Icon: Stethoscope },
    { key: 'xét nghiệm',      label: 'Xét nghiệm',           Icon: FlaskConical },
    { key: 'thăm dò chức năng', label: 'Thăm dò chức năng',  Icon: Activity },
    { key: 'chẩn đoán hình ảnh', label: 'Chẩn đoán hình ảnh', Icon: FileText },
    { key: 'khác',             label: 'Khác',                 Icon: Activity },
  ];

  const renderServiceSection = (label: string, key: string, Icon: any) => {
    const list = groupedServices[key] || [];
    if (list.length === 0) return null;
    const isOpen = expandedSection === key;

    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-3" key={key}>
        <button
          onClick={() => toggleSection(key)}
          className="w-full p-4 flex items-center justify-between"
          style={{ background: `${EYECU_LIGHT}20` }}
        >
          <div className="flex items-center gap-2.5">
            <Icon className="w-5 h-5" style={{ color: EYECU_TEAL }} strokeWidth={2.5} />
            <span className="font-bold text-[15px]" style={{ color: EYECU_DARK }}>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-[11px] font-bold w-6 h-6 flex items-center justify-center rounded-full text-white"
              style={{ background: EYECU_TEAL }}
            >
              {list.length}
            </span>
            {isOpen
              ? <ChevronUp className="w-5 h-5" style={{ color: EYECU_DARK }} />
              : <ChevronDown className="w-5 h-5" style={{ color: EYECU_DARK }} />}
          </div>
        </button>

        {isOpen && (
          <div className="p-4 bg-slate-50/50 space-y-3 border-t" style={{ borderColor: `${EYECU_LIGHT}40` }}>
            {list.map((srv: any) => (
              <div key={srv.id} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${srv.status === 'completed' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                      <CheckCircle2 className={`w-4 h-4 ${srv.status === 'completed' ? 'text-emerald-600' : 'text-amber-400 opacity-50'}`} />
                    </div>
                    <span className="font-bold text-[14px]" style={{ color: EYECU_DARK }}>
                      {srv.room_name}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                    srv.status === 'completed'
                      ? 'text-emerald-700 bg-emerald-100 border border-emerald-200'
                      : 'text-amber-700 bg-amber-100 border border-amber-200'
                  }`}>
                    {srv.status === 'completed' ? 'Hoàn thành' : 'Đang chờ'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex gap-2 items-center">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
                    <span className="text-[13px] text-slate-600">
                      Phòng {srv.room_number} — Tầng {srv.floor}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" strokeWidth={2} />
                    <span className="text-[12px] text-slate-500 leading-tight">
                      {srv.assigned_at ? new Date(srv.assigned_at).toLocaleString('vi-VN') : '—'}
                      {srv.completed_at && ` ➔ ${new Date(srv.completed_at).toLocaleString('vi-VN')}`}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border active:scale-95 transition-transform"
                    style={{ borderColor: EYECU_TEAL, color: EYECU_TEAL }}
                  >
                    <Star className="w-3.5 h-3.5" /> Đánh giá
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-600 active:scale-95 transition-transform">
                    <Headphones className="w-3.5 h-3.5" /> Hỗ trợ
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] relative overflow-hidden">
      {/* Header */}
      <div
        className="p-4 sticky top-0 z-50 shadow-md flex items-center gap-3"
        style={{ background: EYECU_LIGHT, color: EYECU_DARK }}
      >
        <button onClick={onBack} className="p-1 hover:bg-black/10 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-[17px] font-bold tracking-wide">Thông tin khám — {activeTab}</h2>
      </div>

      {/* Tabs — only Tổng quan & Dịch vụ */}
      <div
        className="px-4 flex justify-start gap-6 border-b border-black/10"
        style={{ background: EYECU_LIGHT }}
      >
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-3 text-[14px] font-bold transition-colors relative ${
              activeTab === tab ? 'opacity-100' : 'opacity-60 hover:opacity-100'
            }`}
            style={{ color: EYECU_DARK }}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full" style={{ background: EYECU_DARK }} />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-8 p-4">
        {/* ─── Tổng quan ─── */}
        {activeTab === "Tổng quan" && (
          <div className="space-y-4">
            {loadingRecords && records.length === 0 ? (
              <div className="py-10 flex flex-col justify-center items-center">
                <RefreshCw className="w-8 h-8 animate-spin mb-2" style={{ color: EYECU_TEAL }} />
                <p className="text-sm font-medium text-slate-500">Đang tải lịch sử khám...</p>
              </div>
            ) : records.length === 0 ? (
              <div className="py-10 flex flex-col justify-center items-center text-slate-400">
                <Activity className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Chưa có lịch sử khám</p>
              </div>
            ) : (
              records.map(record => {
                const isSelected = selectedRecord?.id === record.id;
                const dateStr = new Date(record.created_at).toLocaleDateString('vi-VN');
                return (
                  <div
                    key={record.id}
                    onClick={() => { setSelectedRecord(record); setActiveTab("Dịch vụ"); setExpandedSection(null); }}
                    className={`bg-white rounded-[20px] shadow-sm border overflow-hidden cursor-pointer active:scale-[0.98] transition-all ${
                      isSelected ? 'ring-2' : 'border-slate-200'
                    }`}
                    style={isSelected ? { borderColor: EYECU_TEAL, '--tw-ring-color': `${EYECU_TEAL}30` } as any : {}}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${EYECU_LIGHT}40` }}>
                            <PlusSquare className="w-5 h-5" style={{ color: EYECU_TEAL }} strokeWidth={2.5} />
                          </div>
                          <div>
                            <h3 className="font-bold text-[15px]" style={{ color: EYECU_DARK }}>
                              {record.id.slice(0, 8).toUpperCase()}
                            </h3>
                            <p className="text-[13px] text-slate-500 uppercase font-medium">{user?.name}</p>
                          </div>
                        </div>
                        {record.services && record.services.length > 0 && record.services.some((s: any) => s.status !== 'completed') ? (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-amber-700 bg-amber-100 border border-amber-200 uppercase tracking-wide">
                            Đang chờ
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-100 border border-emerald-200 uppercase tracking-wide">
                            Hoàn thành
                          </span>
                        )}
                      </div>

                      <div className="text-[12px] text-slate-400 mb-3 pb-3 border-b border-slate-100">
                        {dateStr} ➔ {dateStr}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[13px]">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-500">Ngày sinh:</span>
                          <span className="font-bold" style={{ color: EYECU_DARK }}>{user?.dob || '—'}</span>
                          <span className="text-slate-500 ml-2">Giới tính:</span>
                          <span className="font-bold" style={{ color: EYECU_DARK }}>{user?.gender || '—'}</span>
                        </div>
                        <div className="flex items-start gap-3 text-[13px]">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-slate-500 whitespace-nowrap">Chẩn đoán:</span>
                          <span className="font-bold leading-tight" style={{ color: EYECU_DARK }}>
                            {record.diagnosis || 'Chưa có chẩn đoán'}
                          </span>
                        </div>
                        {record.doctor_name && (
                          <div className="flex items-start gap-3 text-[13px]">
                            <Activity className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                            <span className="text-slate-500 whitespace-nowrap">Bác sĩ:</span>
                            <span className="font-bold leading-tight" style={{ color: EYECU_DARK }}>
                              BS. {record.doctor_name}
                              {record.department_name ? ` (${record.department_name})` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ─── Dịch vụ ─── */}
        {activeTab === "Dịch vụ" && selectedRecord && (
          <div className="space-y-3">
            {/* Record header */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-2">
              <p className="text-[12px] text-slate-400 mb-1">Đợt khám đã chọn</p>
              <p className="font-bold text-[14px]" style={{ color: EYECU_DARK }}>
                {selectedRecord.id.slice(0, 8).toUpperCase()}
              </p>
              {selectedRecord.diagnosis && (
                <p className="text-[13px] text-slate-600 mt-0.5">{selectedRecord.diagnosis}</p>
              )}
            </div>

            {services.length === 0 ? (
              <div className="py-10 flex flex-col justify-center items-center text-slate-400">
                <Activity className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm font-medium">Chưa có dịch vụ nào được chỉ định</p>
              </div>
            ) : (
              SERVICE_GROUPS.map(g => renderServiceSection(g.label, g.key, g.Icon))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
