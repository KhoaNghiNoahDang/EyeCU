import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { api } from "../lib/api/client";
import { useAuth } from "../lib/auth/auth-context";

export const Route = createFileRoute("/voice")({
  component: VoiceEmrPage,
});

function VoiceEmrPage() {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [soapeData, setSoapeData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setErrorMsg("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, sampleRate: 16000 },
      });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        const formData = new FormData();
        formData.append("audio", audioBlob, "record.wav");
        formData.append("patient_id", "P-12345"); // Mặc định demo

        try {
          const res = await api.post("/api/voice/emr", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          if (res.data.success) {
            setTranscript(res.data.transcript);
            setSoapeData(res.data.soape);
          } else {
            setErrorMsg(res.data.message || "Lỗi khi xử lý giọng nói");
          }
        } catch (err: any) {
          setErrorMsg(err.response?.data?.detail || "Lỗi kết nối máy chủ");
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setErrorMsg("Không thể truy cập Microphone. Vui lòng cấp quyền.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-slate-800">Voice EMR (SOAPE)</h1>
        <p className="text-slate-500 mt-2">Bác sĩ: {user?.full_name || "Khách"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Recording & Transcript */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4">Ghi âm Lâm sàng</h2>
          <div className="flex items-center justify-center p-8 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200 mb-6">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isProcessing}
                className="w-32 h-32 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 flex flex-col items-center justify-center transition-all duration-300 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-4xl mb-2">mic</span>
                <span className="font-medium">Bắt đầu thu</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-32 h-32 rounded-full bg-red-100 hover:bg-red-200 text-red-600 flex flex-col items-center justify-center transition-all duration-300 animate-pulse"
              >
                <span className="material-symbols-outlined text-4xl mb-2">stop</span>
                <span className="font-medium">Dừng & Xử lý</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
              {errorMsg}
            </div>
          )}

          <div className="bg-slate-50 rounded-lg p-4 h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase">Văn bản thô (Transcript)</h3>
            {isProcessing ? (
              <div className="flex items-center text-slate-400 space-x-2">
                <span className="material-symbols-outlined animate-spin">refresh</span>
                <span>Đang gửi VNPT SmartVoice xử lý...</span>
              </div>
            ) : (
              <p className="text-slate-700 whitespace-pre-wrap">
                {transcript || "Chưa có dữ liệu..."}
              </p>
            )}
          </div>
        </div>

        {/* Right Column: SOAPE JSON View */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-4 text-emerald-700">Phiếu khám SOAPE (AI Generated)</h2>
          <div className="space-y-4">
            <SoapeField label="Subjective (S)" value={soapeData?.subjective} isProcessing={isProcessing} />
            <SoapeField label="Objective (O)" value={soapeData?.objective} isProcessing={isProcessing} />
            <SoapeField label="Assessment (A)" value={soapeData?.assessment} isProcessing={isProcessing} />
            <SoapeField label="Plan (P)" value={soapeData?.plan} isProcessing={isProcessing} />
            <SoapeField label="Evaluation (E)" value={soapeData?.evaluation} isProcessing={isProcessing} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SoapeField({ label, value, isProcessing }: { label: string; value?: string; isProcessing: boolean }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-600 mb-1">{label}</label>
      <div className="w-full bg-emerald-50/50 border border-emerald-100 rounded-md p-3 min-h-16 text-slate-800">
        {isProcessing ? (
          <div className="animate-pulse flex space-x-2">
            <div className="h-4 w-3/4 bg-emerald-200/50 rounded"></div>
          </div>
        ) : (
          <p className="text-sm">{value || "-"}</p>
        )}
      </div>
    </div>
  );
}
