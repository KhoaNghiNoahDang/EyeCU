import codecs

with codecs.open('src/routes/index.tsx', 'r', 'utf-8') as f:
    content = f.read()

# 1. Replace clinicalData assignment
old_clinical_data = "const clinicalData = clinical || DEMO_PATIENT_CLINICAL;"
new_clinical_data = "const clinicalData = clinical;"
content = content.replace(old_clinical_data, new_clinical_data)

# 2. Replace tiles array
old_tiles = """  const tiles: {
    key: PatientServiceKey;
    Icon: typeof Receipt;
    label: string;
    sub: string;
    color: string;
    badge?: string;
  }[] = [
    {
      key: "record",
      Icon: Receipt,
      label: "Phiếu khám bệnh",
      sub: `${formatRecordDate(clinicalData.latestRecord.created_at)} · ${clinicalData.latestRecord.doctor_name}`,
      color: "#2563EB",
      badge: clinicalData.latestRecord.is_signed ? "Ký số" : undefined,
    },
    {
      key: "prescription",
      Icon: Pill,
      label: "Đơn thuốc điện tử",
      sub: `${clinicalData.medications.length} loại · Hẹn giờ uống`,
      color: "#7C3AED",
    },
    {
      key: "followup",
      Icon: Calendar,
      label: "Lịch tái khám",
      sub: clinicalData.followUp
        ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        : "Chưa có",
      color: "#D97706",
    },
    {
      key: "fees",
      Icon: FileText,
      label: "Viện phí",
      sub: clinicalData.fees
        ? clinicalData.fees.status === "paid"
          ? `${formatVnd(clinicalData.fees.total)} · Đã TT ✓`
          : `${formatVnd(clinicalData.fees.total)} · Chưa TT`
        : "Chưa có",
      color: "#16A34A",
    },
  ];"""

new_tiles = """  const tiles: {
    key: PatientServiceKey;
    Icon: typeof Receipt;
    label: string;
    sub: string;
    color: string;
    badge?: string;
  }[] = [
    {
      key: "record",
      Icon: Receipt,
      label: "Phiếu khám bệnh",
      sub: clinicalData?.latestRecord ? `${formatRecordDate(clinicalData.latestRecord.created_at)} · ${clinicalData.latestRecord.doctor_name}` : "Chưa có dữ liệu",
      color: "#2563EB",
      badge: clinicalData?.latestRecord?.is_signed ? "Ký số" : undefined,
    },
    {
      key: "prescription",
      Icon: Pill,
      label: "Đơn thuốc điện tử",
      sub: clinicalData?.medications?.length ? `${clinicalData.medications.length} loại · Hẹn giờ uống` : "Chưa có dữ liệu",
      color: "#7C3AED",
    },
    {
      key: "followup",
      Icon: Calendar,
      label: "Lịch tái khám",
      sub: clinicalData?.followUp
        ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        : "Chưa có",
      color: "#D97706",
    },
    {
      key: "fees",
      Icon: FileText,
      label: "Viện phí",
      sub: clinicalData?.fees
        ? clinicalData.fees.status === "paid"
          ? `${formatVnd(clinicalData.fees.total)} · Đã TT ✓`
          : `${formatVnd(clinicalData.fees.total)} · Chưa TT`
        : "Chưa có",
      color: "#16A34A",
    },
  ];"""
content = content.replace(old_tiles, new_tiles)

# 3. Replace PatientClinicalSheet start
old_sheet = """function PatientClinicalSheet({
  active,
  onClose,
  data,
}: {
  active: PatientServiceKey | null;
  onClose: () => void;
  data: any;
}) {
  if (!active) return null;

  const record = data.latestRecord;

  const titles: Record<PatientServiceKey, string> = {
    record: "Phiếu khám bệnh",
    prescription: "Đơn thuốc điện tử",
    followup: "Lịch tái khám",
    fees: "Viện phí",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-[400px] flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:rounded-[1.75rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400">
              clinical_records · medications
            </p>
            <h3 className="text-lg font-bold text-slate-900">{titles[active]}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">"""

new_sheet = """function PatientClinicalSheet({
  active,
  onClose,
  data,
}: {
  active: PatientServiceKey | null;
  onClose: () => void;
  data: any;
}) {
  if (!active) return null;

  const titles: Record<PatientServiceKey, string> = {
    record: "Phiếu khám bệnh",
    prescription: "Đơn thuốc điện tử",
    followup: "Lịch tái khám",
    fees: "Viện phí",
  };

  const hasData = data && data.latestRecord;
  const record = hasData ? data.latestRecord : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div className="relative flex max-h-[85dvh] w-full max-w-[400px] flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-2xl sm:rounded-[1.75rem]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-[10px] font-geist uppercase tracking-wider text-slate-400">
              clinical_records · medications
            </p>
            <h3 className="text-lg font-bold text-slate-900">{titles[active]}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 text-slate-200 mb-3" />
              <h4 className="text-base font-bold text-slate-900">Chưa có dữ liệu</h4>
              <p className="text-sm text-slate-500 mt-1">Bệnh nhân chưa có thông tin {titles[active].toLowerCase()}.</p>
            </div>
          ) : (
            <>"""
content = content.replace(old_sheet, new_sheet)

old_end = """        </div>
      </div>
    </div>
  );
}"""

# I need to find the last </div> before return inside PatientClinicalSheet
# Since I added <>, I need to add </>
new_end = """            </>
          )}
        </div>
      </div>
    </div>
  );
}"""
# Wait, replacing just the end is risky if there are multiple. 
# Let me use regex for the end.
import re
content = re.sub(r'        </div>\n      </div>\n    </div>\n  \);\n}', r'            </>\n          )}\n        </div>\n      </div>\n    </div>\n  );\n}', content, count=1)

with codecs.open('src/routes/index.tsx', 'w', 'utf-8') as f:
    f.write(content)
