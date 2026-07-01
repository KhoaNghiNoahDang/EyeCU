import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowLeft, CheckCircle2, QrCode, UserPlus } from "lucide-react";
import { FaceIdCapture } from "../components/auth/FaceIdCapture";
import { WebAuthnFaceStep } from "../components/auth/WebAuthnFaceStep";
import { useAuth } from "../lib/auth/auth-context";
import {
  getPatientQrUrl,
  isCccdRegistered,
  registerPatient,
  toAuthUser,
} from "../lib/auth/patient-registry";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const ACCENT = "#88E8F2";
const ACCENT_DARK = "#0A9BAD";

type Step = "form" | "face" | "webauthn" | "done";

function RegisterPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("form");
  const [formError, setFormError] = useState<string | null>(null);
  const [faceUrl, setFaceUrl] = useState<string | null>(null);
  const [registeredPatient, setRegisteredPatient] = useState<ReturnType<
    typeof registerPatient
  > | null>(null);

  const [name, setName] = useState("");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [bhxh, setBhxh] = useState("");

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const handleFormNext = () => {
    setFormError(null);
    if (name.trim().length < 2) {
      setFormError("Vui lòng nhập họ tên đầy đủ");
      return;
    }
    if (!/^\d{12}$/.test(cccd.trim())) {
      setFormError("Số CCCD phải gồm 12 chữ số");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      setFormError("Số điện thoại không hợp lệ");
      return;
    }
    if (isCccdRegistered(cccd)) {
      setFormError("CCCD đã đăng ký. Hãy đăng nhập hoặc dùng số khác.");
      return;
    }
    setStep("face");
  };

  const handleWebAuthnSuccess = (credentialId?: string) => {
    if (!credentialId) return;
    try {
      const patient = registerPatient({
        cccd: cccd.trim(),
        name: name.trim(),
        phone: phone.trim(),
        bhxh_code: bhxh.trim() || null,
        avatar_url: faceUrl,
        credentialId,
      });
      setRegisteredPatient(patient);
      setStep("done");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đăng ký thất bại");
      setStep("form");
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
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition-colors hover:text-slate-800"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại đăng nhập
          </Link>

          <div className="flex items-center gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-md"
              style={{ background: "linear-gradient(135deg, #0A9BAD, #34d399)" }}
            >
              <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Đăng ký bệnh nhân</h1>
              <p className="text-[10px] font-geist uppercase tracking-wider text-slate-500">
                EyeCU · users · avatar_url
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-1.5">
            {(["form", "face", "webauthn", "done"] as Step[]).map((s, i) => (
              <div
                key={s}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{
                  backgroundColor:
                    ["form", "face", "webauthn", "done"].indexOf(step) >= i
                      ? ACCENT_DARK
                      : "#e2e8f0",
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
            {step === "form" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <UserPlus className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Thông tin cá nhân</h2>
                  <p className="mt-1 text-sm text-slate-500">Khớp bảng users · role patient</p>
                </div>

                {[
                  { label: "Họ và tên", value: name, set: setName, placeholder: "Nguyễn Văn A" },
                  { label: "Số CCCD", value: cccd, set: setCccd, placeholder: "001203001247" },
                  {
                    label: "Số điện thoại",
                    value: phone,
                    set: setPhone,
                    placeholder: "0912 345 678",
                  },
                  {
                    label: "Mã thẻ BHYT (tuỳ chọn)",
                    value: bhxh,
                    set: setBhxh,
                    placeholder: "DN4015002345678",
                  },
                ].map(({ label, value, set, placeholder }) => (
                  <div key={label}>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
                      {label}
                    </label>
                    <input
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder={placeholder}
                      className="w-full rounded-xl border-2 px-3 py-2.5 text-sm outline-none transition-all"
                      style={{ borderColor: "#f1f5f9" }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = ACCENT;
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#f1f5f9";
                      }}
                    />
                  </div>
                ))}

                {formError && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{formError}</p>
                )}

                <button
                  type="button"
                  onClick={handleFormNext}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900"
                  style={{ backgroundColor: ACCENT }}
                >
                  Tiếp tục · Chụp khuôn mặt
                </button>
              </div>
            )}

            {step === "face" && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="font-bold text-slate-900">Ghi nhận khuôn mặt</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Lưu vào avatar_url · dùng so khớp VNPT Face
                  </p>
                </div>
                <FaceIdCapture capturedUrl={faceUrl} onCapture={(url) => setFaceUrl(url || null)} />
                <button
                  type="button"
                  onClick={() => setStep("webauthn")}
                  disabled={!faceUrl}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900 disabled:opacity-40"
                  style={{ backgroundColor: ACCENT }}
                >
                  Tiếp tục · Đăng ký Face ID
                </button>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="w-full text-xs text-slate-400 hover:text-slate-700"
                >
                  Quay lại
                </button>
              </div>
            )}

            {step === "webauthn" && (
              <WebAuthnFaceStep
                mode="register"
                cccd={cccd.trim()}
                displayName={name.trim()}
                onSuccess={handleWebAuthnSuccess}
                onBack={() => setStep("face")}
              />
            )}

            {step === "done" && (
              <div className="space-y-5 text-center">
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
                  style={{ backgroundColor: "#ecfdf5" }}
                >
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Đăng ký thành công!</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Mã QR riêng trên sổ khám bệnh — quét bằng điện thoại để đăng nhập nhanh
                  </p>
                </div>

                {registeredPatient && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-2 flex items-center justify-center gap-2 text-xs font-semibold text-slate-600">
                      <QrCode className="h-4 w-4" />
                      QR sổ khám bệnh (demo)
                    </div>
                    <p className="break-all font-mono text-[10px] text-slate-500">
                      {getPatientQrUrl(registeredPatient)}
                    </p>
                    <p className="mt-2 text-[10px] text-slate-400">
                      Quét link này → Face ID → tự động đăng nhập
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (registeredPatient) {
                      login(toAuthUser(registeredPatient));
                      navigate({ to: "/" });
                    } else {
                      navigate({ to: "/login" });
                    }
                  }}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900"
                  style={{ backgroundColor: ACCENT }}
                >
                  {registeredPatient ? "Vào cổng bệnh nhân" : "Đi tới đăng nhập"}
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-slate-400">
            Sinh trắc học được bảo vệ bởi{" "}
            <span className="font-bold" style={{ color: ACCENT_DARK }}>
              WebAuthn · Face ID
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
