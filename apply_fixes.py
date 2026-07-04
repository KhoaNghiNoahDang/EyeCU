import re

file_path = "/Users/macbook/Documents/CODE/EyeCU/EyeCU/frontend/src/components/PatientPortalNew.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update lucide-react imports
if "ChevronDown" not in content and "CheckCircle2" not in content:
    content = re.sub(r'(import \{ [^\}]+)(\} from "lucide-react";)', r'\1, ChevronDown, CheckCircle2 \2', content, count=1)

# 2. Update ViewState
if "payment_confirmation" not in content:
    content = content.replace(
        'type ViewState = "home" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "invoice_list" | "digital_signature" | "hospital_map";',
        'type ViewState = "home" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";'
    )

# 3. Add FaceIdCapture before export function
face_id_code = """
const FaceIdCapture = ({ onCapture }: { onCapture: (base64: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error("Camera error:", e);
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        onCapture(canvas.toDataURL("image/jpeg", 0.9));
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 rounded-full overflow-hidden mb-6 border-4 border-[#88E8F2] shadow-[0_0_20px_rgba(136,232,242,0.4)]">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        <div className="absolute inset-0 border-[6px] border-transparent border-t-[#88E8F2] border-b-[#88E8F2] rounded-full animate-spin-slow opacity-60"></div>
      </div>
      <p className="text-[15px] font-medium text-slate-600 mb-8 text-center max-w-[280px]">
        Vui lòng giữ khuôn mặt trong khung hình để xác thực
      </p>
      <button onClick={handleCapture} className="w-full max-w-[280px] bg-[#0d1f2d] text-white rounded-full py-4 text-[16px] font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform">
        Xác thực khuôn mặt
      </button>
    </div>
  );
};

export function PatientPortalNew({"""

content = content.replace("export function PatientPortalNew({", face_id_code)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Applied initial fixes")
