with open('src/routes/login.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

import re
pattern = re.compile(r'function PatientLoginFlow\(\{ onLogin \}: \{ onLogin: \(user: AuthUser, token\?: string\) => void \}\) \{.*?\n\}\n', re.DOTALL)
match = pattern.search(content)

new_patient_login = r"""
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
"""

if match:
    new_content = content[:match.start()] + new_patient_login + "\n" + content[match.end():]
    with open('src/routes/login.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Replaced PatientLoginFlow!")
else:
    print("Not found")
