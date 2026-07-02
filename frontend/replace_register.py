new_register_tsx = """import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  UserPlus,
  ScanFace,
  Loader2,
} from "lucide-react";
import { CccdCapture } from "../components/auth/CccdCapture";
import { FaceIdCapture } from "../components/auth/FaceIdCapture";
import { useAuth } from "../lib/auth/auth-context";
import { fetchApi } from "../lib/api/client";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const ACCENT = "#88E8F2";
const ACCENT_DARK = "#0A9BAD";

type Step = "info" | "cccd" | "face" | "processing" | "done";

function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("info");
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Capture data
  const [cccdFrontUrl, setCccdFrontUrl] = useState<string | null>(null);
  const [faceUrl, setFaceUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const STEPS: Step[] = ["info", "cccd", "face", "processing", "done"];
  const currentIdx = STEPS.indexOf(step);

  const handleInfoNext = () => {
    setFormError(null);
    if (name.trim().length < 2) {
      setFormError("Vui lòng nhập họ tên đầy đủ");
      return;
    }
    if (password.length < 6) {
      setFormError("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    if (phone.replace(/\\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }
    setStep("cccd");
  };

  const handleProcessEkyc = async (faceBase64: string) => {
    setStep("processing");
    try {
      const payload = {
        name: name.trim(),
        password: password,
        phone: phone.trim(),
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_phone: emergencyPhone.trim(),
        cccd_front_base64: cccdFrontUrl,
        face_base64: faceBase64,
      };

      const res = await fetchApi("/auth/register/patient/ekyc", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (res && res.message === "Đăng ký thành công") {
        setStep("done");
      }
    } catch (err: any) {
      setFormError(err.message || "Đăng ký eKYC thất bại");
      setStep("info");
    }
  };

  return (
    <div
      className="flex min-h-screen font-hanken"
      style={{
        background: "linear-gradient(135deg, #f0fdff 0%, #e0f7fa 30%, #f0f9ff 60%, #ecfdf5 100%)",
      }}
    >
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px] space-y-6">
          {step !== "processing" && step !== "done" && (
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại đăng nhập
            </Link>
          )}

          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="EyeCU Logo"
              className="h-11 w-11 rounded-2xl shadow-md object-contain"
            />
            <div>
              <h1 className="text-xl font-bold text-slate-900">Đăng ký bệnh nhân</h1>
              <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">
                EyeCU · eKYC · Face Match
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor: currentIdx >= i ? ACCENT_DARK : "#e2e8f0",
                }}
              />
            ))}
          </div>

          <div
            className="rounded-3xl p-7"
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 40px rgba(10,155,173,0.08)",
            }}
          >
            {/* ── Step 1: Personal Info ── */}
            {step === "info" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <UserPlus className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Thông tin cá nhân</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 1/5 · Nhập thông tin cơ bản</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">HỌ VÀ TÊN</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyễn Văn A" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">MẬT KHẨU</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tạo mật khẩu" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">SỐ ĐIỆN THOẠI</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0912 345 678" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">NGƯỜI LH KHẨN CẤP (TÙY CHỌN)</label>
                    <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Nguyễn Thị B" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">SĐT LH KHẨN CẤP (TÙY CHỌN)</label>
                    <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="0987 654 321" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                </div>

                {formError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
                )}

                <button
                  onClick={handleInfoNext}
                  className="w-full rounded-xl py-3 text-sm font-bold text-slate-900 transition-all hover:opacity-90"
                  style={{ backgroundColor: ACCENT }}
                >
                  Tiếp tục · Chụp CCCD & Khuôn mặt
                </button>
              </div>
            )}

            {/* ── Step 2: CCCD Front ── */}
            {step === "cccd" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <CreditCard className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Quét Căn cước công dân</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 2/5 · Chụp mặt trước rõ nét</p>
                </div>
                
                <CccdCapture 
                  side="front" 
                  onCapture={(dataUrl) => {
                    setCccdFrontUrl(dataUrl);
                    setStep("face");
                  }} 
                />
                
                <button
                  onClick={() => setStep("info")}
                  className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Quay lại
                </button>
              </div>
            )}

            {/* ── Step 3: Face Liveness ── */}
            {step === "face" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <ScanFace className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Chụp khuôn mặt Liveness</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 3/5 · Xác thực chính chủ thẻ CCCD</p>
                </div>
                
                <FaceIdCapture 
                  onCapture={(dataUrl) => {
                    setFaceUrl(dataUrl);
                    handleProcessEkyc(dataUrl);
                  }} 
                />
                
                <button
                  onClick={() => setStep("cccd")}
                  className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Chụp lại CCCD
                </button>
              </div>
            )}

            {/* ── Step 4: Processing ── */}
            {step === "processing" && (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <Loader2 className="h-12 w-12 animate-spin" style={{ color: ACCENT_DARK }} />
                <div className="text-center">
                  <h2 className="font-bold text-slate-900 text-lg">Đang xác thực eKYC...</h2>
                  <p className="mt-2 text-sm text-slate-500 max-w-[250px]">
                    Quá trình kiểm tra Liveness, so khớp khuôn mặt và bóc tách dữ liệu OCR đang diễn ra. Vui lòng không đóng trình duyệt.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 5: Done ── */}
            {step === "done" && (
              <div className="space-y-6 py-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Đăng ký thành công!</h2>
                  <p className="text-sm text-slate-500 px-4">
                    Tài khoản của bạn đã được xác thực eKYC và kích hoạt. Bạn có thể đăng nhập ngay để sử dụng dịch vụ.
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-block w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg shadow-[#0d1f2d]/20"
                    style={{ backgroundColor: "#0d1f2d" }}
                  >
                    Chuyển đến Đăng nhập
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"""

with open('src/routes/register.tsx', 'w', encoding='utf-8') as f:
    f.write(new_register_tsx)

print("Replaced register.tsx!")
