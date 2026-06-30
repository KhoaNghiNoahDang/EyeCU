from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.security import require_roles
from app.services.dataset_reader import get_mock_json

router = APIRouter()


@router.post("/emr", dependencies=[Depends(require_roles(["clinician"]))])
async def process_voice_emr(
    audio: UploadFile = File(...), patient_id: str = Form("123")
):
    audio_bytes = await audio.read()

    # VNPT SmartVoice STT Mock
    soape_data = get_mock_json("smartvoice_soape")

    return {
        "summary": soape_data.get("summary", "Bệnh nhân có biểu hiện đau đầu..."),
        "raw_text": soape_data.get("raw_text", "Tôi bị đau đầu từ hôm qua..."),
    }
