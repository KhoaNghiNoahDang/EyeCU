"use client";
import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useAuth } from "../lib/auth/auth-context";
import { fetchApi, API_URL } from "../lib/api/client";
import { User, LogIn, Calendar, FileText, Settings, Heart, Bell, MessageCircle, MapPin, Menu, X, ArrowLeft, ArrowRight, ShieldCheck, ChevronRight, Mic, Send, Phone, ClipboardList, ScanFace, FileSignature, Info, LogOut, Copy, Download, Eye, Map as MapIcon, Trash2, CalendarClock, Lock, Globe, Users, Activity, Search, Stethoscope, Receipt, Home, Star, Camera, ScanLine, Share, PlusSquare, Volume2, VolumeX, Pause, Loader2, Scan, BriefcaseMedical, ChevronDown, CheckCircle2 , Landmark } from "lucide-react";
import { getHospitalsByProvince, CENTRAL_HOSPITALS, Hospital } from "../lib/hospitals";
import { MapErrorBoundary } from "./MapErrorBoundary";
import { VitalSignsView } from "./health-record/VitalSignsView";
import { MedicationsView } from "./health-record/MedicationsView";
import { LabResultsView } from "./health-record/LabResultsView";
import { ImagingResultsView } from "./health-record/ImagingResultsView";
import { AdminInfoView } from "./health-record/AdminInfoView";
import { RecordSummaryView } from "./health-record/RecordSummaryView";
import { FileResultsView } from "./health-record/FileResultsView";

const PatientPortalMap = lazy(() => import("./PatientPortalMap"));

// EyeCU Brand Colors
const NAVY = "#0d1f2d";
const CYAN = "#88E8F2";

interface ChatMsg {
  from: "bot" | "user";
  text: string;
  time: string;
  buttons?: { title: string; payload?: string; payload_id?: string; color?: string }[];
  images?: string[];
  raw?: any;
}

function getTimeNow() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

type ViewState = "home" | "health_record" | "record_lookup" | "community_qa" | "ask_question" | "invoice_list" | "digital_signature" | "hospital_map" | "payment_confirmation" | "payment_face_capture" | "payment_success";

function getAge(dobString?: string) {
  if (!dobString) return "";
  const parts = dobString.split("/");
  if (parts.length === 3) {
    const year = parseInt(parts[2], 10);
    const currentYear = new Date().getFullYear();
    if (!isNaN(year)) return `${currentYear - year} tuổi`;
  }
  return dobString;
}



