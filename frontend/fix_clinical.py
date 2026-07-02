import codecs

with codecs.open('src/routes/index.tsx', 'r', 'utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "const clinicalData = clinical || DEMO_PATIENT_CLINICAL;" in line:
        lines[i] = "  const clinicalData = clinical;\n"

# tiles replacement
for i, line in enumerate(lines):
    if 'sub: `${formatRecordDate(clinicalData.latestRecord.created_at)} · ${clinicalData.latestRecord.doctor_name}`,' in line:
        lines[i] = '      sub: clinicalData?.latestRecord ? `${formatRecordDate(clinicalData.latestRecord.created_at)} · ${clinicalData.latestRecord.doctor_name}` : "Chưa có dữ liệu",\n'
    if 'badge: clinicalData.latestRecord.is_signed ? "Ký số" : undefined,' in line:
        lines[i] = '      badge: clinicalData?.latestRecord?.is_signed ? "Ký số" : undefined,\n'
    if 'sub: `${clinicalData.medications.length} loại · Hẹn giờ uống`,' in line:
        lines[i] = '      sub: clinicalData?.medications?.length ? `${clinicalData.medications.length} loại · Hẹn giờ uống` : "Chưa có dữ liệu",\n'
    if 'sub: clinicalData.followUp' in line and '?' not in line: # To only catch the first line of ternary
        # Wait, the followup ternary spans multiple lines:
        # sub: clinicalData.followUp
        #   ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        #   : "Chưa có",
        pass
    if 'sub: clinicalData.fees' in line and '?' not in line:
        pass

# Better approach for tiles is string replacement
content = "".join(lines)

old_followup = '''      sub: clinicalData.followUp
        ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        : "Chưa có",'''
new_followup = '''      sub: clinicalData?.followUp
        ? `${clinicalData.followUp.date} · ${clinicalData.followUp.time}`
        : "Chưa có dữ liệu",'''
content = content.replace(old_followup, new_followup)

old_fees = '''      sub: clinicalData.fees
        ? clinicalData.fees.status === "paid"
          ? `${formatVnd(clinicalData.fees.total)} · Đã TT ✓`
          : `${formatVnd(clinicalData.fees.total)} · Chưa TT`
        : "Chưa có",'''
new_fees = '''      sub: clinicalData?.fees
        ? clinicalData.fees.status === "paid"
          ? `${formatVnd(clinicalData.fees.total)} · Đã TT ✓`
          : `${formatVnd(clinicalData.fees.total)} · Chưa TT`
        : "Chưa có dữ liệu",'''
content = content.replace(old_fees, new_fees)


old_sheet_start = '''function PatientClinicalSheet({
  active,
  onClose,
  data,
}: {
  active: PatientServiceKey | null;
  onClose: () => void;
  data: any;
}) {
  if (!active) return null;

  const record = data.latestRecord;'''

new_sheet_start = '''function PatientClinicalSheet({
  active,
  onClose,
  data,
}: {
  active: PatientServiceKey | null;
  onClose: () => void;
  data: any;
}) {
  if (!active) return null;

  const hasData = data && data.latestRecord;
  const record = hasData ? data.latestRecord : null;'''
content = content.replace(old_sheet_start, new_sheet_start)

old_sheet_mid = '''        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {active === "record" && ('''

new_sheet_mid = '''        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 text-slate-200 mb-3" />
              <h4 className="text-base font-bold text-slate-900">Chưa có dữ liệu</h4>
              <p className="text-sm text-slate-500 mt-1">Bệnh nhân chưa có thông tin {titles[active].toLowerCase()}.</p>
            </div>
          ) : (
            <>
          {active === "record" && ('''
content = content.replace(old_sheet_mid, new_sheet_mid)

old_sheet_end = '''                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}'''

new_sheet_end = '''                  </p>
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
content = content.replace(old_sheet_end, new_sheet_end)

with codecs.open('src/routes/index.tsx', 'w', 'utf-8') as f:
    f.write(content)
