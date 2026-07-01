import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Radio, RadioTower, StopCircle, Wifi, WifiOff } from "lucide-react";

export const Route = createFileRoute("/driver")({
  component: DriverPage,
});

// ===== CẤU HÌNH THUẬT TOÁN ÁNH XẠ TOẠ ĐỘ =====
//
// Chiếc bản đồ SVG trong index.tsx có viewBox="0 0 600 420".
// Toạ độ (0,0) là góc trên-trái, (600,420) là góc dưới-phải.
//
// Mình chọn một vùng thực tế tại Hà Nội (khu vực Bạch Mai) làm "vùng neo".
// GPS thật từ điện thoại rơi vào vùng này sẽ được ánh xạ sang toàn bộ bản đồ SVG.
//
// Nguyên lý: Biến đổi tuyến tính (linear interpolation)
//   mapX = (lng - GPS_LNG_MIN) / (GPS_LNG_MAX - GPS_LNG_MIN) * SVG_W
//   mapY = (lat - GPS_LAT_MAX) / (GPS_LAT_MIN - GPS_LAT_MAX) * SVG_H  <- đảo ngược Y (lat lớn = lên trên)
//
// Để test trong phòng: team đứng cách nhau vài mét GPS vẫn thay đổi,
// bán kính ~0.01 độ kinh/vĩ tuyến ≈ 1.1km rộng/cao nên chấm sẽ dịch chuyển rõ rệt.

const GPS_BOUNDS = {
  // Vùng bao phủ thực tế: khu vực Hà Nội (Bạch Mai - Hoàng Mai)
  lat: { min: 20.97, max: 21.05 },  // ~8.8km theo chiều bắc-nam
  lng: { min: 105.80, max: 105.90 }, // ~9km theo chiều đông-tây
};

const SVG_BOUNDS = {
  // Giới hạn toạ độ SVG của bản đồ (có padding 40px để xe không chạy ra rìa)
  x: { min: 40, max: 560 },
  y: { min: 40, max: 380 },
};

export function gpsToSvg(lat: number, lng: number): { mapX: number; mapY: number } {
  // Clamp vào vùng GPS để tránh xe chạy ra ngoài bản đồ
  const clampedLat = Math.max(GPS_BOUNDS.lat.min, Math.min(GPS_BOUNDS.lat.max, lat));
  const clampedLng = Math.max(GPS_BOUNDS.lng.min, Math.min(GPS_BOUNDS.lng.max, lng));

  // Tỷ lệ nội suy (0 → 1)
  const tx = (clampedLng - GPS_BOUNDS.lng.min) / (GPS_BOUNDS.lng.max - GPS_BOUNDS.lng.min);
  const ty = (clampedLat - GPS_BOUNDS.lat.max) / (GPS_BOUNDS.lat.min - GPS_BOUNDS.lat.max); // đảo trục Y

  const mapX = Math.round(SVG_BOUNDS.x.min + tx * (SVG_BOUNDS.x.max - SVG_BOUNDS.x.min));
  const mapY = Math.round(SVG_BOUNDS.y.min + ty * (SVG_BOUNDS.y.max - SVG_BOUNDS.y.min));

  return { mapX, mapY };
}

const AMBULANCE_OPTIONS = [
  { id: "xe1", label: "Xe 1 · 29A-213.07", color: "#EF4444" },
  { id: "xe2", label: "Xe 2 · 30F-567.89", color: "#F59E0B" },
  { id: "xe3", label: "Xe 3 · 51A-999.11", color: "#10B981" },
];

type TrackingStatus = "idle" | "requesting" | "tracking" | "error";

