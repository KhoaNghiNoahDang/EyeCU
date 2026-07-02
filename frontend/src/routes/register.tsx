import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ScanFace,
  Loader2,
  FileText,
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

type Step = "cccd-front" | "cccd-back" | "face" | "processing" | "confirm" | "done";

function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("cccd-front");
  const [formError, setFormError] = useState<string | null>(null);

  // Capture data
  const [cccdFrontUrl, setCccdFrontUrl] = useState<string | null>(null);
  const [cccdBackUrl, setCccdBackUrl] = useState<string | null>(null);
  const [faceUrl, setFaceUrl] = useState<string | null>(null);

  // Extracted data
  const [extractedData, setExtractedData] = useState<any>(null);

  // Additional inputs
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const STEPS: Step[] = ["cccd-front", "cccd-back", "face", "processing", "confirm", "done"];
  const currentIdx = STEPS.indexOf(step);

  const handleProcessExtract = async (faceBase64: string) => {
    setStep("processing");
    setFormError(null);
    try {
      const payload = {
        cccd_front_base64: cccdFrontUrl,
        cccd_back_base64: cccdBackUrl,
        face_base64: faceBase64,
      };

      const res = await fetchApi("/auth/register/patient/ekyc/extract", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (res && res.extracted) {
        setExtractedData(res.extracted);
        setStep("confirm");
      }
    } catch (err: any) {
      setFormError(err.message || "Bóc tách eKYC thất bại. Vui lòng chụp lại thật rõ nét.");
      setStep("cccd-front");
    }
  };

  const handleFinalize = async () => {
    setFormError(null);
    if (password.length < 6) {
      setFormError("Mật khẩu phải từ 6 ký tự trở lên");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...extractedData,
        password,
        phone,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        face_base64: faceUrl
      };

      const res = await fetchApi("/auth/register/patient/ekyc/finalize", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (res && res.message === "Đăng ký thành công") {
        setStep("done");
      }
    } catch (err: any) {
      setFormError(err.message || "Lưu thông tin thất bại");
    } finally {
      setIsSubmitting(false);
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
              Hủy đăng ký
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
                AI eKYC · Tự động bóc tách CCCD
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
            {/* ── Step 1: CCCD Front ── */}
            {step === "cccd-front" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <CreditCard className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Quét CCCD Mặt trước</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 1/4 · Đưa mặt trước thẻ vào khung</p>
                </div>
                
                {formError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 text-center">{formError}</p>
                )}
                
                <CccdCapture 
                  side="front" 
                  onCapture={(dataUrl) => {
                    setCccdFrontUrl(dataUrl);
                    setStep("cccd-back");
                  }} 
                />
              </div>
            )}

            {/* ── Step 2: CCCD Back ── */}
            {step === "cccd-back" && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <CreditCard className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Quét CCCD Mặt sau</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 2/4 · Đưa mặt sau thẻ vào khung</p>
                </div>
                
                <CccdCapture 
                  side="back" 
                  onCapture={(dataUrl) => {
                    setCccdBackUrl(dataUrl);
                    setStep("face");
                  }} 
                />

                <button
                  onClick={() => setStep("cccd-front")}
                  className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Quay lại chụp mặt trước
                </button>
              </div>
            )}

            {/* ── Step 3: Face Liveness ── */}
            {step === "face" && (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <ScanFace className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Chụp khuôn mặt Liveness</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 3/4 · Xác thực chính chủ thẻ CCCD</p>
                </div>
                
                <FaceIdCapture 
                  onCapture={(dataUrl) => {
                    setFaceUrl(dataUrl);
                    handleProcessExtract(dataUrl);
                  }} 
                />
                
                <button
                  onClick={() => setStep("cccd-back")}
                  className="w-full rounded-xl py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  Chụp lại CCCD mặt sau
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
                    Hệ thống đang kiểm tra CCCD, so khớp khuôn mặt và bóc tách dữ liệu 2 mặt. Vui lòng chờ giây lát.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 5: Confirm & Inputs ── */}
            {step === "confirm" && extractedData && (
              <div className="space-y-4 animate-in slide-in-from-bottom-4 h-[65vh] overflow-y-auto pr-1 pb-4">
                <div className="text-center sticky top-0 bg-white/90 backdrop-blur-md pt-2 pb-2 z-10">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <FileText className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Xác nhận thông tin</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 4/4 · Vui lòng kiểm tra kỹ</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 shadow-inner">
                  {[
                    ["Họ và tên", extractedData.name],
                    ["Số CCCD", extractedData.cccd],
                    ["Ngày sinh", extractedData.dob],
                    ["Giới tính", extractedData.gender],
                    ["Thường trú", extractedData.address],
                    ["Quê quán", extractedData.hometown],
                    ["Đặc điểm", extractedData.characteristics],
                    ["Ngày cấp", extractedData.issue_date],
                    ["Nơi cấp", extractedData.issue_place],
                    ["Có giá trị đến", extractedData.valid_until],
                  ].map(([label, value]) => (
                    <div key={label} className="border-b border-slate-200/60 pb-2 last:border-0 last:pb-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 leading-snug">{value || "-"}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-slate-900 text-sm">Nhập thông tin bổ sung:</h3>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">MẬT KHẨU *</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tạo mật khẩu đăng nhập" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">SỐ ĐIỆN THOẠI *</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Số điện thoại liên hệ" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div className="pt-2">
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">NGƯỜI LH KHẨN CẤP</label>
                    <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Tên người liên hệ" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">SĐT LH KHẨN CẤP</label>
                    <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Số điện thoại khẩn cấp" className="w-full rounded-xl border-2 border-slate-100 px-3 py-2.5 text-sm outline-none focus:border-[#0A9BAD]" />
                  </div>
                </div>

                {formError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 text-center">{formError}</p>
                )}

                <button
                  onClick={handleFinalize}
                  disabled={isSubmitting}
                  className="w-full rounded-xl py-3 text-sm font-bold text-slate-900 transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: ACCENT }}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Xác nhận & Hoàn tất Đăng ký
                </button>
              </div>
            )}

            {/* ── Step 6: Done ── */}
            {step === "done" && (
              <div className="space-y-6 py-6 text-center animate-in fade-in zoom-in duration-500">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-slate-900">Đăng ký thành công!</h2>
                  <p className="text-sm text-slate-500 px-4">
                    Hồ sơ bệnh nhân của bạn đã được khởi tạo với dữ liệu xác thực từ thẻ CCCD gắn chip.
                  </p>
                </div>
                <div className="pt-4">
                  <Link
                    to="/login"
                    className="inline-block w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all hover:opacity-90 shadow-lg shadow-[#0d1f2d]/20"
                    style={{ backgroundColor: "#0d1f2d" }}
                  >
                    Đăng nhập ngay
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
