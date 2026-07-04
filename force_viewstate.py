import re

file_path = "/Users/macbook/Documents/CODE/EyeCU/EyeCU/frontend/src/components/PatientPortalNew.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace ViewState
content = re.sub(
    r'type ViewState = .*?;',
    'type ViewState = "home" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";',
    content
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Forced ViewState update!")
