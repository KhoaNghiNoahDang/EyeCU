import re
import json
import subprocess
import tempfile
import os
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.security import require_roles
from app.services.vnpt_api import vnpt_client

router = APIRouter()

from pydantic import BaseModel
class TranscriptRequest(BaseModel):
    transcript: str
    patient_id: str = "123"

@router.post(
    "/soape", dependencies=[Depends(require_roles(["doctor", "clinician", "admin"]))]
)
async def process_soape_from_text(req: TranscriptRequest):
    transcript = req.transcript.strip()
    if not transcript:
        return {"success": False, "message": "Transcript rỗng."}

    soape = await _extract_soape_with_gemini(transcript)

    return {
        "success": True,
        "patient_id": req.patient_id,
        "transcript": transcript,
        "soape": soape,
        "raw_reply": "gemini_ai",
    }

async def _extract_soape_with_gemini(transcript: str) -> dict:
    """Dùng Gemini AI để trích xuất SOAPE từ văn bản lâm sàng tự do."""
    api_key = os.getenv("GEMINI_API_KEY", "")
    
    fallback = _heuristic_soape(transcript)
    if not api_key:
        return fallback
    
    prompt = f"""Bạn là một bác sĩ chuyên khoa. Đọc đoạn ghi chú lâm sàng sau (có thể là hội thoại tự do, không theo mẫu cố định) và trích xuất thành JSON với 5 trường SOAPE.

Quy tắc chuẩn hoá:
- CHUẨN HOÁ TỪ NGỮ: 
  + Huyết áp đọc là "X trên Y" phải chuyển thành định dạng chuẩn "X/Y mmHg" (VD: "115 trên 75" -> "115/75 mmHg").
  + Các đơn vị đo lường đọc bằng chữ phải chuyển thành ký hiệu chuẩn: "mililit" -> "ml", "muy mol" -> "µmol/L", "mi li gam" -> "mg", "gam" -> "g", "độ" -> "°C", "lần một phút" -> "lần/phút", v.v.
  + Viết hoa chữ cái đầu của mỗi câu.
- subjective: Lý do vào viện, triệu chứng bệnh nhân mô tả, tiền sử.
- objective: Kết quả thăm khám, chỉ số sinh tồn (đã chuẩn hoá), kết quả xét nghiệm/cận lâm sàng.
- assessment: Chẩn đoán hoặc nhận định lâm sàng của bác sĩ.
- plan: Y lệnh, thuốc, thủ thuật, kế hoạch điều trị.
- evaluation: Đánh giá lại, hẹn tái khám (nếu có, nếu không có thì ghi "Chưa có thông tin").

TRẢ VỀ JSON THUẦN TÚY, KHÔNG có markdown hay giải thích:

Ghi chú lâm sàng: "{transcript}"""

    try:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{api_key}}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024}
        }
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            # Strip markdown code block if present
            raw_text = re.sub(r"```json\n?", "", raw_text)
            raw_text = re.sub(r"```\n?", "", raw_text)
            result = json.loads(raw_text.strip())
            # Ensure all keys exist
            for k in ["subjective", "objective", "assessment", "plan", "evaluation"]:
                if not result.get(k):
                    result[k] = "Chưa có thông tin"
            return result
    except Exception as e:
        import logging
        logging.error(f"[Gemini SOAPE] error: {e}")
        return fallback

def _heuristic_soape(transcript: str) -> dict:
    """Fallback nếu không có Gemini key."""
    text = transcript.lower()
    o_keys = ["khám", "mạch", "huyết áp", "nhiệt độ", "sinh tồn"]
    a_keys = ["chẩn đoán", "dự đoán", "nghi ngờ", "theo dõi bệnh"]
    p_keys = ["y lệnh", "cho uống", "xử trí", "chỉ định", "đặt ống", "truyền"]
    e_keys = ["tái khám", "đánh giá lại", "hẹn"]

    def find_first(words):
        found = [text.find(w) for w in words]
        valid = [i for i in found if i != -1]
        return min(valid) if valid else -1

    o_idx = find_first(o_keys)
    a_idx = find_first(a_keys)
    p_idx = find_first(p_keys)
    e_idx = find_first(e_keys)

    indices = [("S", 0)]
    for name, idx in [("O", o_idx), ("A", a_idx), ("P", p_idx), ("E", e_idx)]:
        if idx != -1: indices.append((name, idx))
    indices.sort(key=lambda x: x[1])

    soape = {"subjective": "", "objective": "", "assessment": "", "plan": "", "evaluation": ""}
    for i, (name, start) in enumerate(indices):
        end = indices[i+1][1] if i + 1 < len(indices) else len(transcript)
        chunk = transcript[start:end].strip().capitalize()
        if name == "S": soape["subjective"] = chunk
        elif name == "O": soape["objective"] = chunk
        elif name == "A": soape["assessment"] = chunk
        elif name == "P": soape["plan"] = chunk
        elif name == "E": soape["evaluation"] = chunk

    for k in ["subjective", "objective", "assessment", "plan", "evaluation"]:
        if not soape[k]: soape[k] = "Chưa có thông tin"
    if not soape["subjective"]: soape["subjective"] = transcript
    return soape


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
