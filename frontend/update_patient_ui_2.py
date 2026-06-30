import re

with open('src/routes/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_patient_view = '''function PatientPortalView() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from:"bot", text:"Chào bác A! Hôm nay bác thấy trong người thế nào? Bác có thể bấm nút Mic để nói chuyện với cháu, hoặc chụp Phiếu Khám / Xét nghiệm để cháu cập nhật sổ nhé! ", time: getTimeNow() }
  ]);
  const [botTyping, setBotTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages, botTyping]);

  const handleRecordClick = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTimeout(() => {
        setIsRecording(false);
        setMessages(prev => [...prev, { from: "user", text: "Chỉ số đường huyết 8.5 thì tôi có được ăn cơm không cháu?", time: getTimeNow() }]);
        setBotTyping(true);
        setTimeout(() => {
          setBotTyping(false);
          setMessages(prev => [...prev, { from: "bot", text: "Dạ thưa bác, đường huyết 8.5 là hơi cao. Bác nên hạn chế cơm trắng, có thể chuyển sang gạo lứt và ăn nhiều rau xanh trước bữa ăn nhé! ", time: getTimeNow() }]);
        }, 1500);
      }, 3000);
    }
  };

  const handleScanClick = () => setIsScanning(true);

  const handleCapture = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setIsScanning(false);
      setMessages(prev => [...prev, { from: "user", text: "[Ảnh Phiếu Xét Nghiệm]", isImage: true, time: getTimeNow() }]);
      setBotTyping(true);
      setTimeout(() => {
        setBotTyping(false);
        setMessages(prev => [...prev, { from: "bot", text: "Cháu đã bóc tách xong dữ liệu bằng VNPT AI! Chỉ số Glucose của bác đang ở mức 8.5 mmol/L (Hơi cao). Cháu đã tự động cập nhật vào sổ điện tử.", time: getTimeNow(), hasCard: true }]);
      }, 2000);
    }, 2500);
  };

  const [sos, setSos] = useState(false);

  const tiles = [
    { Icon: Receipt, label: "Phiếu khám bệnh", sub: "Lượt khám hôm nay" },
    { Icon: Pill, label: "Đơn thuốc điện tử", sub: "3 loại đang dùng" },
    { Icon: Calendar, label: "Lịch tái khám", sub: "15/06 · 9:00" },
    { Icon: FileText, label: "Viện phí", sub: "Đã thanh toán ✓" },
  ];

  return (
    <div className="flex justify-center py-4">
      <div className="w-full max-w-[400px] bg-[#F8FAFC] border border-slate-200 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative" style={{height:"min(92vh,860px)"}}>
        
        {/* Status bar */}
        <div className="bg-white px-6 py-1.5 flex justify-between items-center text-[10px] font-mono text-slate-700 z-20 flex-shrink-0">
          <span className="font-bold">9:41</span><span>● ● ● 100%</span>
        </div>
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-full z-30"/>

        {/* Header */}
        <div className="px-5 pt-10 pb-4 bg-white shadow-sm flex-shrink-0 z-10 relative">
          {/* SOS Button - Fixed top right in Header */}
          <button onClick={() => setSos(true)} className={`absolute top-10 right-5 z-40 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all border border-slate-100 ${sos ? 'bg-red-700' : 'bg-white hover:bg-red-50'}`}>
            <Siren className={`w-5 h-5 ${sos ? 'text-white' : 'text-red-500'}`} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-md" style={{ background: "#88E8F2" }}>
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">Bác Nguyễn Văn A</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">Trợ lý AI Trực tuyến</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">
          
          {/* 4 Tiles Section - Redesigned with White and #88E8F2 */}
          <div className="px-4 py-4 grid grid-cols-2 gap-3 bg-white border-b border-slate-100">
            {tiles.map(({Icon, label, sub}) => (
              <button key={label} className="text-left p-3.5 border border-slate-200 rounded-[1.25rem] hover:border-[#88E8F2] active:scale-95 transition-all bg-white shadow-sm flex flex-col gap-3 group">
                <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:bg-[#88E8F2] transition-colors" style={{ backgroundColor: "#88E8F215" }}>
                  <Icon className="w-5 h-5 group-hover:text-white transition-colors" style={{ color: "#0ea5e9" }} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-slate-900 leading-tight">{label}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Chat Area */}
          <div className="px-4 py-4 space-y-4 pb-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                {msg.from === "bot" && (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1 shadow-sm" style={{ backgroundColor: "#88E8F2" }}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-3xl px-4 py-3 shadow-sm ${msg.from === "user" ? "bg-slate-900 text-white rounded-br-sm" : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"}`}>
                  {msg.isImage ? (
                    <div className="w-full h-32 bg-slate-800 rounded-xl flex items-center justify-center overflow-hidden relative border border-slate-700">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent z-10 flex items-end p-3">
                        <span className="text-xs font-bold text-white flex items-center gap-2"><ScanLine className="w-4 h-4 text-[#88E8F2]"/> Phiếu Xét Nghiệm</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[13px] leading-relaxed font-medium">{msg.text}</p>
                  )}
                  
                  {msg.hasCard && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-2xl p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold text-red-900">Glucose (Đường huyết)</span>
                        <span className="text-[14px] font-bold text-red-600">8.5 <span className="text-[10px] font-normal">mmol/L</span></span>
                      </div>
                      <div className="w-full h-1.5 bg-red-200 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-red-500 w-[85%]" />
                      </div>
                      <p className="text-[10px] text-red-700 mt-1.5 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-full"/> Vượt ngưỡng an toàn (&lt; 6.4)</p>
                    </div>
                  )}
                  <p className={`text-[9px] mt-1.5 font-geist text-right ${msg.from === "user" ? "text-slate-400" : "text-slate-400"}`}>{msg.time}</p>
                </div>
              </div>
            ))}

            {botTyping && (
               <div className="flex justify-start">
                 <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1" style={{ backgroundColor: "#88E8F2" }}>
                   <Bot className="w-4 h-4 text-white" />
                 </div>
                 <div className="bg-white border border-slate-200 rounded-3xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                   {[0,1,2].map(i => <span key={i} className="w-2 h-2 rounded-full bg-slate-300" style={{animation:`bounce 1s infinite ${i*0.15}s`}}/>)}
                 </div>
               </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Bottom AI Toolbar */}
        <div className="px-5 pb-8 pt-4 bg-white rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.06)] flex-shrink-0 border-t border-slate-100 relative z-20">
          <p className="text-center text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-wider">Chạm để nói hoặc chụp ảnh</p>
          <div className="flex justify-center items-center gap-8">
            
            <div className="relative">
              {isRecording && (
                <>
                  <div className="absolute inset-0 bg-[#88E8F2] rounded-full animate-ping opacity-75" />
                  <div className="absolute -inset-4 bg-[#88E8F2] rounded-full animate-pulse opacity-30" />
                </>
              )}
              <button 
                onClick={handleRecordClick}
                className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(136,232,242,0.4)] transition-all duration-300 ${isRecording ? 'bg-slate-900 scale-110' : 'hover:scale-105 active:scale-95'}`}
                style={{ backgroundColor: isRecording ? undefined : "#88E8F2" }}
              >
                <Mic className={`w-8 h-8 ${isRecording ? 'text-[#88E8F2] animate-pulse' : 'text-white'}`} />
              </button>
            </div>

            <button 
              onClick={handleScanClick}
              className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-white hover:bg-slate-50 shadow-[0_5px_20px_rgba(0,0,0,0.05)] transition-all active:scale-95 border-2 border-slate-100"
            >
              <Camera className="w-7 h-7 text-[#0ea5e9]" />
            </button>
          </div>
        </div>

        {/* Camera Modal */}
        {isScanning && (
          <div className="absolute inset-0 bg-slate-900 z-50 flex flex-col animate-in fade-in duration-200">
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <div className="absolute inset-6 border-2 border-dashed border-[#88E8F2] rounded-3xl flex items-center justify-center bg-slate-800/50 backdrop-blur-sm">
                <p className="text-white text-sm font-medium opacity-70">Đưa giấy xét nghiệm vào khung</p>
                {isAnalyzing && (
                  <div className="absolute left-0 right-0 h-1 bg-[#88E8F2] shadow-[0_0_20px_#88E8F2] animate-scan" />
                )}
              </div>
            </div>
            <div className="h-40 bg-black flex items-center justify-around px-6 pb-8">
              <button onClick={() => setIsScanning(false)} className="text-white font-medium px-4 py-2 opacity-80">Hủy</button>
              <button 
                onClick={handleCapture}
                disabled={isAnalyzing}
                className="w-20 h-20 rounded-full border-4 border-[#88E8F2] flex items-center justify-center p-1.5 active:scale-95 transition-transform"
              >
                <div className={`w-full h-full bg-white rounded-full ${isAnalyzing ? 'animate-pulse bg-[#88E8F2]' : ''}`} />
              </button>
              <div className="w-12" />
            </div>
            {isAnalyzing && (
              <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50">
                <ScanLine className="w-20 h-20 text-[#88E8F2] animate-pulse mb-6" />
                <h3 className="text-white font-bold text-xl tracking-tight">Đang phân tích tài liệu...</h3>
                <p className="text-[#88E8F2] text-sm mt-2 font-mono uppercase tracking-widest">VNPT SmartReader AI</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
        .animate-scan { animation: scan 2s linear infinite; }
      `}</style>
    </div>
  );
}'''

pattern = r'function PatientPortalView\(\) \{.*?(?=/\* ============== VIEW: EMS)'
new_content = re.sub(pattern, new_patient_view + '\n\n', content, flags=re.DOTALL)

with open('src/routes/index.tsx', 'w', encoding='utf-8') as f:
    f.write(new_content)
    
print("PatientPortalView updated with 4 tiles & project colors successfully!")
