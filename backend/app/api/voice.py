import re
import json
import subprocess
import tempfile
import os
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.security import require_roles
from app.services.vnpt_api import vnpt_client

router = APIRouter()


@router.post(
    "/emr", dependencies=[Depends(require_roles(["doctor", "clinician", "admin"]))]
)
async def process_voice_emr(
    audio: UploadFile = File(...), patient_id: str = Form("123")
):
    audio_bytes = await audio.read()

    # Convert audio to 16kHz Mono WAV using ffmpeg
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
        tmp_in.write(audio_bytes)
        tmp_in_path = tmp_in.name

    tmp_out_path = tmp_in_path + ".wav"

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in_path, "-ac", "1", "-ar", "16000", tmp_out_path],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        with open(tmp_out_path, "rb") as f:
            wav_bytes = f.read()
    except Exception as e:
        # Fallback to original bytes if ffmpeg fails
        wav_bytes = audio_bytes
    finally:
        if os.path.exists(tmp_in_path):
            os.remove(tmp_in_path)
        if os.path.exists(tmp_out_path):
            os.remove(tmp_out_path)

    # 1. Speech To Text qua VNPT SmartVoice (Always send standard WAV)
    stt_result = await vnpt_client.call_smartvoice_stt(
        wav_bytes, 
        filename="record.wav", 
        content_type="audio/wav"
    )
    transcript = stt_result.get("transcript", "")

    if not transcript:
        return {
            "success": False,
            "message": "Không thể nhận diện giọng nói hoặc file âm thanh rỗng.",
            "patient_id": patient_id,
            "raw_stt": stt_result
        }

    # 2. Chuyển transcript thành SOAPE qua VNPT SmartBot
    prompt = f"""Bạn là trợ lý y khoa chuyên nghiệp.
Hãy trích xuất đoạn hội thoại ghi âm lâm sàng sau thành định dạng JSON chuẩn SOAPE.
Tuyệt đối chỉ trả về JSON, không kèm giải thích.

Văn bản thô: "{transcript}"

Định dạng JSON yêu cầu:
{{
    "subjective": "Lý do vào viện, triệu chứng cơ năng...",
    "objective": "Chỉ số sinh tồn, thăm khám thực thể...",
    "assessment": "Chẩn đoán bệnh...",
    "plan": "Y lệnh thuốc, thủ thuật...",
    "evaluation": "Hẹn tái khám, đánh giá..."
}}"""

    bot_resp = await vnpt_client.call_smartbot_conversation(
        prompt, session_id=patient_id
    )
    
    reply_text = bot_resp.get("reply", "")
    soape_json = {}
    
    # Bóc tách JSON từ reply bằng Regex
    match = re.search(r'\{.*\}', reply_text.replace('\n', ''), re.DOTALL)
    if match:
        try:
            soape_json = json.loads(match.group(0))
        except:
            pass

    return {
        "success": True,
        "patient_id": patient_id,
        "transcript": transcript,
        "soape": soape_json,
        "raw_reply": reply_text
    }
