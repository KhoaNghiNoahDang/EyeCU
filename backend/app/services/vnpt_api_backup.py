import httpx
from app.core.config import settings
from app.services.dataset_reader import get_mock_json
import base64

VNPT_TIMEOUT = 15


def _ekyc_headers() -> dict:
    return {
        "Token-id": settings.VNPT_EKYC_TOKEN_ID,
        "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
        "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
        "mac-address": "WEB-001",
        "Content-Type": "application/json",
    }


def _smartvision_headers() -> dict:
    return {
        "Token-id": settings.VNPT_SMARTVISION_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTVISION_TOKEN_KEY,
        "Content-Type": "application/json",
    }


def _smartbot_headers() -> dict:
    token = str(settings.VNPT_SMARTBOT_ACCESS_TOKEN)
    return {
        "Token-id": settings.VNPT_SMARTBOT_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTBOT_TOKEN_KEY,
        "Authorization": token if token.lower().startswith("bearer") else f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _smartvoice_headers() -> dict:
<<<<<<< HEAD
    token = str(settings.VNPT_SMARTVOICE_ACCESS_TOKEN)
=======
    token = settings.VNPT_SMARTVOICE_ACCESS_TOKEN
    auth_header = token if token and token.lower().startswith("bearer") else f"Bearer {token}"
>>>>>>> a06be0d (feat: thêm chức năng OCR)
    return {
        "Authorization": auth_header,
        "Token-id": settings.VNPT_SMARTVOICE_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTVOICE_TOKEN_KEY,
<<<<<<< HEAD
        "Authorization": token if token.lower().startswith("bearer") else f"Bearer {token}",
=======
>>>>>>> a06be0d (feat: thêm chức năng OCR)
    }


def _smartreader_headers() -> dict:
    return {
        "Token-id": settings.VNPT_SMARTREADER_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTREADER_TOKEN_KEY,
        "Content-Type": "application/json",
    }


class VnptAPIClient:

    # ── eKYC: Upload ảnh lấy hash ─────────────────────────────────
    async def upload_file(
        self, file_bytes: bytes, filename: str = "image.jpg"
    ) -> str | None:
        """Bước 1: Upload ảnh lên VNPT lấy hash. Hash này dùng cho OCR/Liveness."""
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/file-service/v1/addFile",
                    headers={
                        "Token-id": settings.VNPT_EKYC_TOKEN_ID,
                        "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
                        "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
                    },
                    files={"file": (filename, file_bytes, "image/jpeg")},
                    data={"title": filename, "description": "EyeCU upload"},
                )
                data = resp.json()
                return data.get("object", {}).get("hash")
        except Exception:
            return None

    # ── eKYC: OCR CCCD ────────────────────────────────────────────
    async def call_ekyc_ocr(self, hash_string: str) -> dict:
        """Bóc tách thông tin từ ảnh CCCD (mặt trước + sau)."""
        payload = {"img_front": hash_string, "step_id": 0, "type": 7}
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/web/ocr/id",
                    json=payload,
                    headers=_ekyc_headers(),
                )
                data = resp.json()
                obj = data.get("object", {})
                return {
                    "name": obj.get("name", ""),
                    "cccd": obj.get("id", ""),
                    "dob": obj.get("birth_day", ""),
                    "address": obj.get("recent_location", ""),
                    "raw": data,
                }
        except Exception:
            return get_mock_json("smartreader_ocr")

    # ── eKYC: Card Liveness (kiểm thẻ thật/giả) ─────────────────
    async def call_card_liveness(self, img_hash: str) -> dict:
        """Kiểm tra thẻ CCCD thật hay in photocopy."""
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/web/card/liveness",
                    json={"img": img_hash, "client_session": "eyecu-001"},
                    headers=_ekyc_headers(),
                )
                data = resp.json()
                return {
                    "liveness": data.get("object", {}).get("liveness", "fail"),
                    "msg": data.get("object", {}).get("liveness_msg", ""),
                }
        except Exception:
            return {"liveness": "success", "msg": "Người thật (fallback)"}

    # ── eKYC: Face Liveness 2D (So khớp 1 ảnh) ─────────
    async def call_face_liveness_2d(self, face_img_hash: str) -> dict:
        """Xác thực khuôn mặt 2D (nhanh, 1 ảnh)."""
        payload = {
            "img": face_img_hash,
            "client_session": "eyecu-face-2d",
        }
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/web/face/liveness",
                    json=payload,
                    headers={
                        "Token-id": settings.VNPT_EKYC_TOKEN_ID,
                        "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
                        "Authorization": f"{settings.VNPT_EKYC_ACCESS_TOKEN}",
                    },
                )
                if resp.status_code != 200:
                    raise Exception(f"API Error {resp.status_code}")
                data = resp.json()
                return {
                    "liveness": data.get("object", {}).get("liveness", "fail"),
                    "msg": data.get("object", {}).get("liveness_msg", ""),
                }
        except Exception:
            return {"liveness": "success", "msg": "FaceID 2D OK (fallback)"}

    # ── SmartVision: Nhận diện người ngã ─────────────────────────
    async def call_smartvision_detect_people(self, img_url: str) -> dict:
        """Phát hiện người ngã từ Camera AI."""
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-people",
                    json={"data": img_url},
                    headers=_smartvision_headers(),
                )
                return resp.json()
        except Exception:
            return get_mock_json("smartvision_lpr")

    # ── SmartVision: Nhận diện xe (LPR) ──────────────────────────
    async def call_smartvision_detect_vehicle(self, img_url: str) -> dict:
        """Đọc biển số xe cấp cứu vào cổng."""
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
                    json={"data": img_url},
                    headers=_smartvision_headers(),
                )
                data = resp.json()
                plate = data.get("object", {}).get("license_plate", "Không rõ")
                return {"plate": plate, "raw": data}
        except Exception:
            return {"plate": "51A-999.11", "raw": get_mock_json("smartvision_lpr")}

    # ── SmartBot: Chatbot hỗ trợ bệnh nhân ───────────────────────
    async def call_smartbot_conversation(
        self, text: str, session_id: str = "patient_001"
    ) -> dict:
        """Trả lời câu hỏi y tế của bệnh nhân qua SmartBot."""
        payload = {
            "bot_id": "hackathon_bot",
            "sender_id": session_id,
            "text": text,
            "input_channel": "livechat",
            "session_id": session_id,
            "metadata": {"button_variables": []},
        }
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://assistant-stream.vnpt.vn/v1/conversation",
                    json=payload,
                    headers=_smartbot_headers(),
                )
                data = resp.json()
                replies = data.get("data", [])
                reply_text = replies[0].get("text", "") if replies else ""
                return {"reply": reply_text, "raw": data}
        except Exception:
            return {"reply": "Tôi đã ghi nhận. Vui lòng chờ bác sĩ xử lý.", "raw": {}}

        # ── SmartVoice: Speech To Text ───────────────────────────────

    async def call_smartvoice_stt(
        self, audio_bytes: bytes, filename: str = "audio.wav", content_type: str = "audio/wav"
    ) -> dict:
        """Chuyển file âm thanh thành văn bản."""
        import uuid
        try:
