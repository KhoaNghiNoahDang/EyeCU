# File: app/services/diarization.py
#
# Service phân tách người nói (Speaker Diarization) dùng Pyannote.audio
# Chiến thuật: Pyannote → timestamps → cắt WAV bằng pydub → gửi từng đoạn lên VNPT STT
#

import io
import asyncio
import logging
import tempfile
import os
from typing import List

logger = logging.getLogger(__name__)

# Pyannote được load lazily để không làm chậm startup của server
_pipeline = None


def _get_pipeline():
    """Load Pyannote pipeline lần đầu tiên khi cần dùng (lazy loading)."""
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    try:
        from pyannote.audio import Pipeline
        from app.core.config import settings

        token = settings.HUGGINGFACE_TOKEN
        if not token:
            raise ValueError("HUGGINGFACE_TOKEN chưa được cấu hình trong .env")

        logger.info("[Diarization] Loading pyannote/speaker-diarization-3.1 từ HuggingFace...")
        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            token=token
        )
        logger.info("[Diarization] Pipeline đã load thành công!")
        return _pipeline
    except Exception as e:
        logger.error(f"[Diarization] Không thể load Pyannote pipeline: {e}")
        raise


async def diarize_and_transcribe(
    wav_bytes: bytes,
    vnpt_stt_func,
    max_speakers: int = 3,
) -> dict:
    """
    Phân tách người nói từ file WAV, rồi dùng VNPT STT để dịch từng đoạn.

    Args:
        wav_bytes: Audio raw bytes định dạng WAV 16kHz mono
        vnpt_stt_func: Async callable gọi VNPT STT — signature: (bytes, filename, content_type) -> dict
        max_speakers: Số người nói tối đa dự kiến

    Returns:
        {
            "transcript_diarized": "Speaker_1: ...\nSpeaker_2: ...",
            "speakers_detected": 2,
            "segments": [...],
            "error": None
        }
    """
    try:
        pipeline = await asyncio.get_event_loop().run_in_executor(None, _get_pipeline)
    except Exception as e:
        return {
            "transcript_diarized": "",
            "speakers_detected": 0,
            "segments": [],
            "error": f"Không thể load Pyannote: {str(e)}",
        }

    # ── Bước 1: Chạy Pyannote để lấy timestamps ─────────────────────────────
    try:
        import torch
        import soundfile as sf
        
        # Đọc âm thanh bằng soundfile và chuyển sang tensor PyTorch
        # Điều này giúp vượt qua lỗi torchcodec/torchaudio và lỗi audioop của pydub trên Python 3.14
        data, samplerate = sf.read(io.BytesIO(wav_bytes))
        
        # Đảm bảo audio là mono (1 channel)
        if len(data.shape) > 1:
            data = data.mean(axis=1)
            
        # Resample về 16000 nếu cần (tuy nhiên convert_webm_to_wav đã chuyển về 16k rồi)
        import numpy as np
        waveform = torch.from_numpy(data).float().unsqueeze(0) # shape: (1, time)
        
        def _run_pipeline():
            diarization_out = pipeline(
                {"waveform": waveform, "sample_rate": samplerate},
                max_speakers=max_speakers,
            )
            if hasattr(diarization_out, 'speaker_diarization'):
                return diarization_out.speaker_diarization
            return diarization_out

        logger.info("[Diarization] Đang chạy pyannote pipeline qua tensor dictionary...")
        diarization = await asyncio.get_event_loop().run_in_executor(None, _run_pipeline)

    except Exception as e:
        logger.error(f"[Diarization] Lỗi khi chạy pipeline: {e}")
        return {
            "transcript_diarized": "",
            "speakers_detected": 0,
            "segments": [],
            "error": f"Pyannote pipeline thất bại: {str(e)}",
        }

    # ── Bước 2: Cắt WAV thành từng đoạn theo timestamp ──────────────────────
    try:
        # Pydub was removed to fix pyaudioop issue on Python 3.14

        segments_info = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            start_ms = int(turn.start * 1000)
            end_ms = int(turn.end * 1000)

            # Bỏ qua các đoạn quá ngắn (dưới 0.5 giây) — thường là nhiễu
            if (end_ms - start_ms) < 500:
                continue

            segments_info.append({
                "speaker": speaker,
                "start_ms": start_ms,
                "end_ms": end_ms,
            })

        logger.info(f"[Diarization] Phát hiện {len(segments_info)} đoạn từ {len(set(s['speaker'] for s in segments_info))} người nói")

    except Exception as e:
        logger.error(f"[Diarization] Lỗi khi cắt audio: {e}")
        return {
            "transcript_diarized": "",
            "speakers_detected": 0,
            "segments": [],
            "error": f"Lỗi cắt audio: {str(e)}",
        }

    if not segments_info:
        return {
            "transcript_diarized": "",
            "speakers_detected": 0,
            "segments": [],
            "error": "Không phát hiện đoạn nào sau diarization",
        }

    # ── Bước 3: Gửi từng đoạn lên VNPT STT ─────────────────────────────────
    # Dùng asyncio.gather để gọi song song → giảm tổng thời gian chờ

    async def transcribe_segment(seg: dict) -> dict:
        import soundfile as sf
        start_sample = int(seg["start_ms"] * samplerate / 1000)
        end_sample = int(seg["end_ms"] * samplerate / 1000)
        clip_data = data[start_sample:end_sample]

        buf = io.BytesIO()
        sf.write(buf, clip_data, samplerate, format='WAV', subtype='PCM_16')
        clip_bytes = buf.getvalue()

        try:
            result = await vnpt_stt_func(clip_bytes, "segment.wav", "audio/wav")
            text = result.get("transcript", "").strip()
            if "error" in result.get("raw", {}):
                logger.warning(f"[Diarization] VNPT STT trả về lỗi cho đoạn {start_sample}-{end_sample}: {result['raw']['error']}")
            else:
                logger.warning(f"[Diarization] Đoạn {start_sample}-{end_sample} STT result: {text}")
        except Exception as e:
            logger.warning(f"[Diarization] STT thất bại cho đoạn {seg}: {e}")
            text = ""

        return {**seg, "transcript": text}

    logger.warning(f"[Diarization] Gửi {len(segments_info)} đoạn lên VNPT STT (tuần tự để tránh rate limit)...")
    transcribed_segments = []
    for s in segments_info:
        res = await transcribe_segment(s)
        transcribed_segments.append(res)

    # ── Bước 4: Ghép transcript theo thứ tự thời gian ──────────────────────
    # Chuẩn hóa tên Speaker: SPEAKER_00 → Bác_sĩ hoặc Bệnh_nhân (sau này Gemini sẽ tự xác định)
    lines = []
    speaker_map = {}
    speaker_counter = 1
    for seg in sorted(transcribed_segments, key=lambda x: x["start_ms"]):
        if not seg["transcript"]:
            continue
        raw_speaker = seg["speaker"]
        if raw_speaker not in speaker_map:
            speaker_map[raw_speaker] = f"Speaker_{speaker_counter}"
            speaker_counter += 1
        label = speaker_map[raw_speaker]
        lines.append(f"{label}: {seg['transcript']}")

    transcript_diarized = "\n".join(lines)
    speakers_detected = len(speaker_map)

    logger.info(f"[Diarization] Hoàn thành! {speakers_detected} người nói, {len(lines)} câu")

    return {
        "transcript_diarized": transcript_diarized,
        "speakers_detected": speakers_detected,
        "segments": list(transcribed_segments),
        "error": None,
    }