function DriverPage() {
  const [selectedAmbulance, setSelectedAmbulance] = useState("xe1");
  const [status, setStatus] = useState<TrackingStatus>("idle");
  const [wsStatus, setWsStatus] = useState<"disconnected" | "connected">("disconnected");
  const [errorMsg, setErrorMsg] = useState("");
  const [lastCoords, setLastCoords] = useState<{ lat: number; lng: number; mapX: number; mapY: number } | null>(null);
  const [sentCount, setSentCount] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const WS_URL = (typeof window !== "undefined"
    ? (import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:8000`)
    : "ws://localhost:8000") + "/api/ambient/ws/live";

  // Kết nối WebSocket
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setWsStatus("connected");
    ws.onclose = () => {
      setWsStatus("disconnected");
      // Tự kết nối lại sau 3 giây
      setTimeout(connectWs, 3000);
    };
    ws.onerror = () => setWsStatus("disconnected");
  }, [WS_URL]);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
    };
  }, [connectWs]);

  // Bắt đầu theo dõi GPS
  const startTracking = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Trình duyệt này không hỗ trợ GPS. Hãy dùng Chrome/Safari mới nhất.");
      setStatus("error");
      return;
    }

    setStatus("requesting");
    setErrorMsg("");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const { mapX, mapY } = gpsToSvg(lat, lng);
        setLastCoords({ lat, lng, mapX, mapY });
        setStatus("tracking");

        // Gửi qua WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "GPS_UPDATE",
            data: {
              ambulance_id: selectedAmbulance,
              lat,
              lng,
              mapX,
              mapY,
            },
          }));
          setSentCount(c => c + 1);
        }
      },
      (err) => {
        if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
          setErrorMsg("Bạn đã từ chối quyền định vị. Vào Cài đặt trình duyệt để bật lại.");
        } else {
          setErrorMsg(`Lỗi GPS: ${err.message}`);
        }
        setStatus("error");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  };

  // Dừng theo dõi
  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setStatus("idle");
    setLastCoords(null);
    setSentCount(0);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const selectedAmb = AMBULANCE_OPTIONS.find(a => a.id === selectedAmbulance)!;

  return (
    <div className="min-h-screen flex flex-col" style={{
      background: "linear-gradient(160deg, #0a0f1e 0%, #0f1f3a 50%, #0a0f1e 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.3)" }}>
            <RadioTower className="w-5 h-5" style={{ color: "#22d3ee" }} />
          </div>
          <div>
            <p className="font-black text-white text-base tracking-tight">EyeCU · Xe Cấp cứu</p>
            <p className="text-xs" style={{ color: "rgba(148,163,184,0.8)" }}>Hệ thống định vị xe cấp cứu</p>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 px-4 flex flex-col gap-4">

        {/* Chọn xe */}
        <div className="rounded-2xl p-4" style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
        }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#94a3b8" }}>
            Chọn xe của bạn
          </p>
          <div className="flex flex-col gap-2">
            {AMBULANCE_OPTIONS.map(amb => (
              <button
                key={amb.id}
                onClick={() => !status.includes("tracking") && setSelectedAmbulance(amb.id)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200"
                style={{
                  background: selectedAmbulance === amb.id
                    ? `${amb.color}22`
                    : "rgba(255,255,255,0.03)",
                  border: selectedAmbulance === amb.id
                    ? `2px solid ${amb.color}88`
                    : "2px solid rgba(255,255,255,0.07)",
                  opacity: status === "tracking" && selectedAmbulance !== amb.id ? 0.4 : 1,
                }}
                disabled={status === "tracking"}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: amb.color, boxShadow: `0 0 8px ${amb.color}` }} />
                <span className="font-bold text-sm text-white">{amb.label}</span>
                {selectedAmbulance === amb.id && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${amb.color}33`, color: amb.color }}>
                    Đã chọn
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Trạng thái WebSocket */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{
          background: wsStatus === "connected" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
          border: wsStatus === "connected" ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
        }}>
          {wsStatus === "connected"
            ? <Wifi className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
            : <WifiOff className="w-4 h-4 flex-shrink-0" style={{ color: "#ef4444" }} />
          }
          <span className="text-xs font-semibold" style={{ color: wsStatus === "connected" ? "#10b981" : "#ef4444" }}>
            {wsStatus === "connected" ? "Kết nối Server OK · Sẵn sàng truyền" : "Mất kết nối Server · Đang thử lại..."}
          </span>
        </div>

        {/* Nút bấm chính */}
        {status === "idle" || status === "error" ? (
          <button
            onClick={startTracking}
            className="w-full py-5 rounded-2xl font-black text-lg tracking-tight transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
              color: "#0a0f1e",
              boxShadow: "0 8px 32px rgba(34,211,238,0.35)",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin className="w-6 h-6" />
              BẮT ĐẦU TRUYỀN VỊ TRÍ
            </div>
          </button>
        ) : status === "requesting" ? (
          <div className="w-full py-5 rounded-2xl flex items-center justify-center gap-3"
            style={{ background: "rgba(34,211,238,0.1)", border: "2px dashed rgba(34,211,238,0.4)" }}>
            <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span className="font-bold text-cyan-400">Đang xin quyền GPS...</span>
          </div>
        ) : (
          <button
            onClick={stopTracking}
            className="w-full py-5 rounded-2xl font-black text-lg tracking-tight transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
              color: "white",
              boxShadow: "0 8px 32px rgba(239,68,68,0.35)",
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <StopCircle className="w-6 h-6" />
              DỪNG TRUYỀN
            </div>
          </button>
        )}

        {/* Lỗi */}
        {status === "error" && errorMsg && (
          <div className="rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
            <p className="text-sm font-semibold text-red-400">{errorMsg}</p>
          </div>
        )}

        {/* Live info khi đang tracking */}
        {status === "tracking" && lastCoords && (() => {
          // Tính toán ETA và tiến trình
          const DEST_LAT = 21.000;
          const DEST_LNG = 105.840;
          const distDeg = Math.sqrt(Math.pow(lastCoords.lat - DEST_LAT, 2) + Math.pow(lastCoords.lng - DEST_LNG, 2));
          const distanceKm = Number((distDeg * 111).toFixed(1));
          const etaMins = Math.max(1, Math.round((distanceKm / 40) * 60)); // giả định 40km/h
          const progress = Math.min(100, Math.max(0, 100 - (distanceKm / 10) * 100)); // max 10km

          const ambX = 50 + (progress / 100) * 300;
          const ambY = 150 - (progress / 100) * 100;

          return (
            <div className="rounded-2xl p-4 flex flex-col gap-4" style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                  Đang phát trực tiếp
                </span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300">
                  {sentCount} gói
                </span>
              </div>

              {/* Bản đồ trực quan giống hệt Dashboard */}
              <div className="relative w-full aspect-[2/1] rounded-xl bg-[#111827] overflow-hidden shadow-inner">
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)" }}
                />
                <div
                  className="absolute inset-0 opacity-10"
                  style={{ backgroundImage: "radial-gradient(#88E8F2 1px, transparent 1px)", backgroundSize: "24px 24px" }}
                />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200">
                  <path d="M 50 150 Q 120 80 200 100 Q 280 120 350 50" fill="none" stroke="#5eead4" strokeWidth="4" strokeDasharray="8 6" opacity="0.8" />
                  <circle cx="50" cy="150" r="8" fill="#F97316" stroke="#FFF" strokeWidth="2.5" />
                  <circle cx="350" cy="50" r="8" fill="#22C55E" stroke="#FFF" strokeWidth="2.5" />
                  <g transform={`translate(${ambX}, ${ambY})`} style={{ transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1)" }}>
                    <circle cx="0" cy="0" r="14" fill="#67e8f9" opacity="0.3">
                      <animate attributeName="r" values="12;20;12" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="0" cy="0" r="8" fill="#67e8f9" stroke="#FFF" strokeWidth="2.5" />
                  </g>
                </svg>
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Vị trí xuất phát
                </div>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm border border-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> BV Bạch Mai
                </div>
              </div>

              {/* Thông số ETA / Khoảng cách */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 border border-orange-500/30" style={{ background: "rgba(249,115,22,0.1)" }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1 font-bold text-orange-400">ETA</p>
                  <p className="font-black text-orange-400 text-lg">{etaMins} phút</p>
                </div>
                <div className="rounded-xl p-3 border border-slate-500/30" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <p className="text-[10px] uppercase tracking-wider mb-1 font-bold text-slate-400">Khoảng cách</p>
                  <p className="font-black text-white text-lg">{distanceKm} km</p>
                </div>
              </div>

              {/* Tiến trình */}
              <div className="mt-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến trình</span>
                  <span className="text-xs font-black text-white">{Math.round(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${progress}%`, background: "linear-gradient(90deg, #F97316 0%, #67e8f9 100%)" }}
                  />
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Footer */}
      <div className="px-5 py-6 text-center">
        <p className="text-xs" style={{ color: "rgba(100,116,139,0.7)" }}>
          Vị trí được mã hoá và chỉ hiển thị cho Bàn Điều phối nội bộ
        </p>
      </div>
    </div>
  );
}
