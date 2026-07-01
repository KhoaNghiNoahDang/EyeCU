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

    # 1. Speech To Text qua VNPT SmartVoice
    stt_result = await vnpt_client.call_smartvoice_stt(audio_bytes, audio.filename)
    transcript = stt_result.get("transcript", "")

    if not transcript:
        return {
            "success": False,
            "message": "Không thể nhận diện giọng nói.",
            "patient_id": patient_id,
        }

    # 2. Chuyen transcript thanh SOAPE qua VNPT SmartBot
    prompt = f"""Bạn là trợ lý AI hỗ trợ bác sĩ.
Hãy chuyển đoạn hội thoại sau thành JSON theo cấu trúc SOAPE.

Đoạn hội thoại:
{transcript}

Chỉ trả về JSON."""

    soape_result = await vnpt_client.call_smartbot_conversation(
        prompt, session_id=patient_id
    )

    return {
        "success": True,
        "patient_id": patient_id,
        "transcript": transcript,
        "soape": soape_result,
    }
