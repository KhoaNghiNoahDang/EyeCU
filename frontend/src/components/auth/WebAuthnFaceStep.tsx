import { useState } from "react";
import { ArrowLeft, ScanFace, ShieldCheck, Smartphone } from "lucide-react";
import {
  authenticateWebAuthnPasskey,
  getWebAuthnHint,
  isPlatformAuthenticatorAvailable,
  isWebAuthnSupported,
  registerWebAuthnPasskey,
  WebAuthnError,
} from "../../lib/auth/webauthn";

const ACCENT = "#88E8F2";
const ACCENT_DARK = "#0A9BAD";

type WebAuthnMode = "register" | "authenticate";

interface WebAuthnFaceStepProps {
  mode: WebAuthnMode;
  cccd: string;
  displayName: string;
  credentialId?: string;
  title?: string;
  subtitle?: string;
  onSuccess: (credentialId?: string) => void;
  onBack: () => void;
}

export function WebAuthnFaceStep({
  mode,
  cccd,
  displayName,
  credentialId,
  title,
  subtitle,
  onSuccess,
  onBack,
}: WebAuthnFaceStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const defaultTitle = mode === "register" ? "Đăng ký sinh trắc Face ID" : "Xác thực Face ID eKYC";
  const defaultSubtitle =
    mode === "register"
      ? "WebAuthn · Face ID iOS · Sinh trắc Android"
      : "So khớp passkey đã đăng ký trên thiết bị này";

  const runWebAuthn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (!isWebAuthnSupported()) {
        throw new WebAuthnError(
          "not_supported",
          "Trình duyệt không hỗ trợ WebAuthn. Mở bằng Safari (iOS) hoặc Chrome (Android) qua HTTPS/localhost.",
        );
      }
      const platformOk = await isPlatformAuthenticatorAvailable();
      if (!platformOk) {
        throw new WebAuthnError(
          "not_supported",
          "Thiết bị chưa bật Face ID / vân tay. Hãy cấu hình sinh trắc trong Cài đặt hệ thống.",
        );
      }

      if (mode === "register") {
        const newCredentialId = await registerWebAuthnPasskey(cccd, displayName);
        setDone(true);
        onSuccess(newCredentialId);
      } else {
        await authenticateWebAuthnPasskey(credentialId ?? "");
        setDone(true);
        onSuccess();
      }
    } catch (err: any) {
      setError(err instanceof WebAuthnError ? err.message : `Lỗi: ${err.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex animate-in fade-in flex-col items-center space-y-5 text-center duration-300">
      <div className="space-y-1">
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${ACCENT}22` }}
        >
          <ScanFace className="h-7 w-7" style={{ color: ACCENT_DARK }} />
        </div>
        <h3 className="text-base font-bold text-slate-900">{title ?? defaultTitle}</h3>
        <p className="text-sm text-slate-500">{subtitle ?? defaultSubtitle}</p>
      </div>

      <div className="relative flex h-32 w-32 items-center justify-center">
        {!done && loading && (
          <div
            className="absolute inset-0 animate-spin rounded-full border-2"
            style={{
              borderColor: `${ACCENT}40`,
              borderTopColor: ACCENT,
              animationDuration: "2s",
            }}
          />
        )}
        <div
          className="relative flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            backgroundColor: done ? "#ecfdf5" : `${ACCENT}15`,
            border: `2px solid ${done ? "#10b981" : `${ACCENT}30`}`,
          }}
        >
          {done ? (
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          ) : (
            <Smartphone className="h-10 w-10" style={{ color: ACCENT_DARK }} />
          )}
        </div>
      </div>

      <div className="space-y-1 px-2">
        <p className="text-sm font-bold text-slate-900">
          {done
            ? "Xác thực sinh trắc thành công"
            : loading
              ? "Đang chờ Face ID / sinh trắc..."
              : "Sẵn sàng xác thực"}
        </p>
        {!done && !loading && <p className="text-xs text-slate-400">{getWebAuthnHint()}</p>}
      </div>

      {error && (
        <p className="max-w-xs rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      {!done && (
        <button
          type="button"
          onClick={() => void runWebAuthn()}
          disabled={loading}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-slate-900 disabled:opacity-50"
          style={{ backgroundColor: ACCENT }}
        >
          {loading
            ? "Đang xử lý..."
            : mode === "register"
              ? "Bật Face ID · Đăng ký"
              : "Quét Face ID · Đăng nhập"}
        </button>
      )}

      <button
        type="button"
        onClick={onBack}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-slate-700 disabled:opacity-50"
      >
        <ArrowLeft className="h-3 w-3" /> Quay lại
      </button>
    </div>
  );
}
