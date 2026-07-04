import os
import re

file_path = "/Users/macbook/Documents/CODE/EyeCU/EyeCU/frontend/src/components/PatientPortalNew.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update states
state_target = """  // Invoice logic
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);"""

state_replacement = """  // Invoice logic
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any>(null);
  const [isVerifyingPaymentFace, setIsVerifyingPaymentFace] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [searchBank, setSearchBank] = useState("");
  const [showRatingPopup, setShowRatingPopup] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [invoiceQrs, setInvoiceQrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAllInvoiceQrs = async () => {
      const qrs: Record<string, string> = {};
      for (const inv of invoices) {
        if (inv.status !== 'paid') {
          try {
            const res = await fetch(`http://localhost:8000/api/patient/payment/qr-code?invoice_id=${inv.id}&amount=${inv.total}`);
            if (res.ok) {
              const data = await res.json();
              if (data.qr_code) {
                qrs[inv.id] = data.qr_code;
              }
            }
          } catch (e) {
            console.error("Error fetching QR for invoice", inv.id, e);
          }
        }
      }
      setInvoiceQrs(qrs);
    };
    if (invoices.length > 0) {
      fetchAllInvoiceQrs();
    }
  }, [invoices]);"""

if state_target in content:
    content = content.replace(state_target, state_replacement)
    print("States updated")

# 2. Add FaceIdCapture before PatientPortalNew
face_id = """const FaceIdCapture = ({ onCapture }: { onCapture: (base64: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        console.error("Camera error:", e);
      }
    };
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const handleCapture = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        onCapture(canvas.toDataURL("image/jpeg", 0.9));
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 rounded-full overflow-hidden mb-6 border-4 border-[#88E8F2] shadow-[0_0_20px_rgba(136,232,242,0.4)]">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
        <div className="absolute inset-0 border-[6px] border-transparent border-t-[#88E8F2] border-b-[#88E8F2] rounded-full animate-spin-slow opacity-60"></div>
      </div>
      <p className="text-[15px] font-medium text-slate-600 mb-8 text-center max-w-[280px]">
        Vui lòng giữ khuôn mặt trong khung hình để xác thực
      </p>
      <button onClick={handleCapture} className="w-full max-w-[280px] bg-[#0d1f2d] text-white rounded-full py-4 text-[16px] font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform">
        Xác thực khuôn mặt
      </button>
    </div>
  );
};

export function PatientPortalNew"""
content = content.replace("export function PatientPortalNew", face_id)

