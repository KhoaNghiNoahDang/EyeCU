import time
import numpy as np
import threading
try:
    import sounddevice as sd
except ImportError:
    sd = None
    print("[WARN] Khong the import sounddevice. Tinh nang Audio Fall Detection se bi vo hieu hoa.")

# Nguong am thanh va thoi gian luu vet (seconds)
AUDIO_THRESHOLD_RMS = 0.05  # Nguong RMS du lon (co the dieu chinh) de phat hien tieng va dap
LOUD_NOISE_WINDOW = 3.0     # 3 giay

class AudioDetector:
    def __init__(self):
        self._last_loud_time = 0.0
        self._last_rms = 0.0
        self._is_running = False
        self._stream = None

    def start(self):
        if sd is None:
            return
            
        self._is_running = True
        # Khoi chay luong lang nghe am thanh (non-blocking)
        def callback(indata, frames, time_info, status):
            if status:
                pass
            
            # Tinh toan RMS cua chunk am thanh
            rms = np.sqrt(np.mean(indata**2))
            self._last_rms = float(rms)  # Luon cap nhat de tinh xac suat
            
            # Neu RMS vuot nguong -> co tieng dong lon
            if rms > AUDIO_THRESHOLD_RMS:
                self._last_loud_time = time.time()
                # Debug in ra de kiem tra
                # print(f"[AUDIO] Phat hien tieng dong lon (RMS: {rms:.4f})")

        try:
            self._stream = sd.InputStream(samplerate=16000, channels=1, callback=callback)
            self._stream.start()
            print("[OK] AudioDetector dang lang nghe (16000Hz)...")
        except Exception as e:
            print(f"[ERROR] Loi khoi tao AudioDetector: {e}")
            self._is_running = False

    def stop(self):
        self._is_running = False
        if self._stream is not None:
            self._stream.stop()
            self._stream.close()

    def is_loud_noise_recently(self) -> bool:
        if not self._is_running:
            return False
        # Tra ve True neu co tieng dong lon trong vong LOUD_NOISE_WINDOW giay qua
        return (time.time() - self._last_loud_time) < LOUD_NOISE_WINDOW

    def get_audio_prob(self) -> float:
        """Tra ve xac suat am thanh nga 0.0-1.0 dua tren RMS cuoi cung.
        0% = yen lang, 100% = tieng dong manh (> 3x nguong).
        """
        # Chuan hoa: nguong = 33%, 3x nguong = 100%
        return min(1.0, self._last_rms / (AUDIO_THRESHOLD_RMS * 3))

# Instance toàn cục để main.py có thể dùng chung
audio_detector = AudioDetector()
