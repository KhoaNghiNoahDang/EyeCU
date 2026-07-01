from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.security import require_roles
from app.services.vnpt_api import vnpt_client

router = APIRouter()


@router.post("/emr", dependencies=[Depends(require_roles(["clinician"]))])
async def process_voice_emr(
    audio: UploadFile = File(...), patient_id: str = Form("123")
):
    audio_bytes = await audio.read()

<<<<<<< HEAD
    # 1. Speech To Text
    stt_result = await vnpt_client.call_smartvoice_stt(audio_bytes, audio.filename)

    transcript = stt_result.get("transcript", "")

    if not transcript:
        return {
            "success": False,
            "message": "Không thể nhận diện giọng nói.",
            "patient_id": patient_id,
        }

    prompt = f"""
Bạn là trợ lý AI hỗ trợ bác sĩ.

Hãy chuyển đoạn hội thoại sau thành JSON theo cấu trúc SOAPE.

Đoạn hội thoại:
    
{transcript}

Chỉ trả về JSON.
"""
    soape_result = await vnpt_client.call_smartbot_conversation(
        prompt, session_id=patient_id
    )
    return {
        "success": True,
        "patient_id": patient_id,
        "transcript": transcript,
        "soape": soape_result,
=======
    # VNPT SmartVoice STT Mock
    soape_data = get_mock_json("smartvoice_soape")

    return {
        "summary": soape_data.get("summary", "Bệnh nhân có biểu hiện đau đầu..."),
        "raw_text": soape_data.get("raw_text", "Tôi bị đau đầu từ hôm qua..."),
>>>>>>> 7cb1ba39bd3b6e82a607c461028b2679881b71e5
    }
