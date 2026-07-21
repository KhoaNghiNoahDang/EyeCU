import re
import json
import subprocess
import tempfile
import os
from fastapi import APIRouter, Depends, UploadFile, File, Form
from app.core.security import require_roles
from app.services.vnpt_api import vnpt_client
from app.services.diarization import diarize_and_transcribe

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

async def _extract_soape_with_gemini(transcript: str, is_conversation: bool = False) -> dict:
    """Dùng Gemini AI để trích xuất SOAPE từ văn bản lâm sàng tự do.

    Args:
        transcript: Văn bản cần trích xuất (đọc chính tả hoặc hội thoại đã diarize).
        is_conversation: Nếu True, dùng prompt ACI nâng cao dành cho hội thoại đa người
                         (Bác sĩ - Bệnh nhân - Người nhà). Mặc định False (chế độ đọc chính tả).
    """
    from app.core.config import settings
    api_key = settings.GEMINI_API_KEY

    fallback = _heuristic_soape(transcript)
    if not api_key:
        import logging
        logging.error("No GEMINI_API_KEY found, falling back to heuristic!")
        return fallback

    if is_conversation:
        # ── Prompt ACI nâng cao: hội thoại đa người (Diarization mode) ──────────
        prompt = f"""Bạn là một Trợ lý Lâm sàng AI (Ambient Clinical Intelligence) tại bệnh viện Việt Nam.
Bạn am hiểu tất cả các chuyên khoa: Nội khoa, Ngoại khoa, Nhãn khoa, Tai Mũi Họng, Da liễu, Thần kinh, Tim mạch, Cơ xương khớp, Sản phụ khoa, Nhi khoa, Cấp cứu...
NHIỆM VỤ: Nghe hội thoại thô giữa nhiều người trong phòng khám. TỰ phân tích và viết bệnh án SOAPE chuẩn như một bác sĩ điều trị thực sự.

─── BƯỚC 0: LỌC BỎ NGÔN NGỮ XÃ GIAO (BẮT BUỘC LÀM ĐẦU TIÊN) ───
TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ, hãy xác định và BỎ QUA HOÀN TOÀN tất cả các câu sau:
- Lời chào hỏi: "Chào bác", "Chào bác sĩ", "Xin chào", "Bác khỏe không", "Hôm nay bác đến"
- Câu xã giao: "Dạo này thế nào", "Cảm ơn bác sĩ", "Hôm nay thấy thế nào"
- Câu đệm không có thông tin y tế: "Vâng", "Vâng ạ", "Dạ", "Ừ", "Được ạ", "Thôi", "Rồi", "Nhé"
CÁC CÂU NÀY KHÔNG ĐƯỢC XUẤT HIỆN Ở BẤT KỲ TRƯỜNG NÀO TRONG SOAPE.

─── BƯỚC 1: XÁC ĐỊNH VAI TRÒ ───
Dựa vào nội dung câu nói (sau khi đã lọc xã giao) xác định vai trò:
- BÁC SĨ: người hỏi bệnh, khám, đọc kết quả cận lâm sàng, ra chẩn đoán, kê đơn, đưa ra chỉ định.
- BỆNH NHÂN: người mô tả triệu chứng, kể bệnh sử, hỏi về tình trạng của mình.
- NGƯỜI NHÀ/ĐIỀU DƯỠNG (nếu có): bổ sung thông tin, thực hiện y lệnh.

─── BƯỚC 2: SỬA LỖI NHẬN DIỆN GIỌNG NÓI (STT) ───
Dùng kiến thức y khoa để tự sửa các từ bị STT nhận diện sai:
- Tên bệnh: "lau côma"/"lau koma"/"laucôma" → "Glaucoma"; "uống huyết" → "tăng huyết áp"
- Tên thuốc: "combi gan"/"com bi gan" → "Combigan"; "pa ra mon" → "Paracetamol"
- Số + đơn vị: "hai mươi sáu" → "26"; "thủy ngân" (ngữ cảnh nhãn áp) → "mmHg"
- Từ sai ngữ cảnh y khoa: "rắc mặt"/"răng bạc" → "giác mạc"; "nhức cụm" → "nhức cộm"; "cuồng sáng"/"vần cuồng sáng" → "quầng sáng"

─── BƯỚC 3: VIẾT BỆNH ÁN SOAPE (chỉ thông tin y khoa thuần túy) ───
QUY TẮC VÀNG:
- TUYỆT ĐỐI KHÔNG đưa câu chào hỏi, câu xã giao vào bất kỳ trường nào
- MỖI TRƯỜNG là 1-3 câu tóm tắt súc tích, KHÔNG sao chép nguyên văn hội thoại
- VIẾT NHƯ BÁC SĨ viết hồ sơ bệnh án: chuyên nghiệp, ngắn gọn, dùng thuật ngữ y khoa
- CHUẨN HÓA số, đơn vị, tên thuốc, tên bệnh

[S] SUBJECTIVE - Lý do vào viện / Triệu chứng cơ năng:
  NGUON: CHI từ lời kể của BENH NHAN hoặc NGUOI NHA về bệnh lý.
  GHI: Lý do đến khám + triệu chứng chủ quan + thời gian khởi phát + tiền sử.
  KHONG GHI: lời chào, câu xã giao, lời bác sĩ nói, chỉ số đo máy, chẩn đoán, tên thuốc.
  VI DU DUNG: "Bệnh nhân tái khám vì mắt phải nhức cộm, thỉnh thoảng nhìn đèn thấy quầng sáng xanh đỏ nhiều ngày nay. Mắt trái nhìn bình thường."
  VI DU SAI - KHONG DUOC LAM: "Chào bác Tuấn hôm nay bác đến..." hay "Vâng để tôi xem..."

[O] OBJECTIVE - Khám lâm sàng / Chỉ số thực thể:
  NGUON: CHI từ kết quả đo và khám thực thể của BAC SI/DIEU DUONG.
  GHI: Chỉ số sinh tồn đo được + dấu hiệu thực thể bác sĩ phát hiện khi khám.
  KHONG GHI: triệu chứng bệnh nhân tự kể, câu hỏi của bất kỳ ai, chẩn đoán, y lệnh, câu chào.
  VI DU DUNG: "Nhãn áp: OD 26 mmHg (cao), OS 17 mmHg. Soi đáy mắt: giác mạc OD phù nhẹ."

[A] ASSESSMENT - Chẩn đoán:
  NGUON: CHI lấy chẩn đoán của BAC SI (đã sửa lỗi STT, chuẩn hóa tên bệnh).
  GHI: Tên bệnh chuẩn + mức độ + vị trí tổn thương.
  KHONG GHI: thuốc, y lệnh, triệu chứng, câu chào.
  VI DU DUNG: "Glaucoma góc mở nguyên phát mắt phải (OD). Chưa có chỉ định phẫu thuật."

[P] PLAN - Y lệnh / Xử trí:
  NGUON: CHI chỉ định của BAC SI (thuốc kê, thủ thuật, theo dõi).
  GHI: Liệt kê "1. [Tên thuốc chuẩn] [hàm lượng] [cách dùng] [tần suất]. 2. ..."
  KHÔNG GHI: chẩn đoán, triệu chứng, câu chào.
  VÍ DỤ ĐÚNG: "1. Combigan nhỏ mắt phải 2 lần/ngày (sáng, tối). 2. Acetazolamide 250mg uống 2 viên/ngày chia 2 bữa. Lưu ý: không uống quá nhiều nước cùng lúc."

[E] EVALUATION — Dặn dò / Tái khám:
  GHI: Lời dặn dò y tế (chế độ sinh hoạt, cách dùng thuốc, dấu hiệu nguy hiểm, hẹn tái khám).
  Nếu không có thông tin: ghi chính xác là "Chưa có thông tin"

[services_assigned]: Mảng dịch vụ cận lâm sàng bác sĩ chỉ định. Không có → []

─── ĐOẠN HỘI THOẠI CẦN PHÂN TÍCH ───
{transcript}

─── ĐẦU RA BẮT BUỘC ───
TRẢ VỀ JSON THUẦN TÚY, TUYỆT ĐỐI KHÔNG DÙNG XUỐNG DÒNG (ENTER) TRONG CHUỖI JSON (nếu cần xuống dòng dùng \\n), không giải thích thêm:
{{"subjective": "...", "objective": "...", "assessment": "...", "plan": "...", "evaluation": "...", "services_assigned": [], "patient_cccd": ""}}"""

    else:
        # ── Prompt gốc: đọc chính tả / ghi chú lâm sàng tự do ──────────────────
        prompt = f"""Bạn là một Trợ lý Lâm sàng AI tại bệnh viện Việt Nam, am hiểu tất cả các chuyên khoa y tế.
NHIỆM VỤ: Đọc đoạn ghi chú lâm sàng thô (do bác sĩ nói ra, đã được STT chuyển thành văn bản). Viết lại thành bệnh án SOAPE chuẩn, súc tích, chuyên nghiệp.

─── BƯỚC 1: SỬA LỖI NHẬN DIỆN GIỌNG NÓI ───
Dùng kiến thức y khoa để nhận biết và tự sửa các từ bị STT nhận diện sai. Một số lỗi phổ biến:
- Tên bệnh: từ gần đúng → tên chuẩn ICD ("lau côma" → "Glaucoma", "uống huyết" → "tăng huyết áp", "hen phế quản" đúng rồi, "viêm khung xương" → đọc ngữ cảnh sửa lại)
- Tên thuốc: tên INN hoặc thương mại gần đúng → tên chuẩn ("pa ra mon" → "Paracetamol", "am lo di" → "Amlodipine", "com bi gan" → "Combigan"...)
- Chỉ số: số đọc bằng chữ → con số; đơn vị nói dân dã → ký hiệu chuẩn ("thủy ngân" → mmHg, "mi liît" → ml, "phần ngàn" → mg)
- Từ dùng sai ngữ cảnh: dùng tư duy y khoa để bảo các từ sai thành đúng ("tắm bụng" → "khám bụng", "biết đang" → "huyết áp", "răng bạc" → "giác mạc")

YÊU CẦU PHÂN TÍCH SUY LUẬN:
1. Dựa vào ngữ cảnh, tự phân biệt được ai là Bác sĩ, ai là Bệnh nhân.
2. TỔNG HỢP VÀ VIẾT LẠI thành câu văn xuôi chuyên môn y khoa. TUYỆT ĐỐI KHÔNG trích dẫn nguyên văn lời nói. KHÔNG BAO GIỜ được chứa các chữ như "Speaker_1", "Speaker_2".
3. Tự động chuẩn hóa thuật ngữ y khoa và đơn vị đo lường (ví dụ: "huyết áp một trăm rưỡi" -> "HA: 150 mmHg").
4. Sửa các lỗi chính tả nhận diện sai bằng tư duy y khoa.

─── BƯỚC 2: CHUẨN HÓA ĐƠN VỊ ───
- Huyết áp: "X/Y mmHg" | Nhịp tim/Mạch: "X lần/phút" | Nhiệt độ: "X °C"
- SpO2: "X%" | Nhãn áp: "X mmHg" | Glucose máu: "X mmol/L"
- Thuốc: "mg", "ml", "g", "µg/kg" đủng cách

─── BƯỚC 3: VIẾT BỆNH ÁN SOAPE ───
Quy tắc bắt buộc:
✧ TÓM TẮT, KHÔNG SAO CHÉP: mỗi trường là 1-3 câu súc tích, viết như bác sĩ viết hồ sơ
✧ DÙNG THUẬT NGỮ Y KHOA: không dùng lời nói thuần tú của bệnh nhân
✧ CHUẨN HÓA SỐ VÀ ĐƠN VỊ trong nội dung

[S] SUBJECTIVE — Lý do vào viện / Triệu chứng cơ năng:
  GHI: Lý do đến khám + triệu chứng chủ quan + thời gian khởi phát + tiền sử liên quan.
  KHÔNG GHI: chỉ số đo máy, kết quả khám, chẩn đoán, tên thuốc.

[O] OBJECTIVE — Khám lâm sàng / Chỉ số đo:
  GHI: Các chỉ số sinh tồn (có đo cụ thể), dấu hiệu khám thực thể (bác sĩ phát hiện), kết quả cận lâm sàng được đọc lên.
  KHÔNG GHI: triệu chứng của bệnh nhân, chẩn đoán, y lệnh.

[A] ASSESSMENT — Chẩn đoán:
  GHI: Tên bệnh chuẩn (đã sửa STT + chuẩn hóa) + mức độ + tình trạng chính cần xử trí.
  KHÔNG GHI: thuốc, triệu chứng, chỉ số.

[P] PLAN — Y lệnh / Xử trí:
  GHI: Liệt kê dạng "1. ... 2. ..." : tất cả thuốc (tên + hàm lượng + cách dùng + tần suất), thủ thuật, chỉ định theo dõi.
  KHÔNG GHI: chẩn đoán, triệu chứng.

[E] EVALUATION — Dặn dò / Tái khám:
  GHI: Lời dặn về sinh hoạt, cách dùng thuốc, dấu hiệu nguy hiểm cần nhập viện, hẹn tái khám.
  Nếu không có → "Chưa có thông tin"

[services_assigned]: Mảng các dịch vụ cận lâm sàng bác sĩ chỉ định (xét nghiệm, siêu âm, X-quang, nội soi, điện tim...). Không có → []

[patient_cccd]: Số CCCD 12 chữ số (nếu bác sĩ đọc trong ghi âm). Số đọc bằng chữ → chữ số. Không có → ""

─── GHI CHÚ LÂM SÀNG CẦN TỔNG HỢP ───
"{transcript}"

─── ĐẦU RA BẮT BUỘC ───
TRẢ VỀ JSON THUẦN TÚY, TUYỆT ĐỐI KHÔNG DÙNG XUỐNG DÒNG (ENTER) TRONG CHUỖI JSON (nếu cần xuống dòng dùng \\n), không giải thích thêm:
{{"subjective": "...", "objective": "...", "assessment": "...", "plan": "...", "evaluation": "...", "services_assigned": [], "patient_cccd": ""}}"""

    try:
        import httpx
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1024, "responseMimeType": "application/json"}
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(url, json=payload)
            data = resp.json()
            if "candidates" not in data:
                import logging
                logging.error(f"[Gemini SOAPE] Missing candidates. Raw response: {data}")
                return fallback
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            # 1. Trích xuất đoạn JSON bằng cách tìm dấu { đầu tiên và } cuối cùng
            start_idx = raw_text.find("{")
            end_idx = raw_text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                json_str = raw_text[start_idx:end_idx+1]
            else:
                json_str = raw_text
                
            try:
                result = json.loads(json_str.strip())
            except Exception as e:
                # 2. Xử lý trường hợp có ký tự xuống dòng (literal newline) bên trong chuỗi string của JSON
                try:
                    # Chuyển tất cả xuống dòng thành dấu cách để JSON không bị lỗi Unterminated string
                    safe_text = json_str.replace('\n', ' ').replace('\r', '')
                    result = json.loads(safe_text.strip())
                except Exception as nested_e:
                    print(f"[Gemini SOAPE] JSON Error: {nested_e}. Raw: {raw_text}", flush=True)
                    return fallback

            # Ensure all keys exist
            for k in ["subjective", "objective", "assessment", "plan", "evaluation"]:
                if not result.get(k):
                    result[k] = "Chưa có thông tin"
            if "services_assigned" not in result or not isinstance(result["services_assigned"], list):
                result["services_assigned"] = []
            return result
    except Exception as e:
        import logging
        logging.error(f"[Gemini SOAPE] error: {e}")
        return fallback

