import re

file_path = "/Users/macbook/Documents/CODE/EyeCU/EyeCU/frontend/src/components/PatientPortalNew.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update Xem chi tiết button color
old_button = 'className="w-full rounded-xl bg-[#0d1f2d] py-3 text-[14px] font-bold text-white shadow-sm active:scale-95 transition-transform"'
new_button = 'className={`w-full rounded-xl py-3 text-[14px] font-bold shadow-sm active:scale-95 transition-transform ${inv.status === \'paid\' ? \'bg-slate-200 text-slate-500\' : \'bg-[#88E8F2] text-[#0d1f2d]\'}`}'
if old_button in content:
    content = content.replace(old_button, new_button)
    print("Updated button color")
else:
    print("Could not find old_button")

# 2. Fix Xác nhận thanh toán padding (from pb-[90px] to pb-[120px] and pb-safe to pb-safe mb-2)
old_padding = '<div className="flex-1 overflow-y-auto px-4 py-6 pb-[90px]">'
new_padding = '<div className="flex-1 overflow-y-auto px-4 py-6 pb-[140px]">'
if old_padding in content:
    content = content.replace(old_padding, new_padding)
    print("Updated padding")
else:
    print("Could not find old_padding")

old_bar = '<div className="bg-white p-4 border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)] absolute bottom-0 left-0 right-0 z-20">'
new_bar = '<div className="bg-white p-4 border-t border-slate-200 pb-[calc(env(safe-area-inset-bottom)+20px)] shadow-[0_-4px_20px_rgba(0,0,0,0.04)] absolute bottom-0 left-0 right-0 z-20">'
if old_bar in content:
    content = content.replace(old_bar, new_bar)
    print("Updated bottom bar padding")
else:
    print("Could not find old_bar")


# 3. Fix QR Code fetch unauthorized
old_qr_fetch = """          try {
            const res = await fetch(`http://localhost:8000/api/patient/payment/qr-code?invoice_id=${inv.id}&amount=${inv.total}`);
            if (res.ok) {
              const data = await res.json();
              if (data.qr_code) {
                qrs[inv.id] = data.qr_code;
              }
            }
          }"""
new_qr_fetch = """          try {
            const res = await fetchApi(`/patient/payment/qr-code?invoice_id=${inv.id}&amount=${inv.total}`);
            if (res && res.qr_code) {
              qrs[inv.id] = res.qr_code;
            }
          }"""
if old_qr_fetch in content:
    content = content.replace(old_qr_fetch, new_qr_fetch)
    print("Updated QR fetch")
else:
    print("Could not find old_qr_fetch")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
