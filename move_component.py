import os

file_path = "frontend/src/components/PatientPortalNew.tsx"
with open(file_path, "r") as f:
    content = f.read()

# We need to find the start of FaceIdCapture and its end
start_str = "const FaceIdCapture = ({ onCapture }: { onCapture: (base64: string) => void }) => {"
if start_str in content:
    # It is currently right after "}) {\n" which is the end of PatientPortalNew signature
    parts = content.split("}) {\n" + start_str, 1)
    if len(parts) == 2:
        # Extract the component code
        rest = parts[1]
        # The component ends at "  );\n};\n"
        end_idx = rest.find("  );\n};\n") + len("  );\n};\n")
        component_code = start_str + rest[:end_idx]
        
        # New content
        new_content = parts[0] + "}) {\n" + rest[end_idx:]
        
        # Now place component_code before export function PatientPortalNew
        sig_start = "export function PatientPortalNew({"
        new_content = new_content.replace(sig_start, component_code + "\n\n" + sig_start)
        
        with open(file_path, "w") as f:
            f.write(new_content)
        print("Successfully moved FaceIdCapture!")
    else:
        print("Could not split content.")
else:
    print("FaceIdCapture not found.")
