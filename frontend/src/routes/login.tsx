import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Activity,
  Camera,
  ScanFace,
  CreditCard,
  ChevronRight,
  UserCircle2,
  Stethoscope,
  Siren,
  ShieldCheck,
  Keyboard,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Users,
  Settings,
  Smartphone,
  X,
  Eye,
} from "lucide-react";
import { WebAuthnFaceStep } from "../components/auth/WebAuthnFaceStep";
import { useAuth, type AuthUser, type WorkMode } from "../lib/auth/auth-context";
import { fetchApi } from "../lib/api/client";
import { useQuery } from "@tanstack/react-query";
import {
  ensureDemoPatient,
  findPatientByCccdAndPhone,
  toAuthUser,
  updatePatientCredentialId,
  type RegisteredPatient,
} from "../lib/auth/patient-registry";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

const ACCENT = "#88E8F2";
const ACCENT_DARK = "#0A9BAD";

function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"staff" | "patient" | "admin">("staff");

  useEffect(() => {
    ensureDemoPatient();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div
      className="flex min-h-screen font-hanken"
      style={{
        background: "linear-gradient(135deg, #f0fdff 0%, #e0f7fa 30%, #f0f9ff 60%, #ecfdf5 100%)",
      }}
    >
      {/* LEFT PANEL — Thông tin hệ thống */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden p-12">
        {/* Decorative blobs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #88E8F2 0%, transparent 65%)" }}
        />
        <div
          className="absolute -bottom-40 -right-20 w-[480px] h-[480px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #34d399 0%, transparent 65%)" }}
        />
        <div
          className="absolute top-1/2 right-0 w-64 h-64 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 65%)" }}
        />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="EyeCU Logo"
              className="w-11 h-11 rounded-2xl shadow-md object-contain"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">EyeCU</h1>
              <p className="text-[10px] tracking-widest font-geist uppercase text-slate-500">
                Ambient Clinical OS
              </p>
            </div>
          </div>

          {/* Main tagline */}
          <div className="mt-auto mb-10 space-y-7">
            <div className="space-y-2">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold font-geist uppercase tracking-wider"
                style={{ backgroundColor: "rgba(10,155,173,0.1)", color: "#0A9BAD" }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Hệ thống y tế thế hệ mới
              </div>
              <h2 className="text-4xl font-bold leading-snug text-slate-900">
                Nhận thức.
                <br />
                <span style={{ color: "#0A9BAD" }}>Tức thì.</span>
              </h2>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                Hệ sinh thái AI Camera + IoT + Voice EMR giúp kíp cấp cứu phản ứng nhanh hơn bao giờ
                hết.
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 max-w-sm">
              {[
                { icon: Eye, val: "38+", label: "Camera AI", color: "#0A9BAD" },
                { icon: Users, val: "15", label: "Khoa phòng", color: "#6366f1" },
                { icon: Zap, val: "24/7", label: "Realtime", color: "#10b981" },
              ].map(({ icon: Icon, val, label, color }) => (
                <div
                  key={label}
                  className="p-3.5 rounded-2xl text-center border"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.65)",
                    borderColor: "rgba(255,255,255,0.9)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ backgroundColor: color + "18" }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div className="text-lg font-bold text-slate-900 leading-none">{val}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 font-geist">{label}</div>
                </div>
              ))}
            </div>

            {/* Features list */}
            <div className="space-y-2">
              {[
                { label: "VNPT eKYC · FaceID sinh trắc học" },
                { label: "SmartVoice · Ghi bệnh án bằng giọng nói" },
                { label: "SmartVision · Camera AI nhận diện té ngã" },
              ].map(({ label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "rgba(10,155,173,0.12)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#0A9BAD" }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-geist">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — Form đăng nhập */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile logo */}
          <div className="text-center lg:hidden mb-6">
            <img 
              src="/logo.png" 
              alt="EyeCU Logo"
              className="w-14 h-14 rounded-2xl mx-auto mb-3 shadow-md object-contain"
            />
            <h1 className="text-2xl font-bold text-slate-900">EyeCU</h1>
            <p className="text-xs text-slate-400 mt-1 font-geist uppercase tracking-wider">
              Ambient Clinical OS
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Chào mừng trở lại </h2>
            <p className="text-sm text-slate-500">Chọn phương thức đăng nhập phù hợp với bạn</p>
          </div>

          {/* Tabs */}
          <div
            className="flex p-1 rounded-2xl gap-1"
            style={{
              backgroundColor: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(10,155,173,0.15)",
            }}
          >
            {(
              [
                { id: "staff", label: "Nhân viên Y tế", icon: Stethoscope },
                { id: "patient", label: "Bệnh nhân", icon: ShieldCheck },
                { id: "admin", label: "Quản trị", icon: Settings },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all"
                style={
                  activeTab === id
                    ? {
                        background: "linear-gradient(135deg, #0A9BAD, #0891b2)",
                        color: "white",
                        boxShadow: "0 2px 8px rgba(10,155,173,0.3)",
                      }
                    : { color: "#64748b" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Card */}
          <div
            className="rounded-3xl p-7"
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 40px rgba(10,155,173,0.08), 0 2px 12px rgba(0,0,0,0.06)",
            }}
          >
            {activeTab === "staff" ? (
              <StaffLoginFlow onLogin={(u, m) => login(u, m)} />
            ) : activeTab === "patient" ? (
              <PatientLoginFlow onLogin={(u, _token) => login(u, "patient")} />
            ) : (
              <AdminLoginFlow onLogin={(u, _token) => login(u, "admin")} />
            )}
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Được bảo vệ bởi{" "}
            <span className="font-bold" style={{ color: "#0A9BAD" }}>
              VNPT eKYC · SmartCA
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Shared: Section header ─── */
function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Eye;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center space-y-1 mb-5">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
        style={{ backgroundColor: `${ACCENT}22` }}
      >
        <Icon className="w-7 h-7" style={{ color: ACCENT_DARK }} />
      </div>
      <h3 className="font-bold text-slate-900 text-base">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

/* ─── STAFF FLOW ─── */
function StaffLoginFlow({ onLogin }: { onLogin: (user: AuthUser, mode: WorkMode, token?: string) => void }) {
  const [step, setStep] = useState<"scan" | "manual" | "identify" | "pick_shift">(
    "manual",
  );
  const [identifiedUser, setIdentifiedUser] = useState<AuthUser | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    if (step !== "scan") return;
    let cancelled = false;

    async function startCamera() {
      setCameraError(null);
      setCameraReady(false);
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("Thiết bị không hỗ trợ camera. Hãy dùng mã nhân viên để đăng nhập.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" }, width: { ideal: 320 }, height: { ideal: 240 } },
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
          setCameraReady(true);
        }
      } catch {
        if (!cancelled) setCameraError("Không mở được camera. Hãy cấp quyền trong cài đặt.");
      }
    }

    void startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [step, stopCamera]);

  const { data: staffList = [], isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => fetchApi("/auth/staff"),
  });

  const captureAndIdentify = useCallback(async () => {
    if (!videoRef.current) return;
    
    // Capture image from video
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.8);

    stopCamera();
    setIsAuthenticating(true);
    
    try {
      const res = await fetchApi("/auth/login/face/staff", {
        method: "POST",
        body: JSON.stringify({ face_base64: base64Image }),
      });

      if (res.access_token) {
        sessionStorage.setItem("eyecu_token", res.access_token);
        const me = await fetchApi("/auth/me");
        setIdentifiedUser(me as AuthUser);
        
        // Nếu là Điều dưỡng thì vào thẳng ops, còn lại chọn ca
        if (me.title === "ĐD.") {
          onLogin(me as AuthUser, "ops");
        } else {
          setStep("pick_shift");
        }
      }
    } catch (err: any) {
      alert(err.message || "Không tìm thấy dữ liệu khuôn mặt. Vui lòng đăng nhập thủ công.");
      setStep("manual");
    } finally {
      setIsAuthenticating(false);
    }
  }, [stopCamera, onLogin]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    try {
      // Create x-www-form-urlencoded
      const body = new URLSearchParams();
      body.append("username", employeeId);
      body.append("password", password);

      const res = await fetchApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (res.access_token) {
        // Fetch current user details
        sessionStorage.setItem("eyecu_token", res.access_token);
        const me = await fetchApi("/auth/me");
        setIdentifiedUser(me as AuthUser);
        setStep("pick_shift");
      }
    } catch (err: any) {
      alert(err.message || "Đăng nhập thất bại");
    } finally {
      setIsAuthenticating(false);
    }
  };

  /* STEP 0 — Choose Login Method removed */

  /* STEP 1A — FaceID scan (real camera) */
  if (step === "scan") {
    return (
      <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <SectionTitle icon={ScanFace} title="Quét FaceID" subtitle="Xác thực sinh trắc học eKYC" />
        <div
          className="relative w-40 h-40 mx-auto overflow-hidden rounded-full border-2"
          style={{ borderColor: cameraReady ? ACCENT : `${ACCENT}40` }}
        >
          {cameraError ? (
            <div className="flex h-full w-full items-center justify-center bg-slate-100">
              <Camera className="w-10 h-10 text-slate-400" />
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                  <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin" />
                </div>
              )}
              {cameraReady && (
                <div
                  className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
                    animation: "face-scan 2s ease-in-out infinite",
                  }}
                />
              )}
            </>
          )}
          <style>{`@keyframes face-scan { 0%, 100% { transform: translateY(-30px); opacity: 0.4; } 50% { transform: translateY(30px); opacity: 1; } }`}</style>
        </div>
        <div>
          <p className="font-bold text-slate-900">
            {cameraError
              ? "Không mở được camera"
              : cameraReady
                ? "Đang nhận diện khuôn mặt"
                : "Đang khởi động camera..."}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {cameraError
              ? "Hãy dùng mã nhân viên để đăng nhập"
              : "Vui lòng đưa khuôn mặt vào giữa khung hình..."}
          </p>
        </div>
        {cameraError ? (
          <button
            onClick={() => {
              setCameraError(null);
              setStep("pick_shift");
            }}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mt-2"
          >
            <ArrowLeft className="w-3 h-3" /> Quay lại
          </button>
        ) : (
          <div className="flex gap-2 w-full">
            <button
              onClick={() => {
                stopCamera();
                setStep("pick_shift");
              }}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="w-3 h-3" /> Hủy
            </button>
            <button
              onClick={captureAndIdentify}
              disabled={!cameraReady || isAuthenticating}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-slate-900 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ backgroundColor: ACCENT }}
            >
              {isAuthenticating ? (
                <>
                  <span className="w-4 h-4 border-2 border-t-transparent border-slate-900 rounded-full animate-spin" />{" "}
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận khuôn mặt"
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* STEP 1B — Manual Login + Fast Login */
  if (step === "manual") {
    return (
      <div className="flex flex-col text-center space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <SectionTitle
          icon={Stethoscope}
          title="Đăng nhập Nhân viên"
          subtitle="Nhập thông tin tài khoản chuyên môn"
        />

        <form onSubmit={handleManualLogin} className="w-full flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">MÃ NHÂN VIÊN</label>
            <div className="relative">
              <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                placeholder="Ví dụ: BS-1000"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm uppercase focus:border-[#0d1f2d] outline-none transition-colors"
                disabled={isAuthenticating}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">MẬT KHẨU</label>
            <div className="relative">
              <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#0d1f2d] outline-none transition-colors"
                disabled={isAuthenticating}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isAuthenticating || employeeId.length < 3 || password.length < 3}
            className="mt-2 w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
            style={{ backgroundColor: "#0d1f2d" }}
          >
            {isAuthenticating ? (
              <>
                <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />{" "}
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-geist">Hoặc</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          type="button"
          onClick={() => setStep("scan")}
          className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
        >
          <div className="min-w-0 text-left leading-snug">
            <p className="text-[13px] font-semibold text-slate-900">Đăng nhập nhanh bằng FaceID</p>
            <p className="text-[11px] text-slate-500 font-geist">Xác thực sinh trắc học an toàn</p>
          </div>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${ACCENT}18` }}
          >
            <ScanFace className="w-5 h-5" style={{ color: ACCENT_DARK }} />
          </div>
        </button>
      </div>
    );
  }

  /* STEP 2 — Identify step removed */

  /* STEP 3 — Pick shift */
  const shifts: { mode: WorkMode; icon: typeof Eye; label: string; sub: string }[] = [
    { mode: "ops", icon: Eye, label: "Trực Cấp cứu", sub: "Camera AI · Điều phối xe · Báo động" },
    {
      mode: "clinician",
      icon: Stethoscope,
      label: "Khám Lâm sàng",
      sub: "Voice EMR · Hồ sơ bệnh án · Ký số",
    },
    {
      mode: "ems",
      icon: Siren,
      label: "Cấp cứu Ngoại viện",
      sub: "Quét BN trên xe · GPS · Liên lạc BV",
    },
  ];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div
        className="flex items-center gap-3 p-3 rounded-xl"
        style={{ backgroundColor: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
      >
        <div
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
          style={{ borderColor: ACCENT }}
        >
          {identifiedUser?.avatar ? (
            <img
              src={identifiedUser.avatar}
              alt={identifiedUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: `${ACCENT}20` }}
            >
              <UserCircle2 className="w-5 h-5" style={{ color: ACCENT_DARK }} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="font-bold text-slate-900 text-sm">
            Xin chào, {identifiedUser?.title} {identifiedUser?.name}
          </div>
          <div className="text-xs text-slate-500">{identifiedUser?.department}</div>
        </div>
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT_DARK }} />
      </div>

      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider font-geist">
        Hôm nay bạn làm ca nào?
      </p>

      <div className="space-y-2.5">
        {shifts.map(({ mode, icon: Icon, label, sub }) => (
          <button
            key={mode}
            onClick={() => {
              if (identifiedUser) {
                // Fetch auth token by employee_id when picking shift from staff list
                // Since this step happens after "identify" (clicking from list without password),
                // we should either skip password for demo or require it. For now, use the mock login
                const loginToken = sessionStorage.getItem("eyecu_token") || "demo_token";
                onLogin(identifiedUser, mode, loginToken);
              }
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left group hover:scale-[1.01]"
            style={{ borderColor: "#f1f5f9" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${ACCENT}0A`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f1f5f9";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                style={{ backgroundColor: `${ACCENT}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: ACCENT_DARK }} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 group-hover:text-[#0A9BAD] transition-colors">
                  {label}
                </p>
                <p className="text-[10px] text-slate-500 font-geist tracking-wider mt-0.5">{sub}</p>
              </div>
            </div>
            <ArrowLeft
              className="w-4 h-4 rotate-180 transition-transform group-hover:translate-x-1"
              style={{ color: ACCENT_DARK }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── PATIENT FLOW ─── */
function VNeidLoginButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm transition-all hover:border-slate-300 hover:shadow-md active:scale-[0.99]"
    >
      <div className="min-w-0 text-left leading-snug">
        <p className="text-[13px] font-semibold text-slate-900">Đăng nhập bằng tài khoản</p>
        <p className="text-[13px] font-semibold text-slate-900">Định danh điện tử</p>
      </div>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl shadow-sm ring-1 ring-emerald-100">
        <img
          src="/vneid-logo.png"
          alt="Logo VNeID"
          className="h-full w-full object-contain"
          draggable={false}
        />
      </div>
    </button>
  );
}


function PatientLoginFlow({ onLogin }: { onLogin: (user: AuthUser, token?: string) => void }) {
  const [cccd, setCccd] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isCapturingFace && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCapturingFace]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCapturingFace(false);
  };

  const startCamera = async () => {
    try {
      setFormError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" }, width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      });
      streamRef.current = stream;
      setIsCapturingFace(true);
    } catch (e) {
      alert("Không thể mở camera");
    }
  };

  const captureFaceAndLogin = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const base64Image = canvas.toDataURL("image/jpeg", 0.8);
    stopCamera();

    try {
      const res = await fetchApi("/auth/login/face/patient", {
        method: "POST",
        body: JSON.stringify({ face_base64: base64Image })
      });
      if (res.access_token) {
        sessionStorage.setItem("eyecu_token", res.access_token);
        const me = await fetchApi("/auth/me");
        onLogin(me as AuthUser, res.access_token);
      }
    } catch (err: any) {
      setFormError(err.message || "Đăng nhập bằng khuôn mặt thất bại");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!/^\d{12}$/.test(cccd.trim())) {
      setFormError("Số CCCD phải gồm 12 chữ số");
      return;
    }

    try {
      const res = await fetchApi("/auth/login/patient", {
        method: "POST",
        body: JSON.stringify({ cccd: cccd.trim(), password })
      });
      if (res.access_token) {
        sessionStorage.setItem("eyecu_token", res.access_token);
        const me = await fetchApi("/auth/me");
        onLogin(me as AuthUser, res.access_token);
      }
    } catch (err: any) {
      setFormError(err.message || "Sai CCCD hoặc mật khẩu");
    }
  };

  const handleVneidClick = () => {
    // VNeID dummy login for now, as required
    onLogin({
      id: "p-vneid",
      name: "Bệnh nhân VNeID",
      type: "patient",
      cccd: "001203001247",
    }, "dummy_token");
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={ShieldCheck}
        title="Đăng nhập Bệnh nhân"
        subtitle="Hệ thống quản lý và chăm sóc sức khỏe nhãn khoa EyeCU"
      />

      {isCapturingFace ? (
        <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-xl bg-black aspect-video border-2 border-[#0A9BAD] shadow-lg">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <div className="absolute inset-0 border-[3px] border-[#0A9BAD]/30 m-4 rounded-lg"></div>
          <button onClick={captureFaceAndLogin} className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0A9BAD] hover:bg-[#0891b2] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
            Xác thực khuôn mặt
          </button>
          <button onClick={stopCamera} className="absolute top-2 right-2 bg-slate-900/50 text-white p-1.5 rounded-full hover:bg-red-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleLoginSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              SỐ CCCD
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={cccd}
              onChange={(e) => setCccd(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="Nhập 12 số căn cước"
              className="w-full rounded-xl border-2 px-3 py-2.5 text-sm outline-none transition-all"
              style={{ borderColor: "#f1f5f9" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = ACCENT;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              MẬT KHẨU
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              className="w-full rounded-xl border-2 px-3 py-2.5 text-sm outline-none transition-all"
              style={{ borderColor: "#f1f5f9" }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = ACCENT;
                e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#f1f5f9";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-[11px] font-medium text-slate-500 hover:text-[#0d1f2d] hover:underline"
            >
              Quên mật khẩu?
            </button>
          </div>

          {formError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={!cccd || !password}
              className="flex-1 rounded-xl py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: "#0d1f2d" }}
            >
              ĐĂNG NHẬP
            </button>
            <button
              type="button"
              onClick={startCamera}
              className="flex items-center justify-center w-12 h-12 rounded-xl border-2 border-slate-200 text-slate-500 hover:text-[#0d1f2d] hover:border-[#0d1f2d] transition-all shrink-0"
            >
              <ScanFace className="w-6 h-6" />
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-3 py-2 mt-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          HOẶC
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <VNeidLoginButton onClick={handleVneidClick} />

      <p className="text-center text-sm text-slate-500 pt-4">
        Bạn chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="font-bold transition-colors hover:underline text-[#0A9BAD]"
        >
          Đăng ký ngay
        </Link>
      </p>

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative animate-in zoom-in-95">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
            <h3 className="mb-2 text-lg font-bold text-slate-900 text-center">Quên mật khẩu?</h3>
            <p className="mb-6 text-sm text-slate-500 text-center">
              Vui lòng chọn phương thức xác thực lại để lấy lại mật khẩu của bạn.
            </p>
            <div className="space-y-3">
              <button
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-[#0A9BAD] hover:bg-[#0A9BAD]/5 transition-all text-left"
                onClick={() => { alert("Chức năng đang phát triển!"); setShowForgotModal(false); }}
              >
                <div className="bg-[#0A9BAD]/10 p-2 rounded-lg text-[#0A9BAD]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Xác thực qua Số điện thoại</div>
                  <div className="text-xs text-slate-500">Nhận mã OTP qua SMS</div>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-3 rounded-xl border border-slate-200 p-4 hover:border-red-500 hover:bg-red-50 transition-all text-left"
                onClick={() => { alert("Chức năng đang phát triển!"); setShowForgotModal(false); }}
              >
                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">Xác thực qua VNeID</div>
                  <div className="text-xs text-slate-500">Ứng dụng định danh điện tử</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── ADMIN FLOW ─── */
function AdminLoginFlow({ onLogin }: { onLogin: (user: AuthUser, token?: string) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;
    setIsAuthenticating(true);
    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const res = await fetchApi("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      if (res.access_token) {
        sessionStorage.setItem("eyecu_token", res.access_token);
        const me = await fetchApi("/auth/me");
        onLogin(me as AuthUser, res.access_token);
      }
    } catch (err: any) {
      alert(err.message || "Đăng nhập thất bại");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={Settings}
        title="Đăng nhập Quản trị"
        subtitle="Dành cho Quản trị viên hệ thống"
      />
      <div className="space-y-3">
        {[
          {
            label: "Mã Nhân viên",
            type: "text",
            value: username,
            onChange: setUsername,
            placeholder: "VD: ADMIN001",
          },
          {
            label: "Mật khẩu",
            type: "password",
            value: password,
            onChange: setPassword,
            placeholder: "Nhập mật khẩu...",
          },
        ].map(({ label, type, value, onChange, placeholder }) => (
          <div key={label}>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 font-geist uppercase tracking-wider">
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2.5 border-2 rounded-xl text-sm outline-none transition-all"
              style={{ borderColor: "#f1f5f9" }}
              onFocus={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = ACCENT;
                (e.currentTarget as HTMLInputElement).style.boxShadow = `0 0 0 3px ${ACCENT}20`;
              }}
              onBlur={(e) => {
                (e.currentTarget as HTMLInputElement).style.borderColor = "#f1f5f9";
                (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
              }}
              disabled={isAuthenticating}
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleLogin}
        disabled={!username || !password || isAuthenticating}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: ACCENT }}
      >
        {isAuthenticating ? (
          <>
            <span className="w-4 h-4 border-2 border-t-transparent border-slate-900 rounded-full animate-spin" />{" "}
            Đang đăng nhập...
          </>
        ) : (
          "Đăng nhập"
        )}
      </button>
    </div>
  );
}
