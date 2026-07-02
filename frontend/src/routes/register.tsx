import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileText,
  QrCode,
  UserPlus,
} from "lucide-react";
import { CccdCapture } from "../components/auth/CccdCapture";
import { FaceIdCapture } from "../components/auth/FaceIdCapture";
import { WebAuthnFaceStep } from "../components/auth/WebAuthnFaceStep";
import { useAuth } from "../lib/auth/auth-context";
import { fetchApi } from "../lib/api/client";
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

type Step = "info" | "cccd-front" | "cccd-back" | "face-match" | "webauthn" | "done";

function RegisterPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>("info");
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [cccd, setCccd] = useState("");
  const [phone, setPhone] = useState("");
  const [bhxh, setBhxh] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  // Capture data
  const [cccdFrontUrl, setCccdFrontUrl] = useState<string | null>(null);
  const [cccdBackUrl, setCccdBackUrl] = useState<string | null>(null);
  const [faceUrl, setFaceUrl] = useState<string | null>(null);

  const [registeredPatient, setRegisteredPatient] = useState<ReturnType<
    typeof registerPatient
  > | null>(null);

  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/" });
  }, [isAuthenticated, navigate]);

  const STEPS: Step[] = ["info", "cccd-front", "cccd-back", "face-match", "webauthn", "done"];
  const currentIdx = STEPS.indexOf(step);

  const handleInfoNext = () => {
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
    setStep("cccd-front");
  };

  const handleFaceMatchConfirm = () => {
    if (!faceUrl) return;
    setStep("webauthn");
  };

  const handleWebAuthnSuccess = async (credentialId?: string) => {
    try {
      const payload = {
        cccd: cccd.trim(),
        name: name.trim(),
        phone: phone.trim(),
        bhxh_code: bhxh.trim() || "",
        avatar_url: faceUrl || "",
        cccd_front_url: cccdFrontUrl || "",
        cccd_back_url: cccdBackUrl || "",
        emergency_contact_name: emergencyName.trim() || "",
        emergency_contact_phone: emergencyPhone.trim() || "",
      };

      const res = await fetchApi("/patient/register", {
        method: "POST",
        body: payload,
      });

      if (res.status === "error") {
        throw new Error(res.message || "Đăng ký thất bại");
      }

      setRegisteredPatient({
        id: res.patient_id,
        ...payload,
        credentialId: credentialId ?? "",
        qrToken: res.qr_token || "mock-qr",
        createdAt: new Date().toISOString(),
      } as any);
      setStep("done");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đăng ký thất bại");
      setStep("info");
    }
  };

  const skipWebAuthn = () => {
    handleWebAuthnSuccess("");
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

                {[
                  {
                    label: "Họ và tên",
                    value: name,
                    set: setName,
                    placeholder: "Nguyễn Văn A",
                    required: true,
                  },
                  {
                    label: "Số CCCD",
                    value: cccd,
                    set: setCccd,
                    placeholder: "001203001247",
                    required: true,
                  },
                  {
                    label: "Số điện thoại",
                    value: phone,
                    set: setPhone,
                    placeholder: "0912 345 678",
                    required: true,
                  },
                  {
                    label: "Mã thẻ BHYT (tuỳ chọn)",
                    value: bhxh,
                    set: setBhxh,
                    placeholder: "DN4015002345678",
                    required: false,
                  },
                  {
                    label: "Người liên hệ khẩn cấp (tuỳ chọn)",
                    value: emergencyName,
                    set: setEmergencyName,
                    placeholder: "Nguyễn Thị B",
                    required: false,
                  },
                  {
                    label: "SĐT liên hệ khẩn cấp (tuỳ chọn)",
                    value: emergencyPhone,
                    set: setEmergencyPhone,
                    placeholder: "0987 654 321",
                    required: false,
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
                  onClick={handleInfoNext}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900"
                  style={{ backgroundColor: ACCENT }}
                >
                  Tiếp tục · Chụp CCCD
                </button>
              </div>
            )}

            {/* ── Step 2: CCCD Front ── */}
            {step === "cccd-front" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <CreditCard className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Chụp mặt trước CCCD</h2>
                  <p className="mt-1 text-sm text-slate-500">Bước 2/5 · Đặt CCCD vào khung hình</p>
                </div>

                <CccdCapture
                  side="front"
                  capturedUrl={cccdFrontUrl}
                  onCapture={async (url) => {
                    setCccdFrontUrl(url || null);
                    if (url) {
                      setExtracting(true);
                      try {
                        const res = await fetchApi("/patient/ekyc/cccd", {
                          method: "POST",
                          body: { image_base64: url },
                        });
                        if (res.status === "success" && res.data) {
                          if (res.data.name) setName(res.data.name);
                          if (res.data.cccd) setCccd(res.data.cccd);
                        }
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setExtracting(false);
                      }
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() => setStep("cccd-back")}
                  disabled={!cccdFrontUrl || extracting}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {extracting ? "Đang trích xuất..." : "Tiếp tục · Chụp mặt sau"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("info")}
                  className="w-full text-xs text-slate-400 hover:text-slate-700"
                >
                  Quay lại
                </button>
              </div>
            )}

            {/* ── Step 3: CCCD Back ── */}
            {step === "cccd-back" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <FileText className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Chụp mặt sau CCCD</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bước 3/5 · Đặt CCCD mặt sau vào khung hình
                  </p>
                </div>

                <CccdCapture
                  side="back"
                  capturedUrl={cccdBackUrl}
                  onCapture={(url) => setCccdBackUrl(url || null)}
                />

                <button
                  type="button"
                  onClick={() => setStep("face-match")}
                  disabled={!cccdBackUrl}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900 disabled:opacity-40"
                  style={{ backgroundColor: ACCENT }}
                >
                  Tiếp tục · Chụp khuôn mặt
                </button>
                <button
                  type="button"
                  onClick={() => setStep("cccd-front")}
                  className="w-full text-xs text-slate-400 hover:text-slate-700"
                >
                  Quay lại
                </button>
              </div>
            )}

            {/* ── Step 4: Face Match ── */}
            {step === "face-match" && (
              <div className="space-y-4">
                <div className="text-center">
                  <div
                    className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${ACCENT}22` }}
                  >
                    <CheckCircle2 className="h-7 w-7" style={{ color: ACCENT_DARK }} />
                  </div>
                  <h2 className="font-bold text-slate-900">Xác thực khuôn mặt</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Bước 4/5 · Chụp ảnh để so khớp với CCCD
                  </p>
                </div>

                {/* Show CCCD photos side by side */}
                {(cccdFrontUrl || cccdBackUrl) && (
                  <div className="flex gap-2 justify-center">
                    {cccdFrontUrl && (
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={cccdFrontUrl}
                          alt="CCCD trước"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white text-center py-0.5">
                          TRƯỚC
                        </span>
                      </div>
                    )}
                    {cccdBackUrl && (
                      <div className="relative w-20 h-14 rounded-lg overflow-hidden border border-slate-200">
                        <img
                          src={cccdBackUrl}
                          alt="CCCD sau"
                          className="h-full w-full object-cover"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-[8px] text-white text-center py-0.5">
                          SAU
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <FaceIdCapture capturedUrl={faceUrl} onCapture={(url) => setFaceUrl(url || null)} />

                {faceUrl && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <p className="text-xs text-emerald-700">
                      Khớp thành công · Ảnh sẽ lưu vào avatar_url
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    if (faceUrl) {
                      setExtracting(true);
                      try {
                        const res = await fetchApi("/patient/ekyc/face", {
                          method: "POST",
                          body: { far_image_base64: faceUrl, near_image_base64: faceUrl },
                        });
                        if (res.status === "success") {
                          handleFaceMatchConfirm();
                        } else {
                          setFormError(res.message || "Xác thực khuôn mặt thất bại.");
                          setFaceUrl(null);
                        }
                      } catch (e) {
                        setFormError("Lỗi kết nối máy chủ VNPT.");
                      } finally {
                        setExtracting(false);
                      }
                    } else {
                      handleFaceMatchConfirm();
                    }
                  }}
                  disabled={!faceUrl || extracting}
                  className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
                  style={{ backgroundColor: ACCENT }}
                >
                  {extracting ? "Đang xác thực Liveness..." : "Tiếp tục · Tạo tài khoản"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("cccd-back")}
                  className="w-full text-xs text-slate-400 hover:text-slate-700"
                >
                  Quay lại
                </button>
              </div>
            )}

            {/* ── Step 5: WebAuthn ── */}
            {step === "webauthn" && (
              <div className="space-y-4">
                <WebAuthnFaceStep
                  mode="register"
                  cccd={cccd.trim()}
                  displayName={name.trim()}
                  onSuccess={handleWebAuthnSuccess}
                  onBack={() => setStep("face-match")}
                />
                <button
                  type="button"
                  onClick={skipWebAuthn}
                  className="w-full text-xs text-slate-400 hover:text-slate-700"
                >
                  Bỏ qua · Đăng ký sau
                </button>
              </div>
            )}

            {/* ── Step 6: Done ── */}
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