def _heuristic_soape(transcript: str) -> dict:
    """Fallback nếu không có Gemini key."""
    text = transcript.lower()
    o_keys = ["khám", "mạch", "huyết áp", "nhiệt độ", "sinh tồn"]
    a_keys = ["chẩn đoán", "dự đoán", "nghi ngờ", "theo dõi bệnh", "bị rối loạn", "nghĩ bác đang bị", "bác đang bị", "khả năng là"]
    p_keys = ["y lệnh", "cho uống", "xử trí", "chỉ định", "đặt ống", "truyền", "kê cho", "kê đơn", "toa thuốc", "về uống thử", "đơn thuốc"]
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
        # Remove Speaker tags like "Speaker_1:" or "speaker_2:"
        chunk = re.sub(r'(?i)speaker_\d+:\s*', '', chunk)
        if name == "S": soape["subjective"] = chunk
        elif name == "O": soape["objective"] = chunk
        elif name == "A": soape["assessment"] = chunk
        elif name == "P": soape["plan"] = chunk
        elif name == "E": soape["evaluation"] = chunk
    for k in ["subjective", "objective", "assessment", "plan", "evaluation"]:
        if not soape[k]: soape[k] = "Chưa có thông tin"
    if not soape["subjective"]: 
        soape["subjective"] = re.sub(r'(?i)speaker_\d+:\s*', '', transcript).strip()
    soape["services_assigned"] = []
    soape["patient_cccd"] = ""
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
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run(
            [ffmpeg_exe, "-y", "-i", tmp_in_path, "-ac", "1", "-ar", "16000", tmp_out_path],
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
    # Extract CCCD with Regex directly from transcript
    cccd_match = re.search(r'\b(?:\d\s*){12}\b', transcript)
    extracted_cccd = ""
    if cccd_match:
        extracted_cccd = re.sub(r'\s+', '', cccd_match.group(0))
        # Remove the CCCD from the transcript to avoid LLM confusion
        transcript_for_llm = transcript.replace(cccd_match.group(0), "").strip()
    else:
        transcript_for_llm = transcript

    if not transcript_for_llm:
        # If the transcript was ONLY a CCCD
        transcript_for_llm = "Bệnh nhân đến khám."

    # 2. Chuyển transcript thành SOAPE qua VNPT SmartBot
    prompt = f"""Bạn là trợ lý y khoa chuyên nghiệp.
Hãy trích xuất đoạn hội thoại ghi âm lâm sàng sau thành định dạng JSON chuẩn SOAPE.
Tuyệt đối chỉ trả về JSON, không kèm giải thích.

Quy tắc phân loại RẤT QUAN TRỌNG:
- "subjective" (Lý do vào viện): Chỉ ghi triệu chứng do bệnh nhân kể. KHÔNG ghi chỉ định khám ở đây.
- "objective" (Khám lâm sàng): Chỉ ghi kết quả thăm khám thực thể, chỉ số sinh tồn của bác sĩ. KHÔNG ghi các yêu cầu đi xét nghiệm/chụp chiếu/khám chuyên khoa vào phần này.
- "assessment" (Chẩn đoán): Chẩn đoán bệnh.
- "plan" (Xử trí/Y lệnh): Y lệnh thuốc, phác đồ điều trị.
- "evaluation" (Đánh giá lại): Hẹn tái khám.
- "services_assigned" (Thứ tự khám/Chỉ định dịch vụ): BẮT BUỘC đưa TẤT CẢ các chỉ định đi xét nghiệm, chụp X-quang, siêu âm, khám chuyên khoa khác (VD: "xét nghiệm máu", "khám tai mũi họng") vào mảng này dưới dạng danh sách các chuỗi.
- "patient_cccd": Chuỗi số CCCD.

Văn bản thô: "{transcript_for_llm}"

Định dạng JSON mẫu yêu cầu trả về:
{{
    "subjective": "Chưa có thông tin",
    "objective": "Chưa có thông tin",
    "assessment": "Chưa có thông tin",
    "plan": "Chưa có thông tin",
    "evaluation": "Chưa có thông tin",
    "services_assigned": ["xét nghiệm máu", "khám chuyên khoa tai mũi họng"],
    "patient_cccd": ""
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
            
    if "services_assigned" not in soape_json or not isinstance(soape_json["services_assigned"], list):
        soape_json["services_assigned"] = []
    
    # Override CCCD if regex found one
    if extracted_cccd:
        soape_json["patient_cccd"] = extracted_cccd
    elif "patient_cccd" not in soape_json:
        soape_json["patient_cccd"] = ""
        
    return {
        "success": True,
        "patient_id": patient_id,
        "transcript": transcript,
        "soape": soape_json,
        "raw_reply": reply_text
    }


@router.post(
    "/emr-conversation",
    dependencies=[Depends(require_roles(["doctor", "clinician", "admin"]))]
)
async def process_voice_conversation(
    audio: UploadFile = File(...),
    patient_id: str = Form("123"),
    max_speakers: int = Form(3),
):
    """ACI Endpoint: Nhận audio hội thoại đa người, chạy Speaker Diarization (Pyannote),
    rồi dùng VNPT STT cho từng đoạn âm thanh, cuối cùng tự động điền bệnh án SOAPE.

    Luồng xử lý:
    1. Convert webm -> 16kHz mono WAV (ffmpeg).
    2. Pyannote phân tách timestamps theo người nói.
    3. pydub cắt file WAV thành từng đoạn nhỏ.
    4. Gửi từng đoạn lên VNPT STT (song song).
    5. Ghép kết quả: "Speaker_1: ...\nSpeaker_2: ..."
    6. Gọi Gemini ACI prompt để trích xuất SOAPE.
    """
    audio_bytes = await audio.read()

    # ── Bước 1: Convert webm -> 16kHz mono WAV ──────────────────────────────
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_in:
        tmp_in.write(audio_bytes)
        tmp_in_path = tmp_in.name
    tmp_out_path = tmp_in_path + ".wav"
    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        subprocess.run(
            [ffmpeg_exe, "-y", "-i", tmp_in_path, "-ac", "1", "-ar", "16000", tmp_out_path],
            check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
        with open(tmp_out_path, "rb") as f:
            wav_bytes = f.read()
    except Exception as e:
        import traceback
        print(f"[ERROR] Không thể convert âm thanh qua ffmpeg: {e}")
        traceback.print_exc()
        wav_bytes = audio_bytes
    finally:
        if os.path.exists(tmp_in_path):
            os.remove(tmp_in_path)
        if os.path.exists(tmp_out_path):
            os.remove(tmp_out_path)



    # ── Bước 2-4: Pyannote Diarization + VNPT STT cho từng đoạn ─────────────
    # HOTFIX: Vô hiệu hóa mô hình Pyannote Diarization để tránh lỗi Timeout 100s trên Render.
    # Force nhảy thẳng xuống bước 5 (VNPT STT fallback) để xử lý siêu tốc.
    FORCE_FAST_STT = True
    
    if FORCE_FAST_STT:
        diarization_result = {
            "transcript_diarized": "",
            "speakers_detected": 0,
            "segments": [],
            "error": "Bypassed Pyannote Diarization to prevent Render Timeout (100s limit).",
        }
    else:
        diarization_result = await diarize_and_transcribe(
            wav_bytes=wav_bytes,
            vnpt_stt_func=vnpt_client.call_smartvoice_stt,
            max_speakers=max_speakers,
        )

    transcript_diarized = diarization_result.get("transcript_diarized", "")
    speakers_detected = diarization_result.get("speakers_detected", 0)
    diarization_used = bool(transcript_diarized)
    diarization_error = diarization_result.get("error")

    # ── Bước 5: Fallback về STT thông thường nếu Diarization thất bại ───────
    transcript_plain = ""
    if diarization_used:
        transcript_for_ai = transcript_diarized
    else:
        import logging
        logging.warning(f"[ACI] Diarization thất bại ({diarization_error}), fallback về STT thường")
        stt_result = await vnpt_client.call_smartvoice_stt(
            wav_bytes, filename="record.wav", content_type="audio/wav"
        )
        transcript_plain = stt_result.get("transcript", "")
        transcript_for_ai = transcript_plain

    if not transcript_for_ai:
        return {
            "success": False,
            "message": "Không thể nhận diện giọng nói hoặc file âm thanh rỗng.",
            "patient_id": patient_id,
            "transcript": "",
            "transcript_diarized": "",
            "speakers_detected": 0,
            "diarization_used": False,
        }

    # ── Bước 6: Trích xuất SOAPE bằng Gemini ACI prompt ────────────────────
    soape = await _extract_soape_with_gemini(transcript_for_ai, is_conversation=True)

    return {
        "success": True,
        "patient_id": patient_id,
        "transcript": transcript_plain or transcript_diarized,
        "transcript_diarized": transcript_diarized,
        "speakers_detected": speakers_detected,
        "soape": soape,
        "diarization_used": diarization_used,
    }


from fastapi.responses import StreamingResponse
import io

@router.post("/pre-alert")
async def transcribe_pre_alert(audio: UploadFile = File(...)):
    audio_bytes = await audio.read()
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
    except Exception:
        wav_bytes = audio_bytes
    finally:
        if os.path.exists(tmp_in_path):
            os.remove(tmp_in_path)
        if os.path.exists(tmp_out_path):
            os.remove(tmp_out_path)

    stt_result = await vnpt_client.call_smartvoice_stt(
        wav_bytes,
        filename="record.wav",
        content_type="audio/wav"
    )
    transcript = stt_result.get("transcript", "")
    return {"status": "success", "transcript": transcript}

@router.get("/tts")
async def text_to_speech(text: str):
    try:
        audio_data = await vnpt_client.call_smartvoice_tts(
            text,
            voice_model="books",
            voice_region="female_north_ngochoa"
        )
        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/wav")
    except Exception as e:
        return {"status": "error", "message": str(e)}