# 3. Replace renderInvoiceList and add payment views
render_start = "  // Render Invoice List View\n  const renderInvoiceList = () => ("
render_end = "          {/* QR Scan Overlay (If any) */}\n          {isScanning && ("
if render_start in content and render_end in content:
    idx_start = content.find(render_start)
    idx_end = content.find(render_end)

    new_render = """  // Render Invoice List View
  const renderInvoiceList = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Danh sách hóa đơn</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide px-4 pt-4 pb-24">
        <p className="text-[14px] font-medium text-slate-700 mb-4">{invoices.length} hóa đơn</p>
        
        <div className="flex flex-col gap-4">
          {invoices.length === 0 ? (
            <div className="text-center text-slate-500 py-10 bg-white rounded-xl shadow-sm border border-slate-100">Chưa có hóa đơn nào</div>
          ) : (
            invoices.map((inv, i) => {
              const formattedDate = new Date(inv.created_at || new Date()).toLocaleString('vi-VN');
              const formattedTotal = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(inv.total);
              
              return (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
                  <div className="text-center mb-4">
                    <p className="text-[14px] font-bold text-slate-800">Hóa đơn điện tử #{inv.id.substring(0,8).toUpperCase()}</p>
                    <p className="text-[18px] font-bold text-blue-600 mt-1">{formattedTotal}</p>
                  </div>
                  
                  {inv.status !== 'paid' && invoiceQrs[inv.id] && (
                    <div className="flex flex-col items-center justify-center my-4 p-4 border border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-[13px] text-slate-600 font-medium mb-2">QR Thanh Toán</p>
                      <img src={invoiceQrs[inv.id]} alt="QR Code" className="w-40 h-40 object-contain mix-blend-multiply" />
                    </div>
                  )}

                  <div className="border-t border-dashed border-slate-200 my-4" />
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-600">Mã hóa đơn:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{inv.id.substring(24).toUpperCase()}</span>
                        <button 
                          onClick={() => handleCopy(inv.id.substring(24).toUpperCase())}
                          className="relative rounded border border-slate-200 bg-slate-50 p-1 text-slate-400 active:scale-95"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedCode === inv.id.substring(24).toUpperCase() && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-black/80 px-2 py-0.5 text-[10px] text-white">Đã chép</span>
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-600">Thời gian phát hành:</span>
                      <span className="font-medium text-slate-800">{formattedDate}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-slate-600">Trạng thái:</span>
                      <span className={`font-medium ${inv.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {inv.status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => {
                      setViewingInvoice(inv);
                      if (inv.status === 'paid') {
                        setViewingInvoice(inv);
                      } else {
                        setCurrentView("payment_confirmation");
                      }
                    }}
                    className="w-full rounded-xl bg-[#0d1f2d] py-3 text-[14px] font-bold text-white shadow-sm active:scale-95 transition-transform"
                  >
                    Xem chi tiết
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {viewingInvoice && viewingInvoice.status === 'paid' && (
        <div className="absolute inset-0 z-50 flex flex-col bg-[#f8f9fc] animate-in fade-in duration-200">
          <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe shadow-sm">
            <button onClick={() => setViewingInvoice(null)} className="p-1 active:scale-95">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <span className="text-[17px] font-bold">Chi tiết hóa đơn</span>
            <div className="w-8" />
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="text-center mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-[18px] font-bold text-slate-800">Thanh toán thành công</h3>
                <p className="text-[24px] font-bold text-blue-600 mt-2">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(viewingInvoice.total)}
                </p>
              </div>

              <div className="border-t border-dashed border-slate-200 my-5" />

              <div className="space-y-4">
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-slate-500">Mã giao dịch</span>
                  <span className="font-bold text-slate-800">{viewingInvoice.id.substring(24).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-slate-500">Thời gian</span>
                  <span className="font-medium text-slate-800">{new Date(viewingInvoice.paid_at || viewingInvoice.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-slate-500">Phương thức</span>
                  <span className="font-medium text-slate-800">Face ID & Sinh trắc</span>
                </div>
                <div className="flex justify-between items-center text-[14px]">
                  <span className="text-slate-500">Chi tiết dịch vụ</span>
                  <span className="font-medium text-blue-600">Xem danh sách</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 border-t border-slate-200 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex gap-3">
             <button onClick={() => setViewingInvoice(null)} className="flex-1 rounded-xl border border-slate-200 py-3 font-bold text-slate-700 active:bg-slate-50">Đóng</button>
             <button onClick={() => handleDownload(viewingInvoice)} className="flex-1 rounded-xl bg-[#88E8F2] py-3 font-bold text-slate-900 active:bg-[#68c6cf]">Lưu PDF</button>
          </div>
        </div>
      )}
    </div>
  );

  const BANK_LIST = [
    { id: "vcb", name: "Vietcombank", fullName: "NH TMCP Ngoại thương Việt Nam", img: "/img/vcb.webp" },
    { id: "bidv", name: "BIDV", fullName: "NH TMCP Đầu tư và Phát triển VN", img: "/img/bidv.webp" },
    { id: "vtb", name: "VietinBank", fullName: "NH TMCP Công thương Việt Nam", img: "/img/vtb.webp" },
    { id: "tcb", name: "Techcombank", fullName: "NH TMCP Kỹ thương Việt Nam", img: "/img/tcb.webp" },
    { id: "mb", name: "MB", fullName: "NH TMCP Quân đội", img: "/img/mb.webp" },
    { id: "acb", name: "ACB", fullName: "NH TMCP Á Châu", img: "/img/acb.png" },
    { id: "vpb", name: "VPBank", fullName: "NH TMCP Việt Nam Thịnh Vượng", img: "/img/vpb.webp" },
    { id: "shb", name: "SHB", fullName: "NH TMCP Sài Gòn - Hà Nội", img: "/img/shb.png" }
  ];

  const handlePaymentFaceVerified = async (base64: string) => {
    setIsVerifyingPaymentFace(true);
    setPaymentError(null);
    try {
      const res = await fetchApi("/patient/verify-face", {
        method: "POST",
        body: { face_base64: base64 }
      });
      if (res.status === "success") {
        if (viewingInvoice) {
           await fetch(`http://localhost:8000/api/patient/payment/confirm?invoice_id=${viewingInvoice.id}&amount=${viewingInvoice.total}`, { method: "POST" });
        }
        setCurrentView("payment_success");
        setInvoices(prev => prev.map(inv => inv.id === viewingInvoice.id ? { ...inv, status: 'paid' } : inv));
      } else {
        setPaymentError(res.message || "Khuôn mặt không khớp.");
        setCurrentView("payment_confirmation");
      }
    } catch (err: any) {
      setPaymentError(err.message || "Lỗi xác thực.");
      setCurrentView("payment_confirmation");
    } finally {
      setIsVerifyingPaymentFace(false);
    }
  };

  const renderPaymentConfirmation = () => (
    <div className="flex-1 flex flex-col bg-[#f4f7f9] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("invoice_list")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Chuyển khoản</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5">
            <p className="text-red-600 text-[13px] font-medium">{paymentError}</p>
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Tài khoản nguồn */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-slate-800 font-bold text-[16px]">Tài khoản nguồn</h3>
            </div>
            
            <div 
              onClick={() => setShowBankList(true)}
              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm active:bg-slate-50 mb-3"
            >
              <div className="flex items-center gap-3">
                {selectedBank ? (
                  <>
                    <img src={selectedBank.img} alt={selectedBank.name} className="w-8 h-8 rounded-full object-contain shrink-0" />
                    <div>
                      <p className="text-slate-800 font-bold text-[15px]">{selectedBank.name}</p>
                      <p className="text-slate-500 text-[12px]">{selectedBank.fullName}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <Landmark className="w-4 h-4 text-slate-400" />
                    </div>
                    <span className="text-slate-400 font-medium text-[15px]">Chọn ngân hàng chủ quản</span>
                  </>
                )}
              </div>
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </div>

            {selectedBank && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 text-[13px]">Tài khoản nguồn</span>
                  <span className="text-slate-800 text-[14px] font-bold">{user?.phone || "0358448639"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 text-[13px]">Tên người chuyển</span>
                  <span className="text-slate-800 text-[14px] font-bold uppercase">{user?.name || "Bệnh nhân"}</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500 text-[13px]">Số dư</span>
                  <span className="text-slate-800 text-[15px] font-bold">273.236.579 VND</span>
                </div>
              </div>
            )}
          </div>

          {/* Đến tài khoản */}
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-slate-800 font-bold text-[16px]">Đến tài khoản</h3>
          </div>

          <div className="space-y-4 mb-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center shadow-sm">
              <img src="/img/vcb.webp" alt="Vietcombank" className="w-10 h-10 rounded-full object-contain mr-4 shrink-0" />
              <div>
                <p className="text-slate-400 text-[11px] mb-0.5">Ngân hàng nhận</p>
                <p className="text-slate-800 font-bold text-[15px] uppercase">VIETCOMBANK</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col mb-4">
                <span className="text-slate-400 text-[12px] mb-1">Số tài khoản nhận</span>
                <span className="text-slate-800 font-bold text-[18px] tracking-wide">1029837492 (TRUNG TÂM EYECU)</span>
              </div>
              <div className="border-t border-slate-100 my-4" />
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-slate-400 text-[12px] block mb-1">Số tiền chuyển</span>
                  <span className="text-blue-600 font-bold text-[22px]">
                    {new Intl.NumberFormat('vi-VN').format(viewingInvoice?.total || 0)} VND
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.04)] absolute bottom-0 left-0 right-0">
        <button 
          disabled={!selectedBank || isVerifyingPaymentFace}
          onClick={() => setCurrentView("payment_face_capture")} 
          className="w-full rounded-2xl bg-[#0d1f2d] py-4 text-[16px] font-bold text-white shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isVerifyingPaymentFace ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>
      </div>

      {showBankList && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-900/40 animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setShowBankList(false)} />
          <div className="bg-white rounded-t-3xl flex flex-col h-[70vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-[17px] font-bold text-slate-800">Chọn ngân hàng</span>
              <button onClick={() => setShowBankList(false)} className="p-2 bg-slate-100 rounded-full active:scale-95 transition-transform">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="px-5 py-3">
              <div className="bg-slate-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm ngân hàng..." 
                  className="bg-transparent border-none outline-none text-[15px] w-full placeholder:text-slate-400 text-slate-800"
                  value={searchBank}
                  onChange={e => setSearchBank(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-safe">
              <div className="grid grid-cols-1 gap-3 py-2">
                {BANK_LIST.filter(b => b.name.toLowerCase().includes(searchBank.toLowerCase()) || b.fullName.toLowerCase().includes(searchBank.toLowerCase())).map(bank => (
                  <button
                    key={bank.id}
                    onClick={() => { setSelectedBank(bank); setShowBankList(false); }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors border border-transparent hover:border-slate-100 text-left"
                  >
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-100 p-1">
                      <img src={bank.img} alt={bank.name} className="w-full h-full object-contain rounded-full" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-bold text-slate-800">{bank.name}</p>
                      <p className="text-[12px] text-slate-500 line-clamp-1">{bank.fullName}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPaymentFaceCapture = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("payment_confirmation")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Xác thực khuôn mặt</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-4">
        <FaceIdCapture onCapture={handlePaymentFaceVerified} />
      </div>
    </div>
  );

  const renderPaymentSuccess = () => (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative items-center justify-center">
      <div className="animate-in zoom-in duration-500 flex flex-col items-center p-8 text-center max-w-sm w-full bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-slate-100 mx-4">
        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 className="w-12 h-12 text-emerald-500" />
        </div>
        <h2 className="text-[24px] font-bold text-slate-800 mb-2">Thanh toán thành công!</h2>
        <p className="text-[15px] text-slate-500 mb-6 leading-relaxed">
          Giao dịch thanh toán viện phí của bạn đã được xử lý thành công.
        </p>
        <div className="bg-slate-50 w-full p-4 rounded-2xl mb-8 border border-slate-100">
          <p className="text-[13px] text-slate-400 mb-1 font-medium uppercase tracking-wider">Tổng tiền</p>
          <p className="text-[28px] font-black text-blue-600">
            {new Intl.NumberFormat('vi-VN').format(viewingInvoice?.total || 0)} <span className="text-[18px] text-blue-500">VND</span>
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full">
          {showRatingPopup && (
            <div className="bg-[#f0f9ff] p-4 rounded-2xl border border-blue-100 mb-2 animate-in slide-in-from-bottom-2 duration-300">
               <p className="text-[14px] font-bold text-slate-700 mb-2">Bạn đánh giá trải nghiệm thanh toán này thế nào?</p>
               <div className="flex justify-center gap-2 mb-3">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} onClick={() => setRating(star)} className="p-1 active:scale-95 transition-transform">
                      <Star className={`w-8 h-8 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
               </div>
               <button onClick={() => setShowRatingPopup(false)} className="w-full bg-blue-600 text-white rounded-xl py-2.5 font-bold text-[14px] shadow-sm">Gửi đánh giá</button>
            </div>
          )}
          {!showRatingPopup && (
            <button onClick={() => setShowRatingPopup(true)} className="w-full py-3.5 bg-blue-50 text-blue-700 rounded-2xl font-bold text-[15px] border border-blue-100 active:bg-blue-100 transition-colors">
              Đánh giá dịch vụ
            </button>
          )}
          <button onClick={() => setCurrentView("invoice_list")} className="w-full py-3.5 bg-[#0d1f2d] text-white rounded-2xl font-bold text-[15px] shadow-lg shadow-slate-200 active:scale-95 transition-transform">
            Về danh sách hóa đơn
          </button>
        </div>
      </div>
    </div>
  );
"""

    content = content[:idx_start] + new_render + content[idx_end:]
    print("UI replaced")

