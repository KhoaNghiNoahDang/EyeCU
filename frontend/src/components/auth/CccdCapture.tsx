import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, CreditCard, RefreshCw } from "lucide-react";

const ACCENT = "#88E8F2";

interface CccdCaptureProps {
  side: "front" | "back";
  capturedUrl: string | null;
  onCapture: (dataUrl: string) => void;
}

export function CccdCapture({ side, capturedUrl, onCapture }: CccdCaptureProps) {
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
        setError("Thiết bị không hỗ trợ camera.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 320 },
            height: { ideal: 240 },
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
        if (!cancelled) setError("Không mở được camera. Hãy cấp quyền trong cài đặt.");
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
    
    // Scale down to max 1280px
    const MAX_DIM = 1280;
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
    const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
    stopCamera();
    onCapture(dataUrl);
  };

  const label = side === "front" ? "Mặt trước CCCD" : "Mặt sau CCCD";

  return (
    <div className="space-y-3">
      <div className="text-center">
        <div
          className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${ACCENT}22` }}
        >
          <CreditCard className="h-5 w-5" style={{ color: ACCENT }} />
        </div>
        <p className="text-sm font-bold text-slate-900">{label}</p>
        <p className="text-[11px] text-slate-500">Đặt CCCD vào khung hình · Camera sau</p>
      </div>

      <div
        className="relative mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border-2"
        style={{ borderColor: capturedUrl ? "#10b981" : `${ACCENT}60`, aspectRatio: "1.586/1" }}
      >
        {capturedUrl ? (
          <img src={capturedUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-3 rounded-lg border-2 border-dashed border-white/60" />
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-3 py-1 text-[10px] font-bold text-white">
              {side === "front" ? "SỐ CCCD · HỌ TÊN" : "ĐỊA CHỈ · QR CODE"}
            </div>
          </>
        )}
        {capturedUrl && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white">
            <CheckCircle2 className="h-3 w-3" />
            Đã chụp
          </div>
        )}
      </div>

      {error && <p className="text-center text-xs text-red-600">{error}</p>}

      {!error && !capturedUrl && (
        <p className="text-center text-[11px] text-slate-500">
          Đặt CCCD phẳng, đủ ánh sáng · Avoid glare
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
            Chụp {label}
          </button>
        )}
      </div>
    </div>
  );
}
