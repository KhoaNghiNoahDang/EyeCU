import { Download, Share, Smartphone, X } from "lucide-react";
import { usePwaInstall } from "../hooks/use-pwa-install";

export function PwaInstallPrompt() {
  const { visible, isInstallEligible, showIosHint, dismiss, install } = usePwaInstall();

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] px-3 pb-safe pt-2 pointer-events-none">
      <div
        role="dialog"
        aria-labelledby="pwa-install-title"
        aria-describedby="pwa-install-desc"
        className="pointer-events-auto mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-[#88E8F2]/30 bg-white shadow-2xl shadow-[#0A9BAD]/15 animate-in slide-in-from-bottom-6 duration-500"
      >
        {/* Gradient accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#88E8F2] via-[#0A9BAD] to-[#34d399]" />

        <div className="flex items-start gap-3 p-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-[#0A9BAD]/20"
            style={{ background: "linear-gradient(135deg, #0A9BAD, #34d399)" }}
          >
            <Smartphone className="h-6 w-6 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p id="pwa-install-title" className="text-sm font-bold text-slate-900">
              Thêm EyeCU vào Màn hình chính?
            </p>
            <p id="pwa-install-desc" className="mt-1 text-xs leading-relaxed text-slate-500">
              Truy cập nhanh như ứng dụng, mở FaceID và cổng bệnh nhân ngay từ điện thoại.
            </p>

            {showIosHint && !isInstallEligible && (
              <div className="mt-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 border border-slate-100">
                <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                  <Share className="h-3 w-3" /> iOS (Safari):
                </span>{" "}
                Chạm <strong>Chia sẻ</strong> → <strong>Thêm vào Màn hình chính</strong>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={dismiss}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={() => void install()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-[#0d1f2d] transition-all hover:opacity-90 active:scale-95 shadow-md shadow-[#88E8F2]/30"
            style={{ backgroundColor: "#88E8F2" }}
          >
            <Download className="h-4 w-4" />
            {isInstallEligible ? "Cài đặt ngay" : "Hướng dẫn"}
          </button>
        </div>
      </div>
    </div>
  );
}