const FaceIdCapture = ({ onCapture }: { onCapture: (base64: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);

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
        const base64 = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImg(base64);
        setIsCapturing(true);
        // Dừng camera
        streamRef.current?.getTracks().forEach(t => t.stop());
        // Gọi callback sau 1.5s để có thời gian hiển thị animation
        setTimeout(() => {
          onCapture(base64);
        }, 1500);
      }
    }
  };

  if (isCapturing && capturedImg) {
    return (
      <div className="flex flex-col items-center gap-6">
        {/* Ảnh chụp được với vòng quay */}
        <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-[#88E8F2] shadow-[0_0_30px_rgba(136,232,242,0.5)]">
          <img src={capturedImg} alt="captured" className="w-full h-full object-cover scale-x-[-1]" />
          {/* Overlay mờ */}
          <div className="absolute inset-0 bg-[#0d1f2d]/40 rounded-full flex items-center justify-center" />
        </div>
        {/* Vòng xoay ngoài */}
        <div className="absolute w-[276px] h-[276px] rounded-full border-4 border-transparent border-t-[#88E8F2] border-b-[#88E8F2] animate-spin" style={{animationDuration: '1s'}} />
        <div className="flex flex-col items-center gap-2 mt-2">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#88E8F2] animate-bounce" style={{animationDelay: '0ms'}} />
            <span className="w-2 h-2 rounded-full bg-[#88E8F2] animate-bounce" style={{animationDelay: '150ms'}} />
            <span className="w-2 h-2 rounded-full bg-[#88E8F2] animate-bounce" style={{animationDelay: '300ms'}} />
          </div>
          <p className="text-[16px] font-semibold text-[#0d1f2d]">Đang xác thực khuôn mặt...</p>
          <p className="text-[13px] text-slate-500">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

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

export function PatientPortalNew({
  isInstallEligible,
  showIosInstallHint,
  onInstallApp,
  onRequestLogout,
}: {
  isInstallEligible: boolean;
  showIosInstallHint: boolean;
  onInstallApp: () => void | Promise<void>;
  onRequestLogout: () => void;
}) {
  const { user } = useAuth();
  const [clinicalBundle, setClinicalBundle] = useState<any>(null);
  const [loadingBundle, setLoadingBundle] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [consentForms, setConsentForms] = useState<any[]>([]);
  const [scheduledDoctors, setScheduledDoctors] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      setLoadingBundle(true);
      fetchApi("/patient/clinical-bundle")
        .then((data) => {
          if (data && data.status !== "no_records") {
            setClinicalBundle(data);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingBundle(false));

      fetchApi("/patient/invoices").then((data) => setInvoices(data.invoices || [])).catch(console.error);
      fetchApi("/patient/questions").then((data) => setQuestions(data.questions || [])).catch(console.error);
      fetchApi("/patient/appointments").then((data) => setAppointments(data.appointments || [])).catch(console.error);
      fetchApi("/patient/consent-forms").then((data) => setConsentForms(data.forms || [])).catch(console.error);
      fetchApi("/patient/notifications").then((data) => setNotifications(data.notifications || [])).catch(console.error);
      fetchApi("/patient/follow-ups").then((data) => setFollowUps(data.follow_ups || [])).catch(console.error);
      fetchApi("/patient/doctor-schedules").then((data) => setScheduledDoctors(data.doctors || [])).catch(console.error);
    }
  }, [user]);

  // ── Real-time WebSocket listener for QA_ANSWERED ──────────────────
  useEffect(() => {
    const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
    const WS_BASE = (import.meta.env.VITE_WS_URL ?? `ws://${host}:8000`);
    const wsUrl = WS_BASE + "/api/ambient/ws/live";
    let ws: WebSocket | null = null;
    let pingTimer: ReturnType<typeof setInterval> | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    const connect = () => {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => {
        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, 20000);
      };
      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "QA_ANSWERED" && msg.data) {
            const { question_id, answer, doctor_name, answered_at } = msg.data;
            setQuestions((prev) =>
              prev.map((q) =>
                q.id === question_id
                  ? { ...q, answer, doctor_name, answered_at, status: "answered" }
                  : q
              )
            );
          }
        } catch {}
      };
      ws.onclose = () => {
        if (pingTimer) clearInterval(pingTimer);
        if (!unmounted) reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();
    return () => {
      unmounted = true;
      if (pingTimer) clearInterval(pingTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) { ws.onclose = null; ws.close(); }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Floating Bot Logic
  const [botOpen, setBotOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  // TTS Logic
  const [autoPlayTTS, setAutoPlayTTS] = useState(true);
  const [playingTTSMsgIdx, setPlayingTTSMsgIdx] = useState<number | null>(null);
  const [isTTSPaused, setIsTTSPaused] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showEmergencyCall, setShowEmergencyCall] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Ghi âm Voice
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Popup state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // PWA Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showAudioPrompt, setShowAudioPrompt] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setShowAudioPrompt(true);
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsAppInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  const handleInstallClick = async () => {
    if (isIos()) {
      setShowIosPrompt(true);
      return;
    }
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert('Thiết bị của bạn không hỗ trợ cài đặt hoặc bạn đã cài đặt ứng dụng này rồi.');
    }
  };

  useEffect(() => {
    // Auto-pop bot after 1.5s as requested
    const t = setTimeout(() => setBotOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (botOpen && messages.length === 0) {
      setBotTyping(true);
      fetchApi("/patient/chat", { method: "POST", body: { message: "Xin chào" } })
        .then((data) => {
          setMessages([{ from: "bot", text: data.reply || "Xin chào, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?", time: getTimeNow(), buttons: data.buttons, images: data.images }]);
          setBotTyping(false);
        })
        .catch(() => {
          setMessages([{ from: "bot", text: "Xin chào, tôi là trợ lý AI. Tôi có thể giúp gì cho bạn?", time: getTimeNow() }]);
          setBotTyping(false);
        });
    }
  }, [botOpen, messages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, botTyping]);

  useEffect(() => {
    if (autoPlayTTS && messages.length > 0) {
      const lastMsgIdx = messages.length - 1;
      const lastMsg = messages[lastMsgIdx];
      // Play TTS if it's from bot and not already playing (to prevent re-triggering on re-renders)
      if (lastMsg.from === "bot" && playingTTSMsgIdx !== lastMsgIdx) {
        // Debounce slightly to allow UI to render first
        const t = setTimeout(() => playTTS(lastMsg.text, lastMsgIdx), 300);
        return () => clearTimeout(t);
      }
    }
  }, [messages.length, autoPlayTTS]);

  const playTTS = (text: string, idx: number) => {
    if (playingTTSMsgIdx === idx && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsTTSPaused(false);
      } else {
        audioRef.current.pause();
        setIsTTSPaused(true);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingTTSMsgIdx(idx);
    setIsTTSPaused(false);
    
    // Tùy chỉnh cách phát âm cho hệ thống TTS
    let spokenText = text;
    spokenText = spokenText.replace(/EyeCU/gi, "ai xi diu");
    
    const audio = new Audio(`${API_URL}/voice/tts?text=${encodeURIComponent(spokenText)}`);
    audioRef.current = audio;
    audio.play().catch(e => {
      console.error("Audio playback failed:", e);
      setPlayingTTSMsgIdx(null);
      setIsTTSPaused(false);
    });
    audio.onended = () => {
      setPlayingTTSMsgIdx(null);
      setIsTTSPaused(false);
      audioRef.current = null;
    };
  };

  const sendMessage = (textStr?: string, payloadStr?: string) => {
    const text = textStr || chatInput.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { from: "user", text, time: getTimeNow() }]);
    if (!textStr) setChatInput("");
    setBotTyping(true);
    fetchApi("/patient/chat", { method: "POST", body: { message: payloadStr || text } })
      .then((data) => {
        setMessages((prev) => [...prev, { from: "bot", text: data.reply || "Xin lỗi, tôi không thể trả lời lúc này.", time: getTimeNow(), buttons: data.buttons, images: data.images, raw: data.raw_data }]);
        setBotTyping(false);
        
        // Check for emergency routing
        const botDataList = data.raw_data?.data || [];
        if (botDataList.length > 0 && botDataList[0].type === "chuyen_gdv") {
           setBotOpen(false);
           setShowEmergencyCall(true);
        }
      })
      .catch(() => setBotTyping(false));
  };

  const startRecording = () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng dùng Chrome hoặc Safari.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';
      
      let finalTranscript = chatInput ? chatInput + " " : "";

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let currentFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        finalTranscript += currentFinal;
        setChatInput(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Lỗi nhận diện giọng nói:", event.error);
        stopRecording();
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Lỗi khởi động micro:", err);
      alert("Không thể khởi động ghi âm. Vui lòng cấp quyền.");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Main Navigation state
  const [activeTab, setActiveTab] = useState("home");
  
  // Draggable logic
  const [botPos, setBotPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragStartCoords = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStart.current = { x: e.clientX - botPos.x, y: e.clientY - botPos.y };
    dragStartCoords.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStartCoords.current.x;
    const dy = e.clientY - dragStartCoords.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasMoved.current = true;
    }
    setBotPos({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    if (!hasMoved.current) {
      setBotOpen(true);
    }
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Appointment logic
  const [aptTab, setAptTab] = useState<"upcoming" | "history">("upcoming");
  
  // Notification logic
  const [notifications, setNotifications] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);

  // Profile logic
  const [faceIdEnabled, setFaceIdEnabled] = useState(false);
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

  const handleBookFollowUp = async (fId: string) => {
    try {
      const res = await fetchApi(`/patient/follow-ups/${fId}/book`, { method: "POST", body: {} });
      if (res.status === "success") {
        alert("Đặt khám thành công!");
        fetchApi("/patient/follow-ups").then(data => setFollowUps(data.follow_ups || []));
        fetchApi("/patient/appointments").then(data => setAppointments(data.appointments || []));
      } else {
        alert(res.error || "Có lỗi xảy ra");
      }
    } catch(e) {
      console.error(e);
      alert("Có lỗi xảy ra khi kết nối");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await fetchApi("/patient/avatar", { method: "POST", body: { avatar_base64: base64 } });
        if (res.status === "success") {
          alert("Cập nhật ảnh đại diện thành công, vui lòng tải lại trang.");
          window.location.reload();
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  
  const handleFaceIdToggle = async () => {
    if (!faceIdEnabled) {
      try {
        const { registerWebAuthnPasskey } = await import("../lib/auth/webauthn");
        await registerWebAuthnPasskey(user?.cccd || "unknown", user?.name || "Bệnh nhân");
        setFaceIdEnabled(true);
        alert("Đăng ký Face ID thành công!");
      } catch (err: any) {
        alert("Lỗi đăng ký Face ID: " + err.message);
      }
    } else {
      setFaceIdEnabled(false);
    }
  };
  const [currentView, setCurrentView] = useState<ViewState>("home");
  const [showFiles, setShowFiles] = useState(false);
  
  const [currentTicket, setCurrentTicket] = useState<any>(null);
  const [searchTicketCode, setSearchTicketCode] = useState("");
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);

  useEffect(() => {
    if (currentView === "record_lookup") {
      fetchLatestTicket();
    }
  }, [currentView]);

  const fetchLatestTicket = async () => {
    setIsSearchingTicket(true);
    try {
      const res = await fetchApi("/patient/tickets/latest");
      if (res && res.id) setCurrentTicket(res);
      else setCurrentTicket(null);
    } catch(e) {
      setCurrentTicket(null);
    } finally {
      setIsSearchingTicket(false);
    }
  };

  const handleSearchTicket = async () => {
    if (!searchTicketCode) return;
    setIsSearchingTicket(true);
    try {
      const res = await fetchApi(`/patient/tickets/${searchTicketCode}`);
      if (res && res.id) {
        setCurrentTicket(res);
      } else {
        alert("Không tìm thấy mã hồ sơ này");
        setCurrentTicket(null);
      }
    } catch(e) {
      console.error(e);
      alert("Không tìm thấy mã hồ sơ này");
      setCurrentTicket(null);
    } finally {
      setIsSearchingTicket(false);
    }
  };

  // Camera / Scan logic
  const [isScanning, setIsScanning] = useState(false);
  const [isScanningLab, setIsScanningLab] = useState(false);
  const [isAnalyzingLab, setIsAnalyzingLab] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const startCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Thiết bị không hỗ trợ camera trực tiếp. Vui lòng chọn ảnh từ thư viện.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Không mở được camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  useEffect(() => {
    if (!isScanning && !isScanningLab) { stopCamera(); return; }
    void startCamera();
    return () => stopCamera();
  }, [isScanning, isScanningLab]);

  const runLabAnalysis = async (imageDataUrl?: string) => {
    if (!imageDataUrl) return;
    setIsAnalyzingLab(true);

    try {
      const res = await fetchApi("/patient/scan-document", {
        method: "POST",
        body: { image_base64: imageDataUrl },
      });
      
      setIsAnalyzingLab(false);
      setIsScanningLab(false);
      stopCamera();
      
      if (res.status === "success") {
        setMessages((prev) => [
          ...prev,
          {
            from: "user",
            text: "Đây là phiếu khám/xét nghiệm của tôi:",
            time: getTimeNow(),
            images: [imageDataUrl],
          },
          {
            from: "bot",
            text: `Mình đã nhận được tài liệu của bạn (VNPT bóc tách thành công). Bạn muốn mình giải thích chỉ số hay đơn thuốc này như thế nào?`,
            time: getTimeNow(),
          },
        ]);
        setBotOpen(true);
      } else {
        throw new Error(res.message || "Không trích xuất được thông tin");
      }
    } catch (e: any) {
      console.error(e);
      setIsAnalyzingLab(false);
      setIsScanningLab(false);
      stopCamera();
      alert("Quét tài liệu thất bại: " + e.message);
    }
  };

  const handleCaptureLab = () => {
    const video = videoRef.current;
    if (video && video.videoWidth > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
        runLabAnalysis(imageDataUrl);
        return;
      }
    }
    runLabAnalysis();
  };

  const handleFileSelectedLab = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        runLabAnalysis(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  // Ask Question Form logic
  const [askGender, setAskGender] = useState<"Nam" | "Nữ">("Nữ");
  const [askAge, setAskAge] = useState(20);
  const [askSpecialty, setAskSpecialty] = useState<string | null>(null);
  const [askQuestionText, setAskQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // ── Appointment Booking State ─────────────────────────────────────────
  const [bookStep, setBookStep] = useState(1);
  const [deptsList, setDeptsList] = useState<{id:string; name:string}[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string|null>(null);
  const [selectedDeptName, setSelectedDeptName] = useState<string>("");
  const [doctorsList, setDoctorsList] = useState<{id:string; name:string}[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("random");
  const [selectedDoctorName, setSelectedDoctorName] = useState<string>("Bác sĩ ngẫu nhiên");
  const [bookingTime, setBookingTime] = useState<string|null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [bookSuccess, setBookSuccess] = useState<{doctorName:string; dept:string; date:string; time:string}|null>(null);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState<string>(""); // Date picker

  // Tạo time slots: 08:00 → 16:30, mỗi 30 phút
  const TIME_SLOTS: string[] = [];
  for (let h = 8; h <= 16; h++) {
    TIME_SLOTS.push(`${String(h).padStart(2,'0')}:00`);
    if (h < 17) TIME_SLOTS.push(`${String(h).padStart(2,'0')}:30`);
  }

  const openBookingModal = async () => {
    setBookStep(1);
    setSelectedDeptId(null); setSelectedDeptName("");
    setSelectedDoctorId("random"); setSelectedDoctorName("Bác sĩ ngẫu nhiên");
    setBookingTime(null); setBookingDate(""); setBookedSlots([]);
    setBookSuccess(null);
    setShowBookingModal(true);
    // Fetch departments
    try {
      const data = await fetchApi("/patient/departments");
      setDeptsList(data.departments || []);
    } catch { setDeptsList([]); }
  };

  const handleSelectDept = async (id: string, name: string) => {
    setSelectedDeptId(id); setSelectedDeptName(name);
    setSelectedDoctorId("random"); setSelectedDoctorName("Bác sĩ ngẫu nhiên");
    setBookStep(2);
    try {
      const data = await fetchApi(`/patient/doctors-by-department?department_id=${id}`);
      setDoctorsList(data.doctors || []);
    } catch { setDoctorsList([]); }
  };

  const handleSelectDoctor = (id: string, name: string) => {
    setSelectedDoctorId(id); setSelectedDoctorName(name);
    setBookStep(3);
  };

  // Khi bấm sang step 3, fetch booked slots nếu đã có ngày và bác sĩ cụ thể
  useEffect(() => {
    if (bookStep === 3 && bookingDate && selectedDoctorId !== "random") {
      fetchApi(`/patient/appointments/booked-slots?doctor_id=${selectedDoctorId}&date=${bookingDate}`)
        .then(d => setBookedSlots(d.booked_slots || []))
        .catch(() => setBookedSlots([]));
    }
  }, [bookStep, bookingDate, selectedDoctorId]);

  const handleDateChange = async (date: string) => {
    setBookingDate(date);
    setBookingTime(null);
    if (selectedDoctorId !== "random" && date) {
      try {
        const d = await fetchApi(`/patient/appointments/booked-slots?doctor_id=${selectedDoctorId}&date=${date}`);
        setBookedSlots(d.booked_slots || []);
      } catch { setBookedSlots([]); }
    } else {
      setBookedSlots([]);
    }
  };

  const handleBookingSubmit = async () => {
    if (!selectedDeptId || !bookingDate || !bookingTime) {
      alert("Vui lòng chọn đủ thông tin.");
      return;
    }
    setSubmittingBooking(true);
    try {
      const res = await fetchApi("/patient/appointments", {
        method: "POST",
        body: JSON.stringify({
          department_id: selectedDeptId,
          doctor_id: selectedDoctorId === "random" ? null : selectedDoctorId,
          booking_date: bookingDate,
          booking_time: bookingTime,
          reason: "Khám bệnh"
        }),
      });
      const data = await fetchApi("/patient/appointments");
      setAppointments(data.appointments || []);
      setBookSuccess({
        doctorName: res.doctor_name || selectedDoctorName,
        dept: selectedDeptName,
        date: bookingDate,
        time: bookingTime,
      });
      setBookStep(4);
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra khi đặt lịch");
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleSignConsent = async (formId: string) => {
    try {
      await fetchApi("/patient/consent-forms/sign", {
        method: "POST",
        body: JSON.stringify({ form_id: formId }),
      });
      const data = await fetchApi("/patient/consent-forms");
      setConsentForms(data.forms || []);
      alert("Đã ký số thành công!");
    } catch (err) {
      console.error(err);
      alert("Lỗi khi ký số");
    }
  };

  // (handleBookingSubmit nằm ở trên, line ~792)

  const handleAskSubmit = async () => {
    if (!askSpecialty || askQuestionText.length < 50) {
      alert("Vui lòng chọn chuyên khoa và nhập câu hỏi tối thiểu 50 ký tự.");
      return;
    }
    setSubmittingQuestion(true);
    try {
      await fetchApi("/patient/questions", {
        method: "POST",
        body: JSON.stringify({ department: askSpecialty, question: askQuestionText }),
      });
      const data = await fetchApi("/patient/questions");
      setQuestions(data.questions || []);
      setCurrentView("community_qa");
      setAskQuestionText("");
      setAskSpecialty(null);
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra");
    } finally {
      setSubmittingQuestion(false);
    }
  };  const [showSpecialties, setShowSpecialties] = useState(false);
  const specialtiesList = ["Nội tiết", "Tim mạch", "Tiêu hoá", "Thần kinh", "Tai Mũi Họng", "Răng Hàm Mặt"];

  // Render Home View
  const renderHome = () => (
    <div className="flex-1 overflow-y-auto pb-20 overscroll-contain scrollbar-hide bg-[#f8f9fc]">
          
          {/* 2. Banner */}
          <div className="relative w-full">
            <div className="h-[200px] w-full bg-gradient-to-br from-[#0d1f2d] to-[#1a3a52] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop" 
                alt="Hospital Banner" 
                className="w-full h-full object-cover opacity-80 mix-blend-overlay"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <h1 className="text-2xl font-bold text-white uppercase tracking-wider drop-shadow-lg text-center px-4">
                   TRUNG TÂM Y TẾ EyeCU
                 </h1>
                 <p className="text-[#88E8F2] text-sm mt-1 font-medium tracking-widest uppercase">EyeCU Medical Center</p>
              </div>
            </div>
          </div>

          {/* 3. Grid Services */}
          <div className="px-4 mt-10">
            <div className="grid grid-cols-2 gap-3">
              {/* Primary Button */}
              <button 
                onClick={() => openBookingModal()}
                className="flex items-center gap-3 rounded-2xl bg-[#88E8F2] p-4 text-[#0d1f2d] shadow-md active:scale-95 transition-transform"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/40">
                   <User className="h-5 w-5 text-[#0d1f2d]" />
                </div>
                <span className="text-[13px] font-bold text-left leading-tight">Đặt lịch khám</span>
              </button>
              
              {/* Secondary Buttons */}
              {[
                { label: "Hồ sơ sức khỏe", icon: Activity, onClick: () => setCurrentView("health_record") },
                { label: "Tra cứu số khám", icon: Search, onClick: () => setCurrentView("record_lookup") },
                { label: "Giải đáp cùng chuyên gia", icon: Stethoscope, onClick: () => setCurrentView("community_qa") },
                { label: "Ký số giấy tờ", icon: FileSignature, onClick: () => setCurrentView("digital_signature") },
                { label: "Hóa đơn điện tử", icon: Receipt, onClick: () => setCurrentView("invoice_list") }
              ].map((item, idx) => (
                <button key={idx} onClick={item.onClick} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 active:scale-95 transition-transform">
                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50/50">
                      <item.icon className="h-5 w-5 text-[#0d1f2d]" />
                   </div>
                   <span className="text-[13px] font-bold text-[#0d1f2d] text-left leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* OCR Banner */}
          <div className="px-4 mt-4">
            <button 
              onClick={() => setIsScanningLab(true)}
              className="flex w-full items-center gap-4 rounded-[20px] bg-[#88E8F2] p-4 shadow-sm active:scale-95 transition-transform"
            >
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[18px] bg-white/40">
                <Camera className="h-7 w-7 text-[#0d1f2d]" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[17px] font-bold text-[#0d1f2d] tracking-wide">Quét phiếu xét nghiệm</p>
                <p className="text-[13px] text-slate-700 mt-1">AI tự động bóc tách • Lưu vào hồ sơ</p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/40">
                <ScanLine className="h-[22px] w-[22px] text-[#0d1f2d]" strokeWidth={2} />
              </div>
            </button>
          </div>

          {/* 4. Map Location Banner */}
          <div className="px-4 mt-4">
             <button onClick={() => setCurrentView("hospital_map")} className="flex w-full items-center gap-4 rounded-2xl bg-white p-4 shadow-sm border border-slate-100 active:scale-95 transition-transform">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 overflow-hidden">
                  <MapPin className="h-5 w-5 text-emerald-600" />
               </div>
                <div className="flex-1 text-left">
                   <p className="text-[14px] font-bold text-[#0d1f2d]">Trung tâm EyeCU</p>
                   <p className="text-[11px] text-slate-500 mt-0.5">Mở bản đồ bệnh viện</p>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
             </button>
          </div>


          
          <div className="h-10 shrink-0" />
        </div>
  );

  // Render Health Record View
  const renderHealthRecord = () => (
    <div className="flex-1 flex flex-col bg-[#88E8F2] overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-2">Hồ sơ sức khoẻ</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide pb-24">
        {/* Profile Card */}
        <div className="bg-white px-4 pt-6 pb-4 shadow-sm relative">
           <div className="flex flex-col gap-2 justify-center mb-4">
              <button className="flex justify-center items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-[#0d1f2d] shadow-sm active:bg-slate-50 w-full">
                <span className="text-slate-400">↓</span> Cập nhật kết quả
              </button>
            </div>
           
           <div className="flex items-start gap-3">
             <div className="h-16 w-16 shrink-0 rounded-full border border-slate-100 bg-white p-1 shadow-sm overflow-hidden">
                <img src={user?.avatar || DEFAULT_AVATAR} alt="EyeCU" className="h-full w-full object-cover rounded-full" />
             </div>
             <div className="flex-1 min-w-0">
               <h2 className="text-[16px] font-bold text-[#0d1f2d] uppercase mb-1">{user?.name || "Bệnh nhân"}</h2>
               <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600 mb-2">Ngoại trú</span>
               <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 text-[13px] text-slate-600">
                 <span>GT, tuổi</span><span className="font-medium text-[#0d1f2d]">{user?.gender || "Nam"}, {getAge(user?.dob)}</span>
                 <span>Mã NB</span><span className="font-medium text-[#0d1f2d]">NT{user?.id?.substring(0, 8).toUpperCase() || "2606002632"}</span>
                 <span>Mã HS</span><span className="font-medium text-[#0d1f2d]">TH{user?.id?.substring(24).toUpperCase() || "2606041360"}</span>
               </div>
             </div>
             <div className="shrink-0 rounded-xl bg-white p-1 border border-slate-200 shadow-sm mt-1">
                {/* Dynamic QR Code */}
                <div 
                   className="h-14 w-14 bg-cover" 
                   style={{ backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user?.cccd || "EYECU_RECORD"}')` }}
                />
             </div>
           </div>
        </div>

        {/* Next Appointment Card */}
        {(() => {
          const upcomingFollowUp = followUps.find(f => f.status !== "booked");
          if (!upcomingFollowUp) return null;
          
          const parts = upcomingFollowUp.date.split("-"); // "YYYY-MM-DD"
          const day = parts[2] || "00";
          const monthYear = parts[1] + "/" + parts[0];
          return (
            <div className="mx-4 mt-4 bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
               <div className="flex">
                 <div className="flex flex-col items-center justify-center border-r border-slate-100 px-4 py-3 min-w-[72px]">
                    <span className="text-3xl font-bold text-[#0d1f2d] leading-none">{day}</span>
                    <span className="text-[11px] font-medium text-blue-600 mt-1">{monthYear}</span>
                 </div>
                 <div className="flex flex-col justify-center flex-1 px-3 py-2">
                    <p className="text-[13px] font-bold text-red-600 mb-1">[Lịch hẹn tái khám] <span className="text-[#0d1f2d]">{upcomingFollowUp.department}</span></p>
                    <p className="text-[12px] text-slate-600">{upcomingFollowUp.note || "Khám bệnh theo yêu cầu"}</p>
                 </div>
                 <div className="flex items-center px-3">
                    <button 
                      onClick={() => handleBookFollowUp(upcomingFollowUp.id)}
                      className="rounded-full bg-[#0d1f2d] px-4 py-2 text-[13px] font-bold text-white shadow-sm active:scale-95">
                      Đặt khám
                    </button>
                 </div>
               </div>
            </div>
          );
        })()}

        {/* Services List as Accordion */}
           <div className="bg-slate-50 mt-4 pt-2 flex-1 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] min-h-screen">
              {[
                { id: "file_results", icon: BriefcaseMedical, label: "File Kết Quả", Component: FileResultsView },
                { id: "record_summary", icon: Stethoscope, label: "Kết quả khám", Component: RecordSummaryView },
                { id: "vital_signs", icon: Heart, label: "Sinh hiệu", Component: VitalSignsView },
                { id: "lab_results", icon: Activity, label: "Kết quả xét nghiệm", Component: LabResultsView },
                { id: "imaging_results", icon: FileText, label: "Kết quả CĐHA và thăm dò chức năng", Component: ImagingResultsView },
                { id: "medications", icon: Receipt, label: "Thuốc", Component: MedicationsView },
                { id: "admin_info", icon: FileText, label: "Thông tin hành chính", Component: AdminInfoView },
              ].map((item, i) => {
                 const isExpanded = expandedSection === item.id;
                 const isSpecial = item.id === "file_results";
                 return (
                   <div key={i} className={`border-b border-slate-200/60 last:border-0 ${isSpecial ? "mx-4 mt-2 mb-4 bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200" : "bg-white"}`}>
                     <button 
                        onClick={() => setExpandedSection(isExpanded ? null : item.id)} 
                        className={`flex w-full items-center justify-between px-4 py-4 text-left transition-colors duration-200 ${
                           isSpecial
                             ? "bg-[#88E8F2] text-[#0d1f2d]"
                             : isExpanded 
                               ? "bg-[#88E8F2]" 
                               : "bg-white active:bg-slate-50"
                        }`}
                     >
                        <div className="flex items-center gap-3">
                           <item.icon className="h-5 w-5 text-[#0d1f2d]" strokeWidth={1.5} />
                           <span className="text-[15px] font-semibold text-[#0d1f2d]">{item.label}</span>
                        </div>
                        <ChevronRight className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""} ${isSpecial ? "text-[#0d1f2d]" : "text-slate-400"}`} />
                     </button>
                     
                     {/* Accordion Content */}
                     {isExpanded && (
                       <div className={`animate-in slide-in-from-top-2 duration-200 ${isSpecial ? "bg-white p-2" : "border-t border-[#88E8F2]/30"}`}>
                          <item.Component data={clinicalBundle} user={user} onBack={() => setExpandedSection(null)} />
                       </div>
                     )}
                   </div>
                 );
              })}
           </div>
      </div>

      {/* Bottom pagination banner */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-slate-200 shrink-0">
         <span className="text-slate-300 text-[13px] font-medium">← Lần khám trước</span>
         <div className="h-4 w-px bg-slate-300" />
          <span className="text-slate-300 text-[13px] font-medium">Lần khám sau →</span>
      </div>
    </div>
  );

  // Render Community QA
  const renderCommunityQa = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Cộng đồng hỏi đáp</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
          <div className="flex rounded-lg bg-slate-100 p-1 mb-3">
            <button className="flex-1 rounded-md bg-white py-1.5 text-[14px] font-bold text-blue-600 shadow-sm">Tất cả</button>
            <button className="flex-1 py-1.5 text-[14px] font-medium text-slate-500">Câu hỏi của bạn</button>
          </div>
          <div className="flex h-11 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex w-10 shrink-0 items-center justify-center">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input type="text" placeholder="Tìm kiếm câu hỏi" className="flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-slate-400" />
            <button className="flex w-10 shrink-0 items-center justify-center border-l border-slate-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 pb-24">
          {questions.length === 0 ? (
            <div className="text-center text-slate-500 py-10">Chưa có câu hỏi nào.</div>
          ) : (
            questions.map((item, i) => (
              <div key={i} className="bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center">
                    <User className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-800">{item.name}</p>
                    <p className="text-[11px] text-slate-500">{new Date(item.created_at).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
                <p className="text-[14px] text-slate-800 leading-relaxed mb-3">{item.question}</p>
                {item.answer ? (
                  <div className="flex gap-3 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <div className="h-8 w-8 shrink-0 rounded-full border border-emerald-200 bg-white flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-emerald-600 mb-0.5">
                        {item.doctor_name ? `BS. ${item.doctor_name} trả lời` : "Bác sĩ trả lời"}
                      </p>
                      <p className="text-[13px] text-slate-700 leading-relaxed">{item.answer}</p>
                      {item.answered_at && (
                        <p className="mt-1 text-[10px] text-slate-400">
                          {new Date(item.answered_at).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          {" · "}
                          {new Date(item.answered_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                    <p className="text-[13px] text-orange-600 italic">Chưa có câu trả lời</p>
                  </div>
                )}
                <div className="mt-3">
                  <span className="inline-block rounded bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-600">{item.department}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <button onClick={() => setCurrentView("ask_question")} className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-l-xl bg-[#0d1f2d] p-3 text-white shadow-lg active:scale-95 transition-transform">
        <FileText className="h-6 w-6 mb-1" />
        <span className="text-[10px] font-bold text-center leading-tight">Đặt<br/>câu hỏi</span>
      </button>
    </div>
  );

  // Render Ask Question Form
  const renderAskQuestion = () => (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("community_qa")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Đặt câu hỏi</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide">
        <div className="bg-[#E6F7F5] px-6 py-4 text-center">
          <p className="text-[13px] font-medium text-[#006666] leading-relaxed">
            * Câu hỏi của bạn sẽ được chia sẻ trên cộng đồng hỏi đáp với chế độ ẩn danh.
          </p>
        </div>

        <div className="px-4 py-5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[14px] text-slate-600 font-medium">Giới tính</span>
            <div className="flex w-48 overflow-hidden rounded-full border border-slate-200">
              <button 
                onClick={() => setAskGender("Nam")}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[14px] transition-colors ${askGender === "Nam" ? "bg-[#0d1f2d] font-bold text-white shadow-inner" : "bg-white text-slate-600"}`}>
                <span className={`${askGender === "Nam" ? "text-blue-300" : "text-blue-500"} font-bold`}>♂</span> Nam
              </button>
              <button 
                onClick={() => setAskGender("Nữ")}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-[14px] transition-colors ${askGender === "Nữ" ? "bg-[#0d1f2d] font-bold text-white shadow-inner" : "bg-white text-slate-600"}`}>
                <span className="text-pink-400 font-bold">♀</span> Nữ
              </button>
            </div>
          </div>
          
          <div className="mb-2">
            <div className="flex justify-between items-center mb-4 relative">
              <span className="text-[14px] text-slate-600 font-medium">Tuổi</span>
              <span className="text-[14px] font-bold text-slate-800 absolute left-1/2 -translate-x-1/2">{askAge} tuổi</span>
            </div>
            <div className="px-2">
              <input 
                type="range" min="0" max="100" 
                value={askAge} 
                onChange={(e) => setAskAge(parseInt(e.target.value))}
                className="w-full accent-[#0d1f2d]" 
              />
              <div className="flex justify-between px-1 mt-2 text-[12px] text-slate-400 font-medium">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setShowSpecialties(true)}
          className="w-full flex items-center justify-between px-4 py-4 border-b border-slate-100 active:bg-slate-50">
          <div className="flex flex-col items-start text-left">
            <span className="text-[14px] font-bold text-slate-800">Vui lòng chọn chuyên khoa</span>
            <span className={`text-[13px] mt-0.5 ${askSpecialty ? "text-blue-600 font-medium" : "text-red-500"}`}>
              {askSpecialty || "Chưa chọn chuyên khoa"}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </button>

        <div className="p-4">
          <textarea
            value={askQuestionText}
            onChange={(e) => setAskQuestionText(e.target.value)}
            placeholder="Viết câu hỏi của bạn:&#10;- Bạn có triệu chứng gì, kéo dài bao lâu?&#10;- Bạn đã đi khám hoặc dùng thuốc gì chưa?&#10;- Gửi ảnh chụp rõ nét (nếu có).&#10;- Câu hỏi tối thiểu 50 ký tự."
            className="w-full h-40 resize-none outline-none text-[14px] placeholder:text-slate-300 leading-relaxed"
          />
        </div>
      </div>

      <div className="px-4 py-3 bg-white border-t border-slate-200 flex items-center justify-between mb-[68px] pb-safe shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <button className="flex items-center gap-2 px-2 py-2 text-[14px] font-bold text-slate-500 active:scale-95 transition-transform">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200"><FileText className="h-5 w-5 text-slate-500" /></div>
        </button>
        <button 
          onClick={handleAskSubmit}
          disabled={submittingQuestion}
          className="flex-1 ml-3 flex items-center justify-center gap-2 rounded-full bg-[#88E8F2] px-6 py-3 text-[16px] font-bold text-[#0d1f2d] shadow-md active:scale-95 transition-transform disabled:opacity-50">
          {submittingQuestion ? "Đang gửi..." : "Gửi câu hỏi"} <Send className="h-5 w-5" />
        </button>
      </div>

      {/* Specialty Bottom Sheet */}
      {showSpecialties && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/50 animate-in fade-in duration-200">
          <div className="flex-1 w-full" onClick={() => setShowSpecialties(false)} />
          <div className="bg-white rounded-t-2xl flex flex-col max-h-[70%] animate-in slide-in-from-bottom-full duration-300">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="text-[16px] font-bold text-slate-800">Chọn chuyên khoa</span>
              <button onClick={() => setShowSpecialties(false)} className="p-1 active:bg-slate-100 rounded-full">
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-safe">
              {specialtiesList.map((spec) => (
                <button 
                  key={spec}
                  onClick={() => {
                    setAskSpecialty(spec);
                    setShowSpecialties(false);
                  }}
                  className="w-full text-left px-4 py-3 border-b border-slate-100 active:bg-slate-50 text-[15px] text-slate-700 font-medium"
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render Record Lookup View
  const renderRecordLookup = () => (
    <div className="flex-1 flex flex-col bg-[#88E8F2] overflow-hidden">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Tra cứu số khám</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide pb-24 px-4 pt-6 bg-slate-50">
        
        {/* Search Bar */}
        <div className="flex h-12 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-400 mb-8">
          <div className="flex w-10 shrink-0 items-center justify-center pl-2">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Nhập mã hồ sơ"
            value={searchTicketCode}
            onChange={(e) => setSearchTicketCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchTicket()}
            className="flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-slate-400"
          />
          <button onClick={() => setIsScanning(true)} className="flex w-10 shrink-0 items-center justify-center active:bg-slate-50">
            <Scan className="h-5 w-5 text-[#0d1f2d]" />
          </button>
          <button 
            onClick={handleSearchTicket}
            disabled={isSearchingTicket}
            className="flex items-center justify-center bg-[#a6c1e6] px-5 text-[15px] font-semibold text-white active:bg-blue-400 transition-colors disabled:opacity-50"
          >
            Tìm
          </button>
        </div>

        {/* Guide Label */}
        <h3 className="mb-4 text-center text-[14px] font-bold text-slate-500 uppercase tracking-wide">
          {currentTicket ? "Phiếu hướng dẫn khám bệnh" : "HƯỚNG DẪN XEM MÃ HỒ SƠ"}
        </h3>

        {/* Dummy Guide Ticket (When no ticket is searched) */}
        {!currentTicket && (
          <div className="mx-auto w-full max-w-[340px] bg-white p-4 shadow-md mb-6 relative">
            <div className="flex justify-between items-start mb-4">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase">BỘ Y TẾ</p>
                <p className="text-[10px] font-bold uppercase">CƠ SỞ Y TẾ</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-red-500 font-medium">Mã Hồ sơ</span>
                <div className="bg-red-100/50 px-2 py-1 mt-0.5">
                  <div className="flex h-8 w-24 gap-[2px]">
                    {[3,1,2,4,1,3,2,1,2,3,1,1,4,2].map((w,i)=><div key={i} className="h-full bg-black" style={{width: `${w}px`}} />)}
                  </div>
                  <p className="text-[8px] text-center font-mono mt-0.5">80969800</p>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-[9px]">Mã NB: 2303006123</p>
              </div>
            </div>
            
            <div className="text-center mb-4">
               <h4 className="text-[16px] font-bold uppercase">PHIẾU HƯỚNG DẪN</h4>
               <p className="text-[10px]">Ngày đăng ký: 10/03/2023 <span className="font-bold text-[18px] ml-4">STT: 18</span></p>
            </div>
            
            <div className="text-[10px] space-y-1 mb-3">
               <p>Họ và tên: <span className="font-bold text-[11px] uppercase">NGUYỄN VĂN A</span></p>
               <div className="flex justify-between">
                 <p>Đối tượng: Dịch vụ</p>
                 <p>Tuổi: 14</p>
                 <p>Giới tính: Nam</p>
               </div>
               <p>Địa chỉ: Nghĩa Tân, Cầu Giấy, Hà Nội, Việt Nam</p>
            </div>
            
            <div className="border border-black mb-6">
              <div className="flex border-b border-black font-bold text-[9px] text-center">
                 <div className="w-10 border-r border-black py-1">STT</div>
                 <div className="flex-1 border-r border-black py-1">Tên dịch vụ</div>
                 <div className="flex-1 py-1">Nơi khám</div>
              </div>
              <div className="flex text-[9px] text-center items-center">
                 <div className="w-10 border-r border-black py-2">1</div>
                 <div className="flex-1 border-r border-black py-2">Khám Cấp cứu</div>
                 <div className="flex-1 py-2 font-bold px-1">Khoa Cấp cứu- Phòng A109 - Tầng 1- nhà A2</div>
              </div>
            </div>
            
            <div className="flex justify-between text-[9px] mt-4">
               <p>Tên đăng nhập: nguyenvana11</p>
               <p>Mật khẩu: 888567</p>
            </div>
          </div>
        )}

        {/* Dynamic Paper Mockup */}
        {currentTicket && (
          <div className="mx-auto w-full max-w-[340px] bg-white p-4 shadow-md mb-6 relative">
            {currentTicket.status === "completed" && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 border-4 border-red-500 text-red-500 font-bold text-3xl px-4 py-2 rounded-lg opacity-20 pointer-events-none">ĐÃ KHÁM XONG</div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase">BỘ Y TẾ</p>
                <p className="text-[10px] font-bold uppercase">CƠ SỞ Y TẾ EYECU</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-red-500 font-medium">Mã Hồ sơ</span>
                <div className="bg-red-100/50 px-2 py-1 mt-0.5">
                  <div className="flex h-8 w-24 gap-[2px]">
                    {[3,1,2,4,1,3,2,1,2,3,1,1,4,2].map((w,i)=><div key={i} className="h-full bg-black" style={{width: `${w}px`}} />)}
                  </div>
                  <p className="text-[8px] text-center font-mono mt-0.5">{currentTicket.ticket_code}</p>
                </div>
              </div>
              <div className="pt-4">
                <p className="text-[9px]">Mã NB: {currentTicket.patient_code}</p>
              </div>
            </div>
            
            <div className="text-center mb-4">
               <h4 className="text-[16px] font-bold uppercase">PHIẾU HƯỚNG DẪN</h4>
               <p className="text-[10px]">Ngày đăng ký: {new Date(currentTicket.registered_at).toLocaleDateString("vi-VN")} <span className="font-bold text-[18px] ml-4">STT: {currentTicket.sequence_number}</span></p>
            </div>
            
            <div className="text-[10px] space-y-1 mb-3">
               <p>Họ và tên: <span className="font-bold text-[11px] uppercase">{user?.name}</span></p>
               <div className="flex justify-between">
                 <p>Đối tượng: Dịch vụ</p>
                 <p>Tuổi: {getAge(user?.dob)}</p>
                 <p>Giới tính: {user?.gender}</p>
               </div>
               <p>Địa chỉ: {user?.address || "Chưa cập nhật"}</p>
            </div>

            <div className="border border-black mb-6">
              <div className="flex border-b border-black font-bold text-[9px] text-center">
                 <div className="w-10 border-r border-black py-1">STT</div>
                 <div className="flex-1 border-r border-black py-1">Tên dịch vụ</div>
                 <div className="flex-1 py-1">Nơi khám</div>
              </div>
              {currentTicket.items && currentTicket.items.length > 0 ? currentTicket.items.map((item: any) => (
                <div key={item.id} className={`flex text-[9px] text-center items-center ${item.status === 'completed' ? "opacity-50 line-through" : ""}`}>
                   <div className="w-10 border-r border-black py-2">{item.order_index}</div>
                   <div className="flex-1 border-r border-black py-2">{item.service_name}</div>
                   <div className="flex-1 py-2 font-bold px-1">{item.room_location}</div>
                </div>
              )) : (
                <div className="flex text-[9px] text-center items-center">
                   <div className="w-10 border-r border-black py-2">&nbsp;</div>
                   <div className="flex-1 border-r border-black py-2"></div>
                   <div className="flex-1 py-2 font-bold px-1"></div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Invoice logic
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
          // Generate VietQR instead of backend fetch
          const qrUrl = `https://img.vietqr.io/image/vcb-1029837492-qr_only.png?amount=${inv.total}&addInfo=Thanh toan HD ${inv.id.substring(24).toUpperCase()}&accountName=TRUNG TAM EYECU`;
          qrs[inv.id] = qrUrl;
        }
      }
      setInvoiceQrs(qrs);
    };
    if (invoices.length > 0) {
      fetchAllInvoiceQrs();
    }
  }, [invoices]);

  // Booking logic
  const [showBookingModal, setShowBookingModal] = useState(false);
  // bookingDate, bookingSpecialty đã chuyển lên phần Booking State (~line 733)

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownload = (inv: any) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      const element = document.createElement("div");
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 40px; color: #0d1f2d;">
          <div style="text-align: center; border-bottom: 2px solid #0d1f2d; padding-bottom: 20px; margin-bottom: 30px;">
            <h1 style="font-size: 28px; margin: 0; color: #0d1f2d;">BỆNH VIỆN MẮT EYECU</h1>
            <p style="font-size: 16px; color: #555; margin-top: 5px;">HÓA ĐƠN ĐIỆN TỬ BÁN HÀNG</p>
          </div>
          <div style="margin-bottom: 40px;">
            <p style="margin: 10px 0; font-size: 15px;"><strong>Số hóa đơn:</strong> ${inv.id}</p>
            <p style="margin: 10px 0; font-size: 15px;"><strong>Mã hóa đơn:</strong> ${inv.id.substring(24).toUpperCase()}</p>
            <p style="margin: 10px 0; font-size: 15px;"><strong>Ngày lập:</strong> ${inv.created_at.replace('T', ' ')}</p>
            <p style="margin: 10px 0; font-size: 15px;"><strong>Khách hàng:</strong> Bệnh nhân ngoại trú</p>
          </div>
          <div style="border-top: 1px dashed #ccc; padding-top: 20px;">
            <p style="font-size: 22px; font-weight: bold; color: #0d6db7;">Tổng tiền thanh toán: ${new Intl.NumberFormat('vi-VN').format(inv.total)} VND</p>
          </div>
        </div>
      `;
      const opt = {
        margin: 0,
        filename: `Hoa_don_${inv.id.substring(24).toUpperCase()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      // @ts-ignore
      html2pdf().set(opt).from(element).save();
    };
    document.body.appendChild(script);
  };

  // Render Invoice List View
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
                  
                  {inv.status !== 'paid' && (
                    <div className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-[#b6daff] rounded-[32px] my-4 shadow-sm">
                      <p className="text-[16px] text-slate-500 font-bold mb-6">Mã QR Thanh Toán</p>
                      {invoiceQrs[inv.id] ? (
                        <div className="bg-[#f0f7ff] p-5 rounded-[24px] w-full max-w-[280px] flex items-center justify-center">
                          <img 
                            src={invoiceQrs[inv.id]} 
                            alt="QR Code" 
                            className="w-full object-contain rounded-xl mix-blend-multiply"
                          />
                        </div>
                      ) : (
                        <div className="bg-[#f0f7ff] p-5 rounded-[24px] w-full max-w-[280px] h-[300px] flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-[#88E8F2] animate-spin" />
                        </div>
                      )}
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
                  </div>
                  
                  <button 
                    onClick={() => {
                      setViewingInvoice(inv);
                      if (inv.status === 'paid') {
                        // overlay will show
                      } else {
                        setCurrentView("payment_confirmation");
                      }
                    }}
                    className={`w-full rounded-xl py-3 text-[15px] font-bold shadow-sm active:scale-95 transition-transform ${inv.status === 'paid' ? 'bg-slate-200 text-slate-500' : 'bg-[#88E8F2] text-[#0d1f2d]'}`}
                  >
                    {inv.status === 'paid' ? 'Đã thanh toán' : 'THANH TOÁN NGAY'}
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

          <div className="bg-white p-4 border-t border-slate-200 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.02)] flex gap-3 absolute bottom-0 left-0 right-0">
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
      // Backend trả về { success: bool, match: bool, message: str }
      const res = await fetchApi("/patient/payment/verify-face", {
        method: "POST",
        body: { face_base64: base64 }
      });

      // Xác thực thành công nếu match === true
      if (res.match === true || res.success === true) {
        if (viewingInvoice) {
          // Cập nhật trạng thái hoá đơn thành đã thanh toán
          setInvoices(prev => prev.map(inv =>
            inv.id === viewingInvoice.id ? { ...inv, status: 'paid' } : inv
          ));
        }
        setCurrentView("payment_success");
      } else {
        setPaymentError(res.message || "Khuôn mặt không khớp. Vui lòng thử lại.");
        setCurrentView("payment_confirmation");
      }
    } catch (err: any) {
      setPaymentError(err.message || "Lỗi xác thực khuôn mặt. Vui lòng thử lại.");
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

      <div className="flex-1 overflow-y-auto px-4 py-6">
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
                    <img src={selectedBank.img} alt={selectedBank.name} className="w-8 h-8 rounded-full object-contain shrink-0 border border-slate-100" />
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
          <div className="flex justify-between items-center mb-3 mt-2">
            <h3 className="text-slate-800 font-bold text-[16px]">Đến tài khoản</h3>
          </div>

          <div className="space-y-4 mb-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center shadow-sm">
              <img src="/img/vcb.webp" alt="Vietcombank" className="w-10 h-10 rounded-full object-contain mr-4 shrink-0 border border-slate-100" />
              <div>
                <p className="text-slate-400 text-[11px] mb-0.5">Ngân hàng nhận</p>
                <p className="text-slate-800 font-bold text-[15px] uppercase">VIETCOMBANK</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col mb-4">
                <span className="text-slate-400 text-[12px] mb-1">Số tài khoản nhận</span>
                <span className="text-slate-800 font-bold text-[18px] tracking-wide">1029837492 <span className="text-[14px] font-medium text-slate-500 block mt-1">(TRUNG TÂM EYECU)</span></span>
              </div>
              <div className="border-t border-slate-100 my-4" />
              <div className="flex flex-col">
                <span className="text-slate-400 text-[12px] block mb-1">Số tiền chuyển</span>
                <span className="text-blue-600 font-bold text-[24px]">
                  {new Intl.NumberFormat('vi-VN').format(viewingInvoice?.total || 0)} VND
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 border-t border-slate-200 mt-auto shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] pb-[100px]">
        <button 
          disabled={!selectedBank || isVerifyingPaymentFace}
          onClick={() => setCurrentView("payment_face_capture")} 
          className="w-full rounded-2xl bg-[#88E8F2] py-4 text-[16px] font-bold text-[#0d1f2d] shadow-lg disabled:opacity-50 active:scale-95 transition-transform"
        >
          {isVerifyingPaymentFace ? "Đang xử lý..." : "Xác nhận thanh toán"}
        </button>
      </div>

      {showBankList && (
        <div className="absolute inset-0 z-50 flex flex-col bg-slate-900/40 animate-in fade-in duration-200">
          <div className="flex-1" onClick={() => setShowBankList(false)} />
          <div className="bg-white rounded-t-3xl flex flex-col h-[75vh] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <span className="text-[17px] font-bold text-slate-800">Chọn ngân hàng</span>
              <button onClick={() => setShowBankList(false)} className="p-2 bg-slate-100 rounded-full active:scale-95 transition-transform">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="px-5 py-3 border-b border-slate-50 bg-slate-50/50">
              <div className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-sm">
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
              <div className="grid grid-cols-1 gap-2 py-2">
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
    <div className="flex-1 flex flex-col bg-[#0f172a] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto px-5 py-8 flex flex-col items-center">
        <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full max-w-sm mt-8">
          {/* Glowing checkmark */}
          <div className="w-24 h-24 bg-[#def7ec] rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-[#def7ec] rounded-full animate-ping opacity-50"></div>
            <CheckCircle2 className="w-14 h-14 text-emerald-500 relative z-10" />
          </div>
          
          <h2 className="text-[26px] font-bold text-white mb-2">Thanh toán thành công</h2>
          <p className="text-[14px] text-slate-400 mb-6 text-center leading-relaxed">
            Hóa đơn viện phí của bạn đã được thanh toán. Thông tin đã gửi qua SMS & email.
          </p>
          
          <div className="mb-8">
            <p className="text-[36px] font-black text-[#88E8F2] drop-shadow-[0_0_15px_rgba(136,232,242,0.4)]">
              {new Intl.NumberFormat('vi-VN').format(viewingInvoice?.total || 0)} <span className="text-[20px] text-slate-300 font-bold">VND</span>
            </p>
          </div>
          
          {/* Details Card */}
          <div className="bg-[#1e293b] w-full rounded-2xl border border-[#334155] p-5 shadow-lg mb-10">
            <div className="flex justify-between py-3 border-b border-[#334155]">
              <span className="text-[14px] text-slate-400">Mã hóa đơn</span>
              <span className="text-[14px] font-medium text-white">{viewingInvoice?.id.substring(24).toUpperCase()}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-[#334155]">
              <span className="text-[14px] text-slate-400">Dịch vụ</span>
              <span className="text-[14px] font-medium text-white">Thanh toán viện phí</span>
            </div>
            <div className="flex justify-between py-3 border-b border-[#334155]">
              <span className="text-[14px] text-slate-400">Thời gian</span>
              <span className="text-[14px] font-medium text-white">{new Date(viewingInvoice?.date || '').toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex justify-between py-3">
              <span className="text-[14px] text-slate-400">Nơi khám</span>
              <span className="text-[14px] font-bold text-white">TRUNG TÂM EYECU</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setViewingInvoice(null);
              setCurrentView("home");
            }} 
            className="w-full py-4 bg-[#88E8F2] text-[#0d1f2d] rounded-xl font-bold text-[16px] active:scale-95 transition-transform"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );

  const [signTab, setSignTab] = useState<"unsigned" | "signed">("unsigned");

  const renderDigitalSignature = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Ký số giấy tờ</span>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-hide pb-24">
        <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10">
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button 
              onClick={() => setSignTab("unsigned")}
              className={`flex-1 rounded-md py-1.5 text-[14px] font-bold transition-all ${signTab === "unsigned" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
              Chưa ký
            </button>
            <button 
              onClick={() => setSignTab("signed")}
              className={`flex-1 rounded-md py-1.5 text-[14px] font-bold transition-all ${signTab === "signed" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>
              Đã ký
            </button>
          </div>
        </div>

        <div className="flex-1">
          <MapErrorBoundary>
            <Suspense fallback={<div className="flex h-full items-center justify-center text-slate-400">Loading Map...</div>}>
              <PatientPortalMap onClose={() => setActiveTab("home")} />
            </Suspense>
          </MapErrorBoundary>
        </div>
        <div className="flex flex-col gap-3 p-4">
          {(() => {
            const list = signTab === "signed" ? consentForms.filter(f => f.is_signed) : consentForms.filter(f => !f.is_signed);
            if (list.length === 0) {
              return (
                <div className="flex-1 flex items-center justify-center pt-32">
                  <p className="text-[14px] italic text-slate-800 font-serif">Không có dữ liệu</p>
                </div>
              );
            }
            return list.map(f => (
              <div key={f.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-slate-800 leading-tight">{f.name}</h4>
                    <p className="text-[12px] text-slate-500 mt-1 line-clamp-2">{f.content}</p>
                  </div>
                </div>
                {f.is_signed ? (
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <span className="text-[12px] text-slate-500">Ký lúc: {new Date(f.signed_at).toLocaleString('vi-VN')}</span>
                    <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Đã ký</span>
                  </div>
                ) : (
                  <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button 
                      onClick={() => handleSignConsent(f.id)}
                      className="px-4 py-1.5 bg-[#88E8F2] text-[#0d1f2d] text-[13px] font-bold rounded-lg active:scale-95 transition-transform">
                      Ký số ngay
                    </button>
                  </div>
                )}
              </div>
            ));
          })()}
        </div>

        {/* EMERGENCY CALL MODAL */}
        {showEmergencyCall && (
          <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-6 text-white backdrop-blur-md animate-in fade-in zoom-in duration-300">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.5)]">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 animate-pulse">
                <Phone className="h-8 w-8 text-white" />
              </div>
            </div>
            <h2 className="mt-6 text-xl font-bold uppercase tracking-widest text-red-400">Cuộc gọi Khẩn Cấp</h2>
            <p className="mt-2 text-center text-sm text-slate-300">Đang kết nối Video Call đến Bác sĩ trực thuộc khoa Khám bệnh...</p>
            <div className="mt-12 flex gap-4">
              <button
                onClick={() => setShowEmergencyCall(false)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 transition hover:bg-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowEmergencyCall(false)}
                className="flex h-12 items-center gap-2 rounded-full bg-red-600 px-8 font-bold transition hover:bg-red-500"
              >
                Kết thúc
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Map Logic
  const [selectedHospital, setSelectedHospital] = useState<Hospital>(CENTRAL_HOSPITALS[0]);
  const [showHospitalList, setShowHospitalList] = useState(false);
  const [searchHospitalQuery, setSearchHospitalQuery] = useState("");
  const groupedHospitals = getHospitalsByProvince();

  const renderHospitalMap = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setCurrentView("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-bold flex-1 text-center pr-8">Chọn bệnh viện tuyến đầu</span>
      </div>

      <div className="flex-1 relative z-0 h-full w-full">
        {isMounted ? (
          <MapErrorBoundary>
            <Suspense fallback={<div className="w-full h-full bg-slate-100 animate-pulse" />}>
              <PatientPortalMap selectedHospital={selectedHospital} />
            </Suspense>
          </MapErrorBoundary>
        ) : (
          <div className="w-full h-full bg-slate-100 animate-pulse" />
        )}

        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-xl border border-slate-200 p-5 z-[10]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">BỆNH VIỆN ĐÃ CHỌN</p>
              <h4 className="font-bold text-slate-900 text-base mt-1">{selectedHospital.name}</h4>
              <p className="text-xs text-slate-500 mt-1">{selectedHospital.province}</p>
            </div>
            <button 
              onClick={() => setShowHospitalList(true)}
              className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-bold transition active:scale-95"
            >
              Thay đổi
            </button>
          </div>
        </div>
      </div>

        {/* Bottom Sheet for Hospital List */}
        {showHospitalList && (
          <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/60 animate-in fade-in duration-200">
            <div className="flex-1 w-full" onClick={() => setShowHospitalList(false)} />
            <div className="bg-white rounded-t-3xl flex flex-col h-[85%] animate-in slide-in-from-bottom-full duration-300 shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <span className="text-[16px] font-bold text-slate-800">Chọn điểm đến mới</span>
                <button onClick={() => setShowHospitalList(false)} className="p-1 active:bg-slate-100 rounded-full">
                  <X className="h-6 w-6 text-slate-500" />
                </button>
              </div>
              
              <div className="p-4 border-b border-slate-100 bg-slate-50">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm bệnh viện..." 
                  value={searchHospitalQuery}
                  onChange={e => setSearchHospitalQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 text-[14px] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto pb-safe p-4 flex flex-col gap-6">
                {Object.keys(groupedHospitals).sort().map(province => {
                  const hList = groupedHospitals[province].filter(h => h.name.toLowerCase().includes(searchHospitalQuery.toLowerCase()));
                  if (hList.length === 0) return null;
                  
                  return (
                    <div key={province}>
                      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">{province}</h4>
                      <div className="space-y-2">
                        {hList.map(h => (
                          <button 
                            key={h.id}
                            onClick={() => {
                              setSelectedHospital(h);
                              setShowHospitalList(false);
                            }}
                            className={`w-full flex flex-col text-left p-4 rounded-xl border ${selectedHospital.id === h.id ? "border-[#88E8F2] bg-cyan-50" : "border-slate-100 bg-white"} active:scale-[0.98] transition-all`}
                          >
                            <span className={`text-[14px] font-bold ${selectedHospital.id === h.id ? "text-cyan-700" : "text-[#0d1f2d]"}`}>{h.name}</span>
                            <span className="text-[12px] text-slate-500 mt-1 line-clamp-2">{h.province}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
  );

  // Appointment Tab Logic
  const renderAppointmentTab = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <button onClick={() => setActiveTab("home")} className="p-1 active:scale-95">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <span className="text-[17px] font-medium flex-1 pr-8 text-center">Lịch khám</span>
      </div>
      
      <div className="bg-white pt-2 shadow-sm sticky top-0 z-10">
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setAptTab("upcoming")}
            className={`flex-1 pb-3 text-[13px] font-bold uppercase transition-all ${aptTab === "upcoming" ? "text-[#0d1f2d] border-b-2 border-[#88E8F2]" : "text-slate-400"}`}>
            LỊCH KHÁM
          </button>
          <button 
            onClick={() => setAptTab("history")}
            className={`flex-1 pb-3 text-[13px] font-bold uppercase transition-all ${aptTab === "history" ? "text-[#0d1f2d] border-b-2 border-[#88E8F2]" : "text-slate-400"}`}>
            LỊCH TÁI KHÁM
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-24">
        {aptTab === "upcoming" ? (
          <div className="flex flex-col gap-4">
            {appointments.length === 0 ? (
              <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-slate-200">Chưa có lịch khám nào.</div>
            ) : (
              appointments.map((apt, i) => {
                const dateObj = new Date(apt.date);
                const day = dateObj.getDate().toString().padStart(2, '0');
                const monthYear = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                
                return (
                  <div key={i} className="bg-white rounded-xl p-0 flex flex-row overflow-hidden border border-slate-200 shadow-sm">
                     <div className="w-24 bg-white flex flex-col items-center justify-center border-r border-slate-100 py-4">
                        <span className="text-[36px] font-medium text-[#8bb4c8] leading-none">{day}</span>
                        <span className="text-[12px] font-bold text-slate-800 mt-1">{monthYear}</span>
                        <span className="text-[12px] text-slate-500">{apt.time}</span>
                     </div>
                     <div className="flex-1 p-4 flex flex-col justify-center gap-1">
                        <span className="font-bold text-[14px] text-slate-800 uppercase">{user?.name || "BỆNH NHÂN"}</span>
                        <span className="text-[13px] text-slate-600">Khoa: {apt.department}</span>
                        <span className="text-[13px] text-slate-400">Lý do: {apt.reason}</span>
                        <div className="mt-1">
                           <span className="inline-block px-2 py-1 bg-cyan-50 text-cyan-400 text-[11px] font-bold rounded-md">
                             {apt.status === "pending" ? "Đang chờ duyệt" : "Đã xác nhận"}
                           </span>
                        </div>
                     </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {followUps.length === 0 ? (
              <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-slate-200">Chưa có lịch tái khám nào.</div>
            ) : (
              followUps.map((fup, i) => {
                const dateObj = new Date(fup.date);
                const day = dateObj.getDate().toString().padStart(2, '0');
                const monthYear = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                
                return (
                  <div key={i} className="bg-white rounded-xl p-0 flex flex-row overflow-hidden border border-slate-200 shadow-sm">
                     <div className="w-24 bg-white flex flex-col items-center justify-center border-r border-slate-100 py-4 gap-1">
                        <span className="text-[36px] font-medium text-[#8bb4c8] leading-none">{day}</span>
                        <span className="text-[12px] font-bold text-slate-800">{monthYear}</span>
                        <span className="text-[10px] text-red-500 text-center px-1 leading-tight mt-1">Lịch hẹn tái khám</span>
                     </div>
                     <div className="flex-1 p-3 flex flex-col gap-1">
                        <span className="font-bold text-[14px] text-slate-800 uppercase">{user?.name || "BỆNH NHÂN"}</span>
                        <span className="text-[13px] text-slate-600">Khoa: {fup.department}</span>
                        <span className="text-[11px] text-slate-400 mt-1">Ghi chú: {fup.note || "Không có"}</span>
                        <div className="flex gap-2 mt-2">
                           {fup.status === "booked" ? (
                             <span className="w-full text-center py-1.5 bg-green-50 text-green-600 font-bold rounded-md text-[11px]">Đã xác nhận đặt lịch</span>
                           ) : (
                             <button 
                               onClick={() => {
                                 fetchApi(`/patient/follow-ups/${fup.id}/book`, { method: "POST", body: JSON.stringify({}) })
                                   .then(() => {
                                     setFollowUps(prev => prev.map(f => f.id === fup.id ? { ...f, status: "booked" } : f));
                                     alert("Đặt lịch thành công!");
                                   })
                                   .catch(err => alert("Lỗi khi đặt lịch: " + err.message));
                               }} 
                               className="flex-1 py-1.5 bg-[#88E8F2] text-slate-900 font-bold rounded-md text-[11px] active:bg-[#68c6cf]"
                             >
                               Đặt lịch tái khám
                             </button>
                           )}
                        </div>
                     </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Notification Tab Logic
  const renderNotificationTab = () => {
    const groupedNotifications = notifications.reduce((acc, curr) => {
      const d = new Date(curr.created_at);
      const dateStr = `Ngày ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      if (!acc[dateStr]) acc[dateStr] = [];
      acc[dateStr].push(curr);
      return acc;
    }, {} as Record<string, typeof notifications>);

    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
          <span className="text-[17px] font-medium flex-1 text-center pl-8">Thông báo</span>
          <button onClick={() => setNotifications([])} className="p-1 active:scale-95 text-[#0d1f2d]/80">
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Bell className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-[14px]">Không có thông báo nào</span>
            </div>
          ) : (
            Object.entries(groupedNotifications).map(([dateStr, items]) => (
              <div key={dateStr}>
                <div className="px-4 py-2 mt-2">
                  <span className="text-[14px] font-bold text-slate-800">{dateStr}</span>
                </div>
                {items.map((item) => {
                  const d = new Date(item.created_at);
                  const daysAgo = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 3600 * 24));
                  return (
                    <div key={item.id} className={`flex gap-3 p-4 border-b border-slate-100 ${item.is_read ? "bg-white" : "bg-[#f0faeb]/40"} active:bg-slate-50 transition-colors`}>
                      <div className="w-12 h-12 rounded-full border border-slate-200 overflow-hidden shrink-0">
                          <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col">
                          <span className="text-[14px] text-slate-800 font-medium leading-snug">
                            {item.content}
                          </span>
                          <span className="text-[12px] text-slate-400 mt-2">
                            {daysAgo === 0 ? "Hôm nay" : `${daysAgo} ngày trước`}
                          </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Profile Tab Logic
  const renderProfileTab = () => (
    <div className="flex-1 flex flex-col bg-[#f0f2f5] overflow-hidden relative">
      <div className="flex items-center justify-between px-4 py-3 bg-[#88E8F2] text-[#0d1f2d] pt-safe z-10 shrink-0 shadow-sm">
        <span className="text-[17px] font-medium flex-1 text-center">Cá nhân</span>
      </div>
      
      <div className="flex-1 overflow-y-auto overscroll-contain pb-24">
         <div className="bg-white p-4 flex items-center gap-4 border-b border-slate-100">
            <div 
              className="w-16 h-16 rounded-full border border-slate-200 overflow-hidden shrink-0 p-1 relative cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
               <img src={user?.avatar || DEFAULT_AVATAR} alt="avatar" className="w-full h-full rounded-full object-cover" />
               <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center rounded-full">
                  <span className="text-white text-[10px] font-medium">Thay ảnh</span>
               </div>
               <input 
                  type="file" 
                  ref={avatarInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
               />
            </div>
            <div className="flex flex-col">
               <span className="text-[16px] font-bold text-slate-800 uppercase">{user?.name || "BỆNH NHÂN"}</span>
               <span className="text-[14px] text-slate-500 mt-1">{user?.phone || "Chưa cập nhật SĐT"}</span>
            </div>
         </div>

         <div className="bg-white pt-4 pb-2 border-b border-slate-100 mt-1">
            <span className="px-4 text-[14px] font-medium text-slate-800">Tiện ích</span>
            <div className="flex mt-3">
               <button onClick={() => setShowEmergencyModal(true)} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">
                  <div className="text-[#0d1f2d]"><Users className="w-7 h-7" /></div>
                  <span className="text-[12px] text-center px-2 font-medium text-slate-700 leading-tight">Thành viên<br/>gia đình</span>
               </button>
               <button onClick={() => { setActiveTab("home"); setCurrentView("health_record"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">
                  <div className="text-[#0d1f2d]"><ClipboardList className="w-7 h-7" /></div>
                  <span className="text-[12px] text-center px-2 font-medium text-slate-700 leading-tight">Hồ sơ<br/>sức khỏe</span>
               </button>
               <button onClick={() => { setActiveTab("appointment"); setAptTab("history"); }} className="flex-1 flex flex-col items-center gap-2 active:opacity-50">
                  <div className="text-[#0d1f2d]"><CalendarClock className="w-7 h-7" /></div>
                  <span className="text-[12px] text-center px-2 font-medium text-slate-700 leading-tight">Lịch sử<br/>đặt khám</span>
               </button>
            </div>
         </div>

         <div className="mt-2 bg-white border-y border-slate-100">
            <span className="block px-4 py-3 text-[14px] font-medium text-slate-800">Cài đặt</span>
            <div className="pl-4">
               {!isAppInstalled && (
                 <button onClick={handleInstallClick} className="w-full flex items-center justify-between py-3 pr-4 border-b border-slate-100 active:bg-slate-50">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center"><Download className="w-5 h-5 text-blue-500" /></div>
                       <span className="text-[15px] text-slate-700 font-bold">Cài đặt Ứng dụng</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                 </button>
               )}
               <button onClick={() => setShowPasswordModal(true)} className="w-full flex items-center justify-between py-3 pr-4 border-b border-slate-100 active:bg-slate-50">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center"><Lock className="w-5 h-5 text-slate-400" /></div>
                     <span className="text-[15px] text-slate-700">Đổi mật khẩu</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
               </button>
               <div className="w-full flex items-center justify-between py-3 pr-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center"><ScanFace className="w-5 h-5 text-slate-400" /></div>
                     <span className="text-[15px] text-slate-700">Đăng nhập FaceID</span>
                  </div>
                  <div onClick={handleFaceIdToggle} className={`w-12 h-7 rounded-full flex items-center px-0.5 cursor-pointer transition-colors ${faceIdEnabled ? 'bg-[#88E8F2]' : 'bg-slate-300'}`}>
                     <div className={`w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${faceIdEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
               </div>
               <button onClick={() => setLanguage(language === "vi" ? "en" : "vi")} className="w-full flex items-center justify-between py-3 pr-4 border-b border-slate-100 active:bg-slate-50">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center"><Globe className="w-5 h-5 text-slate-400" /></div>
                     <div className="flex flex-col items-start">
                        <span className="text-[15px] text-slate-700 leading-tight">Ngôn ngữ/ Language</span>
                        <span className="text-[13px] text-slate-500 mt-1">{language === "vi" ? "Tiếng Việt" : "English"}</span>
                     </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
               </button>
            </div>
         </div>
         
          <div className="mt-2 bg-white border-y border-slate-100">
             {/* The "Khác" section and "Về BV Nội tiết Trung Ương" button have been removed */}
          </div>
          
         <div className="mt-2 bg-white border-y border-slate-100">
            <button onClick={() => onRequestLogout()} className="w-full flex items-center px-4 py-3 active:bg-slate-50">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center"><LogOut className="w-5 h-5 text-slate-400" /></div>
                  <span className="text-[15px] text-slate-700">Đăng xuất</span>
               </div>
               <ChevronRight className="w-5 h-5 text-slate-400 ml-auto" />
            </button>
         </div>

         <div className="flex flex-col items-center justify-center py-6 gap-2 opacity-70">
            <div className="flex items-center gap-2 text-slate-500">
               <Phone className="w-5 h-5" />
               <span className="text-[14px]">Hotline: <strong className="text-slate-700">115</strong></span>
            </div>
            <span className="text-[12px] text-slate-400">Phiên bản: 22.0 <span className="text-[#0d1f2d] font-medium cursor-pointer" onClick={() => alert('Đã là phiên bản mới nhất')}>Cập nhật</span></span>
         </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col bg-white sm:items-center sm:py-4">
      <div className="relative flex h-full min-h-0 w-full max-w-none flex-col overflow-hidden bg-white sm:h-[min(92dvh,860px)] sm:max-w-[420px] sm:rounded-[2rem] sm:border sm:border-slate-200 sm:shadow-2xl">
        
        {activeTab === "home" ? (
          currentView === "home" ? (
            <>
              {/* 1. Header (Logo + Hotline) */}
              <div className="flex items-center justify-between px-4 py-3 pt-safe bg-white z-10 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 p-1">
                    <img src="/logo.png" alt="EyeCU" className="h-full w-full object-contain" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-[#0d1f2d] uppercase">Cơ sở EyeCU</span>
                    <ChevronRight className="h-3 w-3 text-slate-400 rotate-90" />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-[#88E8F2]/30 px-3 py-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#0d1f2d]" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-[#0d1f2d] leading-none">115</span>
                    <span className="text-[7px] text-[#0d1f2d] uppercase font-semibold">Hotline hỗ trợ</span>
                  </div>
                </div>
              </div>
              {renderHome()}
            </>
          ) : currentView === "health_record" ? (
            renderHealthRecord()
          ) : currentView === "record_lookup" ? (
            renderRecordLookup()
          ) : currentView === "community_qa" ? (
            renderCommunityQa()
          ) : currentView === "ask_question" ? (
            renderAskQuestion()
          ) : currentView === "invoice_list" ? (
            renderInvoiceList()
          ) : currentView === "payment_confirmation" ? (
            renderPaymentConfirmation()
          ) : currentView === "payment_face_capture" ? (
            renderPaymentFaceCapture()
          ) : currentView === "payment_success" ? (
            renderPaymentSuccess()
          ) : currentView === "digital_signature" ? (
            renderDigitalSignature()
          ) : (
            renderHospitalMap()
          )
        ) : activeTab === "appointment" ? (
          renderAppointmentTab()
        ) : activeTab === "notification" ? (
          renderNotificationTab()
        ) : activeTab === "profile" ? (
          renderProfileTab()
        ) : null}

        {/* Camera Scan Modal */}
        {isScanning && (
          <div className="absolute inset-0 z-50 flex flex-col bg-slate-900 animate-in fade-in duration-200 pt-safe pb-safe">
            <div className="flex items-center justify-between px-4 py-3 bg-black/80 z-20">
              <button onClick={() => setIsScanning(false)} className="p-2 -ml-2 text-white/80 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </button>
              <span className="text-white font-bold text-[15px]">Quét mã Hồ sơ</span>
              <div className="w-10" />
            </div>
            
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <video ref={videoRef} playsInline muted autoPlay
                className={`absolute inset-0 h-full w-full object-cover ${cameraError ? "hidden" : ""}`}
              />
              
              {cameraError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center">
                  <FileText className="h-12 w-12 text-[#88E8F2]" />
                  <p className="text-sm leading-relaxed text-white/90">{cameraError}</p>
                </div>
              )}
              
              {!cameraError && (
                <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                  <div className="relative h-64 w-64 rounded-3xl border-2 border-[#88E8F2]/60 shadow-[0_0_0_999px_rgba(15,23,42,0.7)] overflow-hidden">
                    {/* Scanner line animation */}
                    <div className="absolute left-0 right-0 h-1 bg-[#88E8F2] shadow-[0_0_20px_#88E8F2]" 
                         style={{ animation: 'scanLine 2s infinite linear' }} />
                  </div>
                  <p className="mt-8 text-center text-[13px] font-medium text-white/90 drop-shadow-lg max-w-[200px]">
                    Đưa mã vạch hoặc mã QR vào trong khung hình để quét
                  </p>
                </div>
              )}
            </div>
            
            {!cameraError && (
              <div className="flex flex-col items-center justify-center bg-black/90 py-6 pb-12 z-20">
                <button 
                  onClick={() => {
                    setIsScanning(false);
                    // Fake successful scan by placing a value into input or triggering bot. For now just close.
                    setBotOpen(true);
                    setMessages((prev) => [...prev, { from: "bot", text: "Đã quét thành công mã hồ sơ 80969800. Bạn cần mình tra cứu thông tin gì về mã này?", time: getTimeNow() }]);
                  }}
                  className="h-16 w-16 rounded-full border-4 border-white/30 p-1 active:scale-95 transition-transform"
                >
                  <div className="h-full w-full rounded-full bg-white" />
                </button>
                <span className="text-white/60 text-[11px] mt-4 uppercase tracking-widest font-bold">Chụp mã</span>
              </div>
            )}
            <style>{`
              @keyframes scanLine { 0% { top: 0%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
            `}</style>
          </div>
        )}

        {/* Booking Appointment Modal */}
        {showBookingModal && (
          <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/60 animate-in fade-in duration-200">
            <div className="flex-1 w-full" onClick={() => { if(bookStep !== 4) setShowBookingModal(false); }} />
            <div className="bg-white rounded-t-3xl flex flex-col max-h-[90%] animate-in slide-in-from-bottom-full duration-300 shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {bookStep > 1 && bookStep < 4 && (
                    <button onClick={() => setBookStep(s => s-1)} className="p-1 rounded-full active:bg-slate-100">
                      <ArrowLeft className="h-5 w-5 text-slate-600" />
                    </button>
                  )}
                  <span className="text-[17px] font-bold text-slate-800">
                    {bookStep === 1 && "Chọn chuyên khoa"}
                    {bookStep === 2 && "Chọn bác sĩ"}
                    {bookStep === 3 && "Chọn ngày & giờ"}
                    {bookStep === 4 && "Đặt lịch thành công!"}
                  </span>
                </div>
                {bookStep < 4 && (
                  <button onClick={() => setShowBookingModal(false)} className="p-1 active:bg-slate-100 rounded-full">
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Step indicators */}
              {bookStep < 4 && (
                <div className="flex gap-1.5 px-5 py-3 border-b border-slate-50">
                  {[1,2,3].map(s => (
                    <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${
                      s <= bookStep ? "bg-[#88E8F2]" : "bg-slate-200"
                    }`} />
                  ))}
                </div>
              )}

              <div className="flex-1 overflow-y-auto pb-safe">

                {/* ── Step 1: Chọn chuyên khoa ───────────────────── */}
                {bookStep === 1 && (
                  <div className="p-4">
                    {deptsList.length === 0 ? (
                      <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {deptsList.map(d => (
                          <button
                            key={d.id}
                            onClick={() => handleSelectDept(d.id, d.name)}
                            className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 active:bg-[#88E8F2]/30 active:border-[#88E8F2] transition-all shadow-sm text-center"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-50">
                              <Stethoscope className="h-5 w-5 text-[#0d1f2d]" />
                            </div>
                            <span className="text-[12px] font-semibold text-slate-700 leading-tight">{d.name.replace("Khoa ", "")}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Step 2: Chọn bác sĩ ──────────────────────────── */}
                {bookStep === 2 && (
                  <div className="p-4 flex flex-col gap-3">
                    <p className="text-[13px] text-slate-500 mb-1">Chuyên khoa: <span className="font-semibold text-slate-800">{selectedDeptName}</span></p>

                    {/* Chọn ngẫu nhiên */}
                    <button
                      onClick={() => handleSelectDoctor("random", "Bác sĩ ngẫu nhiên")}
                      className="flex items-center gap-4 rounded-2xl border-2 border-[#88E8F2] bg-cyan-50 p-4 active:bg-[#88E8F2]/40 transition-all"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0d1f2d]">
                        <Users className="h-6 w-6 text-[#88E8F2]" />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-[#0d1f2d]">Bác sĩ ngẫu nhiên</p>
                        <p className="text-[12px] text-slate-500">Hệ thống tự phân công bác sĩ phù hợp nhất</p>
                      </div>
                    </button>

                    {/* Danh sách bác sĩ cụ thể */}
                    {doctorsList.length > 0 && (
                      <>
                        <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mt-1">Hoặc chọn bác sĩ</p>
                        {doctorsList.map(doc => (
                          <button
                            key={doc.id}
                            onClick={() => handleSelectDoctor(doc.id, doc.name)}
                            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50 transition-all"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100">
                              <User className="h-6 w-6 text-slate-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-slate-800">{doc.name}</p>
                              <p className="text-[12px] text-slate-400">Bác sĩ chuyên khoa</p>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                    {doctorsList.length === 0 && (
                      <p className="text-center text-[13px] text-slate-400 py-4">Không tìm thấy bác sĩ nào trong khoa. Hệ thống sẽ tự động phân công.</p>
                    )}
                  </div>
                )}

                {/* ── Step 3: Chọn ngày & giờ ─────────────────────── */}
                {bookStep === 3 && (
                  <div className="p-4">
                    <p className="text-[13px] text-slate-500 mb-3">
                      Bác sĩ: <span className="font-semibold text-slate-800">{selectedDoctorName}</span>
                    </p>

                    {/* Date picker */}
                    <div className="mb-5">
                      <label className="block text-[13px] font-bold text-slate-600 mb-2">Chọn ngày khám</label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().split("T")[0]}
                        max={new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]}
                        onChange={e => handleDateChange(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[15px] font-medium text-[#0d1f2d] outline-none focus:border-[#88E8F2] focus:ring-1 focus:ring-[#88E8F2]"
                      />
                    </div>

                    {/* Time slots grid */}
                    {bookingDate && (
                      <div>
                        <label className="block text-[13px] font-bold text-slate-600 mb-2">Chọn giờ khám</label>
                        <div className="grid grid-cols-3 gap-2">
                          {TIME_SLOTS.map(slot => {
                            const isBooked = bookedSlots.includes(slot);
                            const isSelected = bookingTime === slot;
                            return (
                              <button
                                key={slot}
                                disabled={isBooked}
                                onClick={() => !isBooked && setBookingTime(slot)}
                                className={`rounded-xl py-3 text-[14px] font-semibold border transition-all ${
                                  isBooked
                                    ? "bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed line-through"
                                    : isSelected
                                    ? "bg-[#0d1f2d] text-white border-[#0d1f2d] shadow-lg"
                                    : "bg-white text-slate-700 border-slate-200 active:bg-[#88E8F2]/40"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Confirm button */}
                    {bookingTime && bookingDate && (
                      <button
                        onClick={handleBookingSubmit}
                        disabled={submittingBooking}
                        className="mt-6 w-full rounded-full bg-[#88E8F2] py-4 text-[16px] font-bold text-[#0d1f2d] shadow-lg active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {submittingBooking ? "Đang xử lý..." : `Xác nhận đặt lịch · ${bookingTime}`}
                      </button>
                    )}
                  </div>
                )}

                {/* ── Step 4: Thành công ─────────────────────────────── */}
                {bookStep === 4 && bookSuccess && (
                  <div className="flex flex-col items-center justify-center p-8 gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-4 border-emerald-200">
                      <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                    </div>
                    <h2 className="text-[20px] font-bold text-slate-800 text-center">Đặt lịch thành công!</h2>
                    <div className="w-full bg-slate-50 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between text-[14px]">
                        <span className="text-slate-500">Chuyên khoa</span>
                        <span className="font-semibold text-slate-800">{bookSuccess.dept}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-slate-500">Bác sĩ</span>
                        <span className="font-semibold text-slate-800">{bookSuccess.doctorName}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-slate-500">Ngày khám</span>
                        <span className="font-semibold text-slate-800">{new Date(bookSuccess.date + "T00:00:00").toLocaleDateString("vi-VN", {day:"2-digit",month:"2-digit",year:"numeric"})}</span>
                      </div>
                      <div className="flex justify-between text-[14px]">
                        <span className="text-slate-500">Giờ khám</span>
                        <span className="font-semibold text-[#0d1f2d] text-[16px]">{bookSuccess.time}</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-slate-400 text-center">Vui lòng đến đúng giờ. Bác sĩ sẽ nhận thông báo ngay lập tức.</p>
                    <button
                      onClick={() => { setShowBookingModal(false); setBookStep(1); }}
                      className="w-full rounded-full bg-[#0d1f2d] py-4 text-[16px] font-bold text-white active:scale-95 transition-transform"
                    >
                      Hoàn tất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal Hướng dẫn cài đặt iOS */}
        {showIosPrompt && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
            <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl relative animate-in zoom-in-95">
              <button 
                onClick={() => setShowIosPrompt(false)}
                className="absolute right-3 top-3 p-1 rounded-full bg-slate-100 text-slate-500 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              
              <h3 className="text-[18px] font-bold text-center text-[#0d1f2d] mb-2">Cài đặt Ứng dụng</h3>
              <p className="text-[14px] text-center text-slate-600 mb-6">
                Để cài đặt EyeCU lên iPhone/iPad của bạn, vui lòng làm theo 2 bước sau:
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-500">1</div>
                  <p className="text-[14px] text-slate-700 pt-1">
                    Nhấn vào biểu tượng <Share className="w-4 h-4 inline-block mx-1 text-blue-600" /> <b>Chia sẻ</b> ở thanh công cụ dưới cùng của trình duyệt Safari.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-[14px] font-bold text-slate-500">2</div>
                  <p className="text-[14px] text-slate-700 pt-1">
                    Kéo xuống và chọn <PlusSquare className="w-4 h-4 inline-block mx-1 text-slate-800" /> <b>Thêm vào MH chính</b> (Add to Home Screen).
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setShowIosPrompt(false)}
                className="w-full py-3 bg-[#88E8F2] text-[#0d1f2d] font-bold rounded-xl active:scale-95"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="absolute inset-0 z-[60] flex flex-col justify-end bg-black/60 animate-in fade-in duration-200" onClick={() => setShowPasswordModal(false)}>
            <div className="bg-white rounded-t-3xl w-full p-6 flex flex-col animate-in slide-in-from-bottom-8 duration-300 relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 active:scale-95">
                <X className="h-5 w-5" />
              </button>
              
              <h3 className="text-[20px] font-bold text-slate-800 mb-6 text-center">Đổi mật khẩu</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Mật khẩu cũ</label>
                  <input type="password" placeholder="Nhập mật khẩu hiện tại" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#88E8F2] focus:bg-white transition-colors" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Mật khẩu mới</label>
                  <input type="password" placeholder="Nhập mật khẩu mới" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#88E8F2] focus:bg-white transition-colors" />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[13px] font-bold text-slate-700">Nhập lại mật khẩu mới</label>
                  <input type="password" placeholder="Xác nhận mật khẩu mới" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#88E8F2] focus:bg-white transition-colors" />
                </div>
              </div>
              
              <button onClick={() => { alert('Đổi mật khẩu thành công!'); setShowPasswordModal(false); }} className="w-full mt-8 py-3.5 bg-[#88E8F2] text-[#0d1f2d] font-bold rounded-xl active:scale-95 transition-transform shadow-md shadow-cyan-900/10">
                Xác nhận đổi mật khẩu
              </button>
            </div>
          </div>
        )}

        {/* Floating SmartBot */}
        {!botOpen && (
          <div 
            className="absolute z-[100] sm:right-6 touch-none"
            style={{ 
               bottom: '6rem', 
               right: '1rem',
               transform: `translate(${botPos.x}px, ${botPos.y}px)`
            }}
          >
            <button
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-white transition-transform hover:scale-105 shadow-2xl overflow-hidden active:scale-95"
              style={{ boxShadow: "0 8px 30px rgba(13,31,45,0.2)" }}
            >
              <img src="/chatbot_khongnen.png" alt="AI Chatbot" className="w-full h-full object-cover pointer-events-none select-none" />
              {/* Optional glowing effect for the bot icon */}
              <div className="absolute inset-0 rounded-full bg-[#88E8F2] opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
            </button>
          </div>
        )}

        {botOpen && (
          <div className="fixed sm:absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 animate-in fade-in duration-200">
            <div className="flex h-[75dvh] max-h-[600px] w-full max-w-[360px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex items-center gap-2 bg-[#88E8F2] px-4 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#0d1f2d]/10 overflow-hidden">
                  <img src="/chatbot_khongnen.png" alt="Bot" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-[#0d1f2d]">Trợ lý AI EyeCU</p>
                  <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-[#0d1f2d]/70">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#0d1f2d]" />Trực tuyến
                  </p>
                </div>
                <button 
                  onClick={() => setAutoPlayTTS(!autoPlayTTS)} 
                  className={`flex items-center justify-center p-1.5 rounded-full transition-colors ${autoPlayTTS ? "bg-[#0d1f2d]/10 text-[#0d1f2d]" : "text-[#0d1f2d]/40 hover:bg-[#0d1f2d]/5"}`}
                  title={autoPlayTTS ? "Tắt tự động đọc" : "Bật tự động đọc"}
                >
                  {autoPlayTTS ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <button onClick={() => setBotOpen(false)} className="text-[#0d1f2d]/50 transition hover:text-[#0d1f2d] ml-1"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3 scrollbar-hide">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.from === "bot" && (
                      <div className="mr-1.5 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#88E8F2] overflow-hidden">
                        <img src="/chatbot_khongnen.png" alt="Bot" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.from === "user" ? "rounded-br-sm bg-[#0d1f2d] text-white" : "rounded-bl-sm border border-slate-100 bg-white text-slate-800 shadow-sm"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        {msg.from === "bot" && (
                          <button 
                            onClick={() => playTTS(msg.text, i)}
                            className={`mt-0.5 flex-shrink-0 p-1 rounded-full transition-colors ${playingTTSMsgIdx === i ? "bg-[#88E8F2]/30 text-[#0d1f2d]" : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"}`}
                            title="Nghe tin nhắn"
                          >
                            {playingTTSMsgIdx === i && !isTTSPaused ? <Pause className="h-3.5 w-3.5 animate-pulse" /> : <Volume2 className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                      
                      {/* Render Buttons from VNPT card_data if exist */}
                      {msg.from === "bot" && msg.raw?.data?.[0]?.card_data?.buttons && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {msg.raw.data[0].card_data.buttons.map((btn: any, bIdx: number) => (
                            <button
                              key={bIdx}
                              onClick={() => sendMessage(btn.payload || btn.title)}
                              className="rounded-lg bg-[#88E8F2]/10 px-3 py-1.5 text-left text-[12px] font-semibold text-[#0d1f2d] transition hover:bg-[#88E8F2]/20"
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {msg.from === "bot" && msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {msg.buttons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => sendMessage(btn.title, btn.payload || btn.payload_id)}
                              className="px-2.5 py-1.5 text-[11px] font-semibold rounded-[10px] border border-[#88E8F2] text-[#0d1f2d] bg-[#88E8F2]/10 hover:bg-[#88E8F2]/30 active:scale-95 transition-all text-left"
                              style={{ backgroundColor: btn.color ? `${btn.color}30` : undefined, borderColor: btn.color }}
                            >
                              {btn.title}
                            </button>
                          ))}
                        </div>
                      )}

                      {msg.images && msg.images.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-2">
                          {msg.images.map((url, idx) => (
                            <img key={idx} src={url} alt="Attached Image" className="rounded-xl max-w-full h-auto object-contain border border-slate-200" />
                          ))}
                        </div>
                      )}
                      <p className={`mt-1.5 text-[9px] font-medium ${msg.from === "user" ? "text-white/60" : "text-slate-400"}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                {botTyping && (
                  <div className="flex justify-start">
                    <div className="mr-1.5 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#88E8F2] overflow-hidden">
                      <img src="/chatbot_khongnen.png" alt="Bot" className="h-full w-full object-cover" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-100 bg-white px-4 py-3 shadow-sm">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400" style={{ animation: `bounce 1s infinite ${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-slate-100 bg-white p-2">
                <button
                  onClick={() => isRecording ? stopRecording() : startRecording()}
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition active:scale-95 ${
                    isRecording ? "bg-red-500 animate-pulse text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  title="Ghi âm"
                >
                  <Mic className="h-4 w-4" />
                </button>
                <div className="relative flex-1">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder={isTranscribing ? "Đang nhận diện giọng nói..." : (isRecording ? "Đang ghi âm..." : "Hỏi trợ lý AI...")}
                    disabled={isTranscribing || isRecording}
                    className="w-full min-w-0 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#88E8F2] disabled:opacity-50"
                  />
                  {isTranscribing && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#88E8F2] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#88E8F2]"></span>
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={() => sendMessage()}
                  disabled={isTranscribing || isRecording || !chatInput.trim()}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#88E8F2] transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 text-[#0d1f2d] ml-0.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Bottom Navigation Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-50 flex h-[68px] items-center justify-between border-t border-slate-200 bg-white px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {[
            { id: "home", icon: Home, label: "Trang chủ" },
            { id: "appointment", icon: Calendar, label: "Lịch hẹn" },
            { id: "notification", icon: Bell, label: "Thông báo" },
            { id: "profile", icon: User, label: "Cá nhân" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 flex-col items-center justify-center gap-1 pt-1 ${isActive ? "text-[#0d1f2d]" : "text-slate-400"}`}
              >
                <div className={`flex h-8 w-16 items-center justify-center rounded-2xl transition-colors ${isActive ? "bg-[#88E8F2]" : ""}`}>
                  <tab.icon className={`h-[22px] w-[22px] ${isActive ? "text-[#0d1f2d]" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-medium ${isActive ? "text-[#0d1f2d] font-bold" : ""}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Lab Camera Modal */}
        {isScanningLab && (
          <div className="fixed sm:absolute inset-0 z-[60] flex flex-col bg-slate-900 animate-in fade-in duration-200 pt-safe pb-safe touch-none overscroll-none">
            <div className="relative flex flex-1 items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
              />
              {cameraError && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
                  <Camera className="mb-4 h-12 w-12 text-red-400" />
                  <p className="text-white font-medium">{cameraError}</p>
                  <button
                    onClick={() => { setIsScanningLab(false); stopCamera(); }}
                    className="mt-6 rounded-full bg-white/20 px-6 py-2.5 font-medium text-white transition active:bg-white/30"
                  >
                    Đóng
                  </button>
                </div>
              )}
              {/* Cutout Mask with 4 panels for true backdrop blur outside */}
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
                <div className="w-full h-6 bg-slate-900/60 backdrop-blur-md" />
                <div className="flex flex-1">
                  <div className="w-6 h-full bg-slate-900/60 backdrop-blur-md" />
                  <div className="flex-1 relative rounded-3xl border-2 border-dashed border-[#88E8F2] flex items-center justify-center">
                    <div className="absolute inset-0 shadow-[0_0_0_999px_rgba(15,23,42,0.1)] rounded-3xl pointer-events-none" />
                    <p className="px-4 text-center text-sm font-medium text-white opacity-100 drop-shadow-lg">
                      Đưa giấy xét nghiệm vào khung
                    </p>
                    {isAnalyzingLab && (
                      <div className="absolute left-0 right-0 h-1 bg-[#88E8F2] shadow-[0_0_20px_#88E8F2] animate-scan" />
                    )}
                  </div>
                  <div className="w-6 h-full bg-slate-900/60 backdrop-blur-md" />
                </div>
                <div className="w-full h-6 bg-slate-900/60 backdrop-blur-md" />
              </div>
            </div>
            <div className="flex h-36 shrink-0 items-center justify-around bg-black px-6">
              <button
                onClick={() => { setIsScanningLab(false); stopCamera(); }}
                className="px-4 py-2 font-medium text-white opacity-80"
              >
                Hủy
              </button>
              <button
                onClick={handleCaptureLab}
                disabled={isAnalyzingLab}
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-[#88E8F2] p-1.5 transition-transform active:scale-95 disabled:opacity-60"
              >
                <div className={`h-full w-full rounded-full bg-white ${isAnalyzingLab ? "animate-pulse bg-[#88E8F2]" : ""}`} />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full bg-white/10 px-3 py-2 text-[11px] font-semibold text-white"
              >
                Thư viện
              </button>
            </div>
            {isAnalyzingLab && (
              <div className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md">
                <ScanLine className="mb-6 h-20 w-20 animate-pulse text-[#88E8F2]" />
                <h3 className="text-xl font-bold tracking-tight text-white">Đang phân tích tài liệu...</h3>
                <p className="mt-2 font-mono text-sm uppercase tracking-widest text-[#88E8F2]">VNPT SmartReader AI</p>
              </div>
            )}
            <style>{`
              @keyframes scan { 0% { top: 0%; } 50% { top: 100%; } 100% { top: 0%; } }
              .animate-scan { animation: scan 2s linear infinite; }
            `}</style>
          </div>
        )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelectedLab}
      />
      </div>
      
      {/* Emergency Contact Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-blue-50/50">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#0d1f2d] text-base">Liên hệ khẩn cấp</h3>
                <p className="text-[13px] text-slate-500">Thông tin người liên hệ lúc cần thiết</p>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              {user?.emergency_contact_name || user?.emergency_contact_phone ? (
                <>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Người liên hệ</p>
                    <p className="text-sm font-semibold text-slate-800">{user.emergency_contact_name || "Trống"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase mb-1">Số điện thoại</p>
                      <p className="text-sm font-semibold text-slate-800">{user.emergency_contact_phone || "Trống"}</p>
                    </div>
                    {user.emergency_contact_phone && (
                      <a href={`tel:${user.emergency_contact_phone}`} className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center active:bg-blue-200">
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <Info className="w-6 h-6" />
                  </div>
                  <p className="text-[14px] text-slate-500 font-medium">Không có dữ liệu</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowEmergencyModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-700 font-bold active:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Prompt Modal for iOS */}
      {showAudioPrompt && !audioUnlocked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <span className="text-3xl">🔊</span>
            </div>
            <h3 className="text-lg font-bold text-[#0d1f2d] mb-2">Bật âm thanh tự động?</h3>
            <p className="text-[14px] text-slate-500 mb-6">
              Bạn có muốn trợ lý tự động phát âm thanh khi phản hồi không? Bạn có thể thay đổi sau.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setAutoPlayTTS(false);
                  setShowAudioPrompt(false);
                  setAudioUnlocked(true);
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold active:bg-slate-200"
              >
                Không
              </button>
              <button 
                onClick={() => {
                  setAutoPlayTTS(true);
                  setShowAudioPrompt(false);
                  setAudioUnlocked(true);
                  const silentAudio = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=");
                  silentAudio.play().catch(() => {});
                }}
                className="flex-1 py-3 rounded-xl bg-[#88E8F2] text-[#0d1f2d] font-bold active:bg-cyan-300"
              >
                Có, bật
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