# 4. Insert Landmark into lucide-react imports if it's missing (needed for Bank icon)
if "Landmark" not in content:
    content = re.sub(r'(import \{ [^\}]+)(\} from "lucide-react";)', r'\1, Landmark \2', content, count=1)


# 5. Connect new views in return block
switch_start = """      {currentView === "community_qa" && renderCommunityQa()}
      {currentView === "ask_question" && renderAskQuestion()}
      {currentView === "invoice_list" && renderInvoiceList()}
      {currentView === "digital_signature" && renderDigitalSignature()}
      {currentView === "hospital_map" && (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[#88E8F2]"><Loader2 className="h-8 w-8 animate-spin text-[#0d1f2d]" /></div>}>
          <PatientPortalMap onBack={() => setCurrentView("home")} />
        </Suspense>
      )}"""

switch_repl = """      {currentView === "community_qa" && renderCommunityQa()}
      {currentView === "ask_question" && renderAskQuestion()}
      {currentView === "invoice_list" && renderInvoiceList()}
      {currentView === "payment_confirmation" && renderPaymentConfirmation()}
      {currentView === "payment_face_capture" && renderPaymentFaceCapture()}
      {currentView === "payment_success" && renderPaymentSuccess()}
      {currentView === "digital_signature" && renderDigitalSignature()}
      {currentView === "hospital_map" && (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-[#88E8F2]"><Loader2 className="h-8 w-8 animate-spin text-[#0d1f2d]" /></div>}>
          <PatientPortalMap onBack={() => setCurrentView("home")} />
        </Suspense>
      )}"""

if switch_start in content:
    content = content.replace(switch_start, switch_repl)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Complete")
