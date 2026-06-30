import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
  Eye,
  Settings,
} from "lucide-react";
import { WebAuthnFaceStep } from "../components/auth/WebAuthnFaceStep";
import { useAuth, MOCK_STAFF, type AuthUser, type WorkMode } from "../lib/auth/auth-context";
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
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, #0A9BAD, #34d399)" }}
            >
              <Activity className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
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
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md"
              style={{ background: "linear-gradient(135deg, #0A9BAD, #34d399)" }}
            >
              <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">EyeCU</h1>
            <p className="text-xs text-slate-400 mt-1 font-geist uppercase tracking-wider">
              Ambient Clinical OS
            </p>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Chào mừng trở lại 👋</h2>
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
              <PatientLoginFlow onLogin={(u) => login(u)} />
            ) : (
              <AdminLoginFlow onLogin={(u) => login(u, "admin")} />
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
function StaffLoginFlow({ onLogin }: { onLogin: (user: AuthUser, mode: WorkMode) => void }) {
  const [step, setStep] = useState<"choose" | "scan" | "manual" | "identify" | "pick_shift">(
    "choose",
  );
  const [identifiedUser, setIdentifiedUser] = useState<AuthUser | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (step === "scan") {
      const t = setTimeout(() => setStep("identify"), 2500);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setTimeout(() => {
      setIsAuthenticating(false);
      setStep("identify");
    }, 1500);
  };

  /* STEP 0 — Choose Login Method */
  if (step === "choose") {
    return (
      <div className="space-y-3 animate-in fade-in duration-300">
        <SectionTitle
          icon={Stethoscope}
          title="Đăng nhập Nhân viên"
          subtitle="Chọn phương thức xác thực"
        />
        {[
          {
            id: "scan" as const,
            icon: ScanFace,
            title: "Quét FaceID",
            sub: "Sinh trắc học · Nhanh chóng & An toàn",
            filled: true,
          },
          {
            id: "manual" as const,
            icon: Keyboard,
            title: "Mã Nhân viên & Mật khẩu",
            sub: "Đăng nhập thủ công bằng tài khoản",
            filled: false,
          },
        ].map(({ id, icon: Icon, title, sub, filled }) => (
          <button
            key={id}
            onClick={() => setStep(id)}
            className="w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left group"
            style={{ borderColor: "#f1f5f9" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = ACCENT;
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${ACCENT}08`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "#f1f5f9";
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ backgroundColor: filled ? `${ACCENT}18` : "#f8fafc" }}
            >
              <Icon className="w-5 h-5" style={{ color: filled ? ACCENT_DARK : "#94a3b8" }} />
            </div>
            <div className="flex-1">
              <div className="font-bold text-slate-900 text-sm">{title}</div>
              <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
            </div>
            <ChevronRight
              className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
              style={{ color: `${ACCENT_DARK}80` }}
            />
          </button>
        ))}
      </div>
    );
  }

  /* STEP 1A — FaceID scan */
  if (step === "scan") {
    return (
      <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <SectionTitle icon={ScanFace} title="Quét FaceID" subtitle="Xác thực sinh trắc học eKYC" />
        <div className="relative w-36 h-36 flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full border-2 animate-spin"
            style={{
              borderColor: `${ACCENT}40`,
              borderTopColor: ACCENT,
              animationDuration: "2s",
            }}
          />
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center relative overflow-hidden"
            style={{ backgroundColor: `${ACCENT}15`, border: `2px solid ${ACCENT}30` }}
          >
            <Camera className="w-10 h-10" style={{ color: ACCENT_DARK }} />
            <div
              className="absolute inset-x-0 h-0.5 animate-[scan_2s_ease-in-out_infinite]"
              style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
            />
          </div>
        </div>
        <div>
          <p className="font-bold text-slate-900">Đang nhận diện khuôn mặt</p>
          <p className="text-xs text-slate-400 mt-1">
            Vui lòng đưa khuôn mặt vào giữa khung hình...
          </p>
        </div>
        <button
          onClick={() => setStep("choose")}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mt-2"
        >
          <ArrowLeft className="w-3 h-3" /> Quay lại
        </button>
      </div>
    );
  }

  /* STEP 1B — Manual Login */
  if (step === "manual") {
    return (
      <div className="flex flex-col text-center space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        <SectionTitle
          icon={Keyboard}
          title="Đăng nhập Thủ công"
          subtitle="Sử dụng Mã Nhân viên và Mật khẩu"
        />

        <form onSubmit={handleManualLogin} className="w-full flex flex-col gap-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mã Nhân viên</label>
            <div className="relative">
              <UserCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="VD: BS001"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm uppercase focus:border-[#88E8F2] outline-none"
                disabled={isAuthenticating}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <Keyboard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:border-[#88E8F2] outline-none"
                disabled={isAuthenticating}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isAuthenticating || employeeId.length < 3 || password.length < 3}
            className="mt-2 w-full py-2.5 rounded-lg text-sm font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
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
        </form>

        <button
          onClick={() => setStep("choose")}
          className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors mt-2"
        >
          <ArrowLeft className="w-3 h-3" /> Quay lại chọn phương thức khác
        </button>
      </div>
    );
  }

  /* STEP 2 — Pick staff */
  if (step === "identify") {
    return (
      <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <SectionTitle
          icon={ShieldCheck}
          title="Xác thực thành công"
          subtitle="Chọn tài khoản của bạn để tiếp tục"
        />
        <div className="space-y-2">
          {MOCK_STAFF.map((staff) => (
            <button
              key={staff.id}
              onClick={() => {
                setIdentifiedUser(staff);
                if (staff.title === "ĐD.") {
                  onLogin(staff, "ops");
                } else {
                  setStep("pick_shift");
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
                  className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2"
                  style={{ borderColor: `${ACCENT}40`, backgroundColor: `${ACCENT}15` }}
                >
                  {staff.avatar ? (
                    <img
                      src={staff.avatar}
                      alt={staff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle2 className="w-5 h-5" style={{ color: ACCENT_DARK }} />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {staff.title} {staff.name}
                  </div>
                  <div className="text-xs text-slate-400">{staff.department}</div>
                </div>
              </div>
              <ChevronRight
                className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                style={{ color: ACCENT_DARK }}
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

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
            onClick={() => identifiedUser && onLogin(identifiedUser, mode)}
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

function PatientLoginFlow({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [step, setStep] = useState<
    "form" | "face" | "vneid_face" | "register_face" | "no_credential"
  >("form");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingPatient, setPendingPatient] = useState<RegisteredPatient | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!/^\d{12}$/.test(cccd.trim())) {
      setFormError("Số CCCD phải gồm 12 chữ số");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }

    const found = findPatientByCccdAndPhone(cccd, phone);
    if (!found) {
      setFormError("Chưa tìm thấy tài khoản. Vui lòng đăng ký trước.");
      return;
    }

    if (!found.credentialId) {
      setPendingPatient(found);
      setStep("no_credential");
      return;
    }

    setPendingPatient(found);
    setStep("face");
  };

  const handleVneidClick = () => {
    setFormError(null);
    const demo = findPatientByCccdAndPhone("001203001247", "0912345678");
    if (demo) {
      if (!demo.credentialId) {
        setPendingPatient(demo);
        setStep("no_credential");
        return;
      }
      setPendingPatient(demo);
      setStep("vneid_face");
    } else {
      setFormError("Không tìm thấy tài khoản demo");
    }
  };

  const handleRegisterSuccess = (credentialId?: string) => {
    if (!pendingPatient || !credentialId) return;
    updatePatientCredentialId(pendingPatient.cccd, credentialId);
    onLogin(toAuthUser({ ...pendingPatient, credentialId }));
  };

  if (step === "no_credential" && pendingPatient) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <SectionTitle
          icon={ShieldCheck}
          title="Chưa có sinh trắc học"
          subtitle="Tài khoản chưa đăng ký Face ID"
        />
        <div
          className="rounded-xl p-4 space-y-1"
          style={{ backgroundColor: `${ACCENT}10`, border: `1px solid ${ACCENT}30` }}
        >
          <p className="text-sm font-bold text-slate-900">{pendingPatient.name}</p>
          <p className="text-xs text-slate-500">CCCD: {pendingPatient.cccd}</p>
        </div>
        <p className="text-xs text-slate-500 text-center">
          Bạn muốn đăng ký sinh trắc học (Face ID) để lần sau đăng nhập nhanh hơn?
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setStep("register_face")}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-slate-900 transition-all hover:opacity-90"
            style={{ backgroundColor: ACCENT }}
          >
            <ScanFace className="w-4 h-4" />
            Đăng ký Face ID ngay
          </button>
          <button
            type="button"
            onClick={() => onLogin(toAuthUser(pendingPatient))}
            className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-500 transition-all hover:text-slate-700 border border-slate-200"
          >
            Bỏ qua, vào thẳng
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setPendingPatient(null);
            setStep("form");
          }}
          className="flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Quay lại
        </button>
      </div>
    );
  }

  if (step === "register_face" && pendingPatient) {
    return (
      <WebAuthnFaceStep
        mode="register"
        cccd={pendingPatient.cccd}
        displayName={pendingPatient.name}
        onSuccess={handleRegisterSuccess}
        onBack={() => setStep("no_credential")}
      />
    );
  }

  if (step === "face" && pendingPatient) {
    return (
      <WebAuthnFaceStep
        mode="authenticate"
        cccd={pendingPatient.cccd}
        displayName={pendingPatient.name}
        credentialId={pendingPatient.credentialId}
        title="Quét FaceID eKYC"
        subtitle="WebAuthn · So khớp sinh trắc đã đăng ký"
        onSuccess={() => onLogin(toAuthUser(pendingPatient))}
        onBack={() => {
          setPendingPatient(null);
          setStep("form");
        }}
      />
    );
  }

  if (step === "vneid_face") {
    const vneidPatient =
      pendingPatient ??
      ({
        cccd: "001203001247",
        name: "Nguyễn Văn A",
        credentialId: "",
      } as RegisteredPatient);

    return (
      <WebAuthnFaceStep
        mode="authenticate"
        cccd={vneidPatient.cccd}
        displayName={vneidPatient.name}
        credentialId={vneidPatient.credentialId}
        title="Xác thực FaceID VNeID"
        subtitle="Quét khuôn mặt · Định danh điện tử quốc gia"
        onSuccess={() =>
          onLogin(
            pendingPatient
              ? toAuthUser(pendingPatient)
              : {
                  id: "p-vneid",
                  name: "Nguyễn Văn A",
                  type: "patient",
                  cccd: "001203001247",
                },
          )
        }
        onBack={() => setStep("form")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SectionTitle
        icon={ShieldCheck}
        title="Đăng nhập Bệnh nhân"
        subtitle="Nhập thông tin tài khoản EyeCU"
      />

      <form onSubmit={handleLoginSubmit} className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Số CCCD
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={cccd}
            onChange={(e) => setCccd(e.target.value.replace(/\D/g, "").slice(0, 12))}
            placeholder="001203001247"
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
            Số điện thoại
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Số đã đăng ký tại bệnh viện"
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

        {formError && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
        )}

        <button
          type="submit"
          disabled={!cccd || !phone}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900 transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: ACCENT }}
        >
          Đăng nhập
        </button>
      </form>

      <div className="flex items-center gap-3 py-1">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Hoặc
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <VNeidLoginButton onClick={handleVneidClick} />

      <p className="text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          to="/register"
          className="font-bold transition-colors hover:underline"
          style={{ color: ACCENT_DARK }}
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}

/* ─── ADMIN FLOW ─── */
function AdminLoginFlow({ onLogin }: { onLogin: (user: AuthUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
            placeholder: "Nhập mã nhân viên...",
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
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => {
          if (username && password) {
            onLogin({
              id: "a1",
              name: "Quản trị viên",
              type: "staff",
              title: "Admin",
              department: "IT",
            });
          }
        }}
        disabled={!username || !password}
        className="w-full py-2.5 rounded-xl font-bold text-sm transition-all text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: ACCENT }}
      >
        Đăng nhập
      </button>
    </div>
  );
}
