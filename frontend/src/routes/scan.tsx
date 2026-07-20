import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, QrCode, ScanFace } from "lucide-react";
import { WebAuthnFaceStep } from "../components/auth/WebAuthnFaceStep";
import { useAuth } from "../lib/auth/auth-context";
import {
  findPatientByQrToken,
  type RegisteredPatient,
  toAuthUser,
} from "../lib/auth/patient-registry";

export const Route = createFileRoute("/scan")({
  validateSearch: (search: Record<string, unknown>) => ({
    t: typeof search.t === "string" ? search.t : undefined,
  }),
  component: ScanPage,
});

const ACCENT = "#88E8F2";
const ACCENT_DARK = "#0A9BAD";
const SCANNER_ID = "eyecu-qr-scanner";

type Step = "scan" | "face" | "done";

function parseTokenFromQrText(text: string): string | null {
  try {
    const url = new URL(text);
    return url.searchParams.get("t") ?? url.searchParams.get("token");
  } catch {
    return text.length >= 8 ? text : null;
  }
}

function ScanPage() {
  const { t: tokenFromUrl } = Route.useSearch();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [step, setStep] = useState<Step>(tokenFromUrl ? "face" : "scan");
  const [patient, setPatient] = useState<RegisteredPatient | null>(() =>
    tokenFromUrl ? findPatientByQrToken(tokenFromUrl) : null,
  );
  const [scanError, setScanError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (tokenFromUrl && !patient) {
      setScanError("Mã QR không hợp lệ hoặc bệnh nhân chưa đăng ký.");
    }
  }, [tokenFromUrl, patient]);

  useEffect(() => {
    if (step !== "scan" || tokenFromUrl) return;

    let cancelled = false;

    async function startScanner() {
      setScanError(null);
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decoded) => {
            if (handledRef.current) return;
            const token = parseTokenFromQrText(decoded);
            if (!token) return;
            const found = findPatientByQrToken(token);
            if (!found) {
              setScanError("Không tìm thấy bệnh nhân với mã QR này.");
              return;
            }
            handledRef.current = true;
            void scanner.stop().catch(() => {});
            setPatient(found);
            setStep("face");
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setScanError(
            "Không mở được camera quét QR. Hãy cấp quyền Camera hoặc mở link QR trực tiếp trên sổ khám.",
          );
        }
      }
    }

    void startScanner();

    return () => {
      cancelled = true;
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [step, tokenFromUrl]);

  const handleFaceSuccess = () => {
    if (!patient) return;
    login(toAuthUser(patient));
    setStep("done");
    setTimeout(() => navigate({ to: "/" }), 800);
  };

  return (
    <div
      className="flex min-h-screen flex-col font-hanken"
      style={{
        background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      }}
    >
      <div className="flex items-center gap-3 px-4 pb-2 pt-safe">
        <button
          type="button"
          onClick={() => navigate({ to: "/login" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-bold text-white">Quét sổ khám bệnh</p>
          <p className="text-[10px] uppercase tracking-wider text-slate-400">
            QR → Face ID → Đăng nhập
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-safe">
        {step === "scan" && (
          <div className="w-full max-w-sm space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
              <div id={SCANNER_ID} className="min-h-[280px] w-full" />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
              <QrCode className="h-4 w-4" style={{ color: ACCENT }} />
              Đưa mã QR trên phiếu khám vào khung
            </div>
            {scanError && (
              <p className="rounded-xl bg-red-500/20 px-3 py-2 text-center text-xs text-red-200">
                {scanError}
              </p>
            )}
          </div>
        )}

        {step === "face" && patient && (
          <div
            className="w-full max-w-[400px] rounded-3xl p-6"
            style={{ backgroundColor: "rgba(255,255,255,0.95)" }}
          >
            <div className="mb-4 text-center">
              <p className="text-sm font-bold text-slate-900">{patient.name}</p>
              <p className="text-xs text-slate-500">CCCD · {patient.cccd}</p>
            </div>
            <WebAuthnFaceStep
              mode="authenticate"
              cccd={patient.cccd}
              displayName={patient.name}
              credentialId={patient.credentialId}
              title="Xác thực Face ID"
              subtitle="Quét sinh trắc để đăng nhập tự động"
              onSuccess={handleFaceSuccess}
              onBack={() => {
                if (tokenFromUrl) {
                  navigate({ to: "/login" });
                } else {
                  handledRef.current = false;
                  setStep("scan");
                }
              }}
            />
          </div>
        )}

        {step === "face" && !patient && (
          <div className="text-center text-slate-300">
            <ScanFace className="mx-auto mb-3 h-12 w-12" style={{ color: ACCENT }} />
            <p className="text-sm">{scanError ?? "Không tìm thấy hồ sơ bệnh nhân"}</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="mt-4 rounded-xl px-4 py-2 text-sm font-bold text-slate-900"
              style={{ backgroundColor: ACCENT }}
            >
              Về trang đăng nhập
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="text-center text-white">
            <p className="text-lg font-bold">Đăng nhập thành công</p>
            <p className="mt-1 text-sm text-slate-400">Đang chuyển vào cổng bệnh nhân...</p>
          </div>
        )}
      </div>
    </div>
  );
}
