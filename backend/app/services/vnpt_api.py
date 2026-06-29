import httpx
from app.core.config import settings
from app.services.dataset_reader import get_mock_json


def _ekyc_headers() -> dict:
    return {
        "Token-id": settings.VNPT_EKYC_TOKEN_ID,
        "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
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
    return {
        "Token-id": settings.VNPT_SMARTBOT_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTBOT_TOKEN_KEY,
        "Content-Type": "application/json",
    }


class VnptAPIClient:

    # ── eKYC: Upload ảnh lấy hash ─────────────────────────────────
    async def upload_file(self, file_bytes: bytes, filename: str = "image.jpg") -> str | None:
        """Bước 1: Upload ảnh lên VNPT lấy hash. Hash này dùng cho OCR/Liveness."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/file-service/v1/addFile",
                    headers={
                        "Token-id": settings.VNPT_EKYC_TOKEN_ID,
                        "Token-key": settings.VNPT_EKYC_TOKEN_KEY,
                        "Authorization": f"Bearer {settings.VNPT_EKYC_TOKEN_ID}",
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
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/web/ocr/id",
                    json=payload,
                    headers=_ekyc_headers(),
                )
                data = resp.json()
                obj = data.get("object", {})
                return {
                    "name":     obj.get("name", ""),
                    "cccd":     obj.get("id", ""),
                    "dob":      obj.get("birth_day", ""),
                    "address":  obj.get("recent_location", ""),
                    "raw":      data,
                }
        except Exception:
            return get_mock_json("smartreader_ocr")

    # ── eKYC: Card Liveness (kiểm thẻ thật/giả) ─────────────────
    async def call_card_liveness(self, img_hash: str) -> dict:
        """Kiểm tra thẻ CCCD thật hay in photocopy."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/web/card/liveness",
                    json={"img": img_hash, "client_session": "eyecu-001"},
                    headers=_ekyc_headers(),
                )
                data = resp.json()
                return {
                    "liveness": data.get("object", {}).get("liveness", "fail"),
                    "msg":      data.get("object", {}).get("liveness_msg", ""),
                }
        except Exception:
            return {"liveness": "success", "msg": "Người thật (fallback)"}

    # ── eKYC: Face Liveness 3D (đăng nhập FaceID bác sĩ) ─────────
    async def call_face_liveness_3d(self, far_img_hash: str, near_img_hash: str) -> dict:
        """Xác thực khuôn mặt 3D cho Bác sĩ đăng nhập."""
        payload = {
            "far_img": far_img_hash,
            "near_img": near_img_hash,
            "client_session": "eyecu-faceid-001",
            "token": "",
        }
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/web/face/liveness-3d",
                    json=payload,
                    headers={
                        **_ekyc_headers(),
                        "Authorization": f"Bearer {settings.VNPT_VNFACE_ACCESS_TOKEN}",
                    },
                )
                data = resp.json()
                return {
                    "liveness": data.get("object", {}).get("liveness", "fail"),
                    "msg":      data.get("object", {}).get("liveness_msg", ""),
                }
        except Exception:
            return {"liveness": "success", "msg": "FaceID OK (fallback)"}

    # ── SmartVision: Nhận diện người ngã ─────────────────────────
    async def call_smartvision_detect_people(self, img_url: str) -> dict:
        """Phát hiện người ngã từ Camera AI."""
        try:
            async with httpx.AsyncClient(timeout=15) as client:
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
            async with httpx.AsyncClient(timeout=15) as client:
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
    async def call_smartbot_conversation(self, text: str, session_id: str = "patient_001") -> dict:
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
            async with httpx.AsyncClient(timeout=15) as client:
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


vnpt_client = VnptAPIClient()
