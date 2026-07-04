import React, { useState } from "react";
import { Activity } from "lucide-react";

interface Props {
  onBack: () => void;
  data: any;
}

export function LabResultsView({ onBack, data }: Props) {
  const [activeTab, setActiveTab] = useState<"immunology" | "biochemistry" | "hematology">("immunology");
  const extractedLab = data?.extractedRecordData?.lab_results;

  const tabs = [
    { key: "immunology", label: "Miễn dịch" },
    { key: "biochemistry", label: "Hóa sinh" },
    { key: "hematology", label: "Huyết học" }
  ];

  const renderTabContent = (items: any) => {
    if (!items || Object.keys(items).length === 0) {
      return <div className="text-center text-slate-500 italic py-6">Chưa có dữ liệu</div>;
    }
    return (
      <div className="bg-white">
        {Object.entries(items).map(([name, valObj]: [string, any], idx) => {
          if (typeof valObj === 'string') {
              return (
                <div key={idx} className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0">
                  <div className="text-[15px] text-slate-900 font-bold">{name}</div>
                  <div className="text-right">
                    <span className="text-[16px] text-slate-900">{valObj}</span>
                  </div>
                </div>
              )
          }

          const { value, unit, range, isAbnormal } = valObj;
          return (
            <div key={idx} className="flex justify-between items-start p-4 border-b border-slate-100 last:border-0">
              <div className="text-[15px] text-slate-900 font-bold pt-1 max-w-[50%]">
                {name}
              </div>
              <div className="text-right flex-1">
                <div className="flex items-center justify-end gap-1">
                  <span className={`text-[16px] font-bold ${isAbnormal ? "text-red-600" : "text-slate-900"}`}>{value || "--"}</span>
                  <Activity className={`h-[18px] w-[18px] ${isAbnormal ? "text-red-600" : "text-blue-600"}`} />
                </div>
                {range && unit && (
                  <div className="text-[13px] text-slate-400 mt-1">
                    (Bình thường: {range} {unit})
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!extractedLab) {
    return <div className="text-center text-slate-500 mt-10">Chưa có kết quả xét nghiệm</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4 border border-slate-200 mx-4 mt-2">
      <div className="bg-[#0b5c9e] px-4 py-3.5 flex items-center gap-3 text-white">
        <Activity className="h-[22px] w-[22px]" />
        <span className="text-[16px] font-medium">Kết quả xét nghiệm</span>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 py-3 text-[14px] font-bold text-center border-b-2 transition-colors ${
              activeTab === tab.key 
                ? "border-blue-600 text-blue-600 bg-blue-50/50" 
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="bg-[#dcf0e8] px-4 py-2.5 flex justify-between items-center text-[#0e9f6e] font-semibold text-[14px]">
         <span>Tên xét nghiệm</span>
         <span>Kết quả</span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50">
        {renderTabContent(extractedLab ? extractedLab[activeTab] : null)}
      </div>
    </div>
  );
}
