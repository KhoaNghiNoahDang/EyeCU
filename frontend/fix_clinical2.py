import codecs
import re

with codecs.open('src/routes/index.tsx', 'r', 'utf-8') as f:
    content = f.read()

# 1. Fix clinicalData assignment
content = content.replace(
    'const clinicalData = clinical || DEMO_PATIENT_CLINICAL;',
    '''const clinicalData = clinical || {
    is_empty: true,
    patientId: user?.id || "",
    patientName: user?.name || "",
    cccd: user?.cccd || "",
    bhxh_code: null,
    latestRecord: null,
    medications: [],
    followUp: null,
    fees: null,
  };'''
)

# 2. Fix tiles mapping to handle latestRecord being null
old_tiles = '''  const tiles: {
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
  ];'''

new_tiles = '''  const tiles: {
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
      sub: clinicalData?.medications?.length > 0 ? `${clinicalData.medications.length} loại · Hẹn giờ uống` : "Chưa có dữ liệu",
      color: "#7C3AED",
    },
    {
      key: "followup",
      Icon: Calendar,
      label: "Lịch tái khám",
      sub: clinicalData?.followUp
        ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        : "Chưa có dữ liệu",
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
        : "Chưa có dữ liệu",
      color: "#16A34A",
    },
  ];'''
content = content.replace(old_tiles, new_tiles)

# 3. Fix PatientClinicalSheet to handle no data
# I will use a simple regex to wrap the inside of the <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
# But it's easier to just replace `const record = data.latestRecord;` and the start of the div.

content = content.replace('const record = data.latestRecord;', 'const record = data?.latestRecord;')

old_div_start = '        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">\n          {active === "record" && ('
new_div_start = '''        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!record && !data?.medications?.length && !data?.followUp && !data?.fees ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 text-slate-200 mb-3" />
              <h4 className="text-base font-bold text-slate-900">Chưa có dữ liệu</h4>
              <p className="text-sm text-slate-500 mt-1">Bệnh nhân chưa có thông tin {titles[active]?.toLowerCase() || ""}.</p>
            </div>
          ) : (
            <>
          {active === "record" && record && ('''
content = content.replace(old_div_start, new_div_start)

# Now we need to close the tag right before '</div>\n      </div>\n    </div>\n  );\n}'
old_div_end = '''                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}'''
new_div_end = '''                  </p>
                )}
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}'''
content = content.replace(old_div_end, new_div_end)

with codecs.open('src/routes/index.tsx', 'w', 'utf-8') as f:
    f.write(content)