<<<<<<< HEAD
            async with httpx.AsyncClient(timeout=60.0) as client:
=======
            import uuid
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
>>>>>>> a06be0d (feat: thêm chức năng OCR)
                resp = await client.post(
                    "https://api.idg.vnpt.vn/stt-service/v3/standard",
                    headers=_smartvoice_headers(),
<<<<<<< HEAD
                    files={"audioFile": (filename, audio_bytes, content_type)},
                    data={"clientSession": str(uuid.uuid4())}
=======
                    files={
                        "audioFile": (
                            filename,
                            audio_bytes,
                            "audio/wav",
                        )
                    },
                    data={
                        "clientSession": str(uuid.uuid4())
                    }
>>>>>>> a06be0d (feat: thêm chức năng OCR)
                )
                data = resp.json()
                
                # Bóc tách transcript từ STT
                results = data.get("object", {}).get("results", [])
                transcript = ""
                for res in results:
                    # Tùy theo cấu trúc trả về thực tế của VNPT, 
                    # thường là 'transcript' hoặc 'text' hoặc 'sentence'
                    if "transcript" in res:
                        transcript += str(res.get("transcript", "")) + " "
                    elif "text" in res:
                        transcript += str(res.get("text", "")) + " "
                    elif "sentence" in res:
                        transcript += str(res.get("sentence", "")) + " "
                        
                return {
                    "transcript": transcript.strip(),
                    "raw": data,
                }
        except Exception as e:
            return {
                "transcript": "",
                "raw": {"error": str(e)},
            }  # ── SmartReader: OCR tài liệu

        # ── SmartReader: OCR tài liệu ───────────────────────────────

    async def call_smartreader_ocr(
        self,
        file_bytes: bytes,
        filename: str = "document.pdf",
    ) -> dict:
        """Đọc văn bản từ PDF hoặc ảnh."""

        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:

                resp = await client.post(
                    "https://api.idg.vnpt.vn/file-service/v1/addFile",
                    headers=_smartreader_headers(),
                    files={
                        "file": (
                            filename,
                            file_bytes,
                            "application/pdf",
                        )
                    },
                )

                data = resp.json()

                return {
                    "text": data.get("text", ""),
                    "raw": data,
                }

        except Exception:
            return get_mock_json("smartreader_ocr")


vnpt_client = VnptAPIClient()
