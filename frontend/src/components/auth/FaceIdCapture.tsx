import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, RefreshCw } from "lucide-react";

const ACCENT = "#88E8F2";
const ACCENT_DARK = "#0A9BAD";

interface FaceIdCaptureProps {
  onCapture: (dataUrl: string) => void;
  capturedUrl?: string | null;
}

export function FaceIdCapture({ onCapture, capturedUrl }: FaceIdCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (capturedUrl) {
      stopCamera();
      return;
    }

    let cancelled = false;

    async function start() {
      setError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Thiết bị không hỗ trợ camera. Vui lòng dùng iPhone hoặc Android.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "user" },
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setReady(true);
        }
      } catch {
        setError("Không mở được camera. Hãy cấp quyền Camera trong Cài đặt.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [capturedUrl]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement("canvas");
    
    // Capture at 1024px max — balanced for VNPT face recognition quality
    const MAX_DIM = 1024;
    let width = video.videoWidth;
    let height = video.videoHeight;
    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.floor(height * (MAX_DIM / width));
        width = MAX_DIM;
      } else {
        width = Math.floor(width * (MAX_DIM / height));
        height = MAX_DIM;
      }
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, width, height);
    // Quality 0.88 — enough for VNPT face matching without payload too large
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    stopCamera();
    onCapture(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div
        className="relative mx-auto aspect-[3/4] w-full max-w-[220px] overflow-hidden rounded-2xl border-2"
        style={{ borderColor: capturedUrl ? "#10b981" : `${ACCENT}60` }}
      >
        {capturedUrl ? (
          <img src={capturedUrl} alt="Ảnh khuôn mặt" className="h-full w-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />
            <div className="pointer-events-none absolute inset-4 rounded-[40%] border-2 border-dashed border-white/70" />
            <div
              className="pointer-events-none absolute inset-x-6 top-1/2 h-0.5 -translate-y-1/2"
              style={{
                background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
                animation: "face-scan 2s ease-in-out infinite",
              }}
            />
          </>
        )}
        {capturedUrl && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">
            <CheckCircle2 className="h-3 w-3" />
            Đã chụp
          </div>
        )}
      </div>

      <style>{`@keyframes face-scan { 0%, 100% { transform: translateY(-40px); opacity: 0.4; } 50% { transform: translateY(40px); opacity: 1; } }`}</style>

      {error && <p className="text-center text-xs text-red-600">{error}</p>}

      {!error && (
        <p className="text-center text-xs text-slate-500">
          {capturedUrl
            ? "Ảnh sẽ lưu vào avatar_url để so khớp VNPT Face"
            : "Đưa khuôn mặt vào khung oval · Camera trước iOS/Android"}
        </p>
      )}

      <div className="flex gap-2">
        {capturedUrl ? (
          <button
            type="button"
            onClick={() => onCapture("")}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700"
          >
            <RefreshCw className="h-4 w-4" />
            Chụp lại
          </button>
        ) : (
          <button
            type="button"
            onClick={capturePhoto}
            disabled={!ready}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
            style={{ backgroundColor: ACCENT }}
          >
            <Camera className="h-4 w-4" />
            Chụp khuôn mặt
          </button>
        )}
      </div>
    </div>
  );
}

export { ACCENT, ACCENT_DARK };
