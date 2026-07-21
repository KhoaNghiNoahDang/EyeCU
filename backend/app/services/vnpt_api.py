import httpx
import uuid
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
    token = str(settings.VNPT_SMARTVISION_ACCESS_TOKEN)
    auth_header = token if token.startswith("Bearer") else f"Bearer {token[7:].strip() if token.lower().startswith('bearer ') else token}"
    return {
        "Token-id": settings.VNPT_SMARTVISION_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTVISION_TOKEN_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json",
    }


def _smartbot_headers() -> dict:
    token = str(settings.VNPT_SMARTBOT_ACCESS_TOKEN)
    auth_header = token if token.startswith("Bearer") else f"Bearer {token[7:].strip() if token.lower().startswith('bearer ') else token}"
    return {
        "Token-id": settings.VNPT_SMARTBOT_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTBOT_TOKEN_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json",
    }


def _smartvoice_headers() -> dict:
    token = str(settings.VNPT_SMARTVOICE_ACCESS_TOKEN)
    auth_header = token if token.startswith("Bearer") else f"Bearer {token[7:].strip() if token.lower().startswith('bearer ') else token}"
    return {
        "Token-id": settings.VNPT_SMARTVOICE_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTVOICE_TOKEN_KEY,
        "Authorization": auth_header,
    }


def _smartreader_headers() -> dict:
    token = str(settings.VNPT_SMARTREADER_ACCESS_TOKEN)
    auth_header = token if token.startswith("Bearer") else f"Bearer {token[7:].strip() if token.lower().startswith('bearer ') else token}"
    return {
        "Token-id": settings.VNPT_SMARTREADER_TOKEN_ID,
        "Token-key": settings.VNPT_SMARTREADER_TOKEN_KEY,
        "Authorization": auth_header,
        "Content-Type": "application/json",
    }


class VnptAPIClient:

    # ── eKYC: Upload ảnh lấy hash ─────────────────────────────────
    async def upload_file(
        self, file_bytes: bytes, filename: str = "image.jpg"
    ) -> str | None:
        """Bước 1: Upload ảnh lên VNPT lấy hash. Hash này dùng cho OCR/Liveness/SmartVision."""
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
                if resp.status_code != 200:
                    print(f"VNPT Upload Failed: {resp.status_code} - {resp.text}")
                    return None
                data = resp.json()
                return data.get("object", {}).get("hash")
        except Exception as e:
            print(f"VNPT Upload Exception: {e}")
            return None

    # ── Proxy Service: Lấy CDN URL từ hash ────────────────────────────
    async def get_cdn_url(self, file_hash: str) -> str | None:
        """Bước 2 (SmartVision): Lấy CDN URL từ file_hash."""
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.get(
                    "https://api.idg.vnpt.vn/proxy-service/url-file",
                    params={"hash": file_hash},
                    headers=_smartvision_headers(),
                )
                data = resp.json()
                cdn_url = data.get("object")
                if isinstance(cdn_url, dict):
                    cdn_url = cdn_url.get("url") or cdn_url.get("fileUrl")
                if isinstance(cdn_url, str) and cdn_url.startswith("http"):
                    return cdn_url
                return None
        except Exception:
            return None

    # ── eKYC: OCR CCCD ────────────────────────────────────────────
    async def call_ekyc_ocr(self, hash_string: str, hash_back_string: str = None) -> dict:
        """Bóc tách thông tin từ ảnh CCCD (mặt trước + sau)."""
        payload = {"token": str(uuid.uuid4()),
            "client_session": "eyecu-ocr",
            "img_front": hash_string,
            "step_id": 0,
            "type": -1}
        if hash_back_string:
            payload["img_back"] = hash_back_string
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
                    "gender": obj.get("sex", "") or obj.get("gender", ""),
                    "address": obj.get("recent_location", ""),
                    "hometown": obj.get("origin_location", ""),
                    "issue_date": obj.get("issue_date", ""),
                    "issue_place": obj.get("issue_place", ""),
                    "valid_until": obj.get("valid_date", ""),
                    "characteristics": obj.get("characteristics", ""),
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
        except Exception as e:
            print(f"Lỗi Card Liveness: {e}")
            return {"liveness": "fail", "msg": "Lỗi kết nối eKYC"}

    # ── eKYC: Face Liveness 2D (So khớp 1 ảnh) ─────────
    async def call_face_liveness_2d(self, face_img_hash: str) -> dict:
        """Xác thực khuôn mặt 2D (nhanh, 1 ảnh)."""
        payload = {
            "token": str(uuid.uuid4()),
            "img": face_img_hash,
            "client_session": "eyecu-face-2d",
        }
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/face/liveness",
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
        except Exception as e:
            print(f"Lỗi Face Liveness: {e}")
            return {"liveness": "fail", "msg": "Lỗi kết nối eKYC"}

    # ── eKYC: Face Compare 1:1 ─────────
    async def call_face_compare(self, img_hash_1: str, img_hash_2: str) -> dict:
        """So khớp 2 khuôn mặt."""
        payload = {
            "token": str(uuid.uuid4()),
            "img_front": img_hash_1,
            "img_face": img_hash_2,
            "client_session": "eyecu-face-compare",
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/ai/v1/face/compare",
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
                    "match": data.get("object", {}).get("match", "False"),
                    "prob": data.get("object", {}).get("prob", 0.0),
                }
        except Exception as e:
            print(f"Lỗi Face Compare: {e}")
            return {"match": "False", "prob": 0.0}

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

    # ── SmartVoice: Text to Speech (TTS) ──────────────────────────────

    async def call_smartvoice_tts(
        self,
        text: str,
        voice_model: str = "news",
        voice_region: str = "female_north",
    ) -> bytes:
        """Chuyển văn bản thành giọng nói."""
        payload = {
            "text": text,
            "text_split": False,
            "model": voice_model,
            "speed": "1",
            "region": voice_region
        }

        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                headers = {
                    "Authorization": settings.VNPT_TTS_ACCESS_TOKEN if settings.VNPT_TTS_ACCESS_TOKEN.lower().startswith("bearer") else f"Bearer {settings.VNPT_TTS_ACCESS_TOKEN}",
                    "Token-id": settings.VNPT_TTS_TOKEN_ID,
                    "Token-key": settings.VNPT_TTS_TOKEN_KEY,
                    "Content-Type": "application/json",
                }
                
                resp = await client.post(
                    "https://api.idg.vnpt.vn/tts-service/v2/standard",
                    json=payload,
                    headers=headers,
                )

                data = resp.json()
                if "object" in data and "playlist" in data["object"]:
                     # Lấy URL của file âm thanh đầu tiên
                     playlist = data["object"]["playlist"]
                     if playlist and isinstance(playlist, list):
                         audio_url = playlist[0].get("audio_link")
                         if audio_url:
                             # Tải file âm thanh về
                             audio_resp = await client.get(audio_url)
                             return audio_resp.content
                             
                return b""
        except Exception:
            return b""

    # ── SmartVision: Nhận diện xe (LPR) ──────────────────────────
    async def call_smartvision_detect_vehicle(self, img_url: str) -> dict:
        """Đọc biển số xe cấp cứu vào cổng — trả về TẤT CẢ biển số trong ảnh."""
        import base64 as _base64
        import json as _json
        import re as _re

        def _decode_vnpt_response(raw: dict) -> dict:
            """VNPT wrap response trong dataBase64 — cần decode trước khi parse."""
            if "dataBase64" in raw:
                try:
                    inner = _json.loads(_base64.b64decode(raw["dataBase64"]).decode("utf-8"))
                    return inner
                except Exception:
                    pass
            return raw

        def _extract_plate_from_text(text: str) -> list[str]:
            """Dùng regex để bóc biển số từ text OCR (fallback khi SmartVision lỗi)."""
            # Mẫu biển VN: 2 số + chữ cái + dấu cách/gạch + 3-5 số (có thể có dấu chấm)
            patterns = [
                r'\b(\d{2}[A-Za-z]\d?\s*[-.]?\s*\d{3}[.\-]?\d{0,2})\b',
                r'\b(\d{2}[A-Za-z]\d?\s+\d{3}[.\-]?\d{0,2})\b',
            ]
            found = []
            for pat in patterns:
                for m in _re.finditer(pat, text, _re.IGNORECASE):
                    p = m.group(1).strip()
                    if p not in found:
                        found.append(p)
            return found

        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
                    json={"data": img_url},
                    headers=_smartvision_headers(),
                )
                raw_data = resp.json()

                # ── Bước 1: Decode dataBase64 wrapper (VNPT wrap tất cả response) ──
                data = _decode_vnpt_response(raw_data)

                # Kiểm tra INTERNAL_SERVER_ERROR từ SmartVision
                sv_status = data.get("object", {}).get("status", "")
                sv_failed = sv_status == "INTERNAL_SERVER_ERROR" or (
                    not data.get("object", {}).get("message") and sv_status
                )

                if not sv_failed:
                    # ── Bước 2a: Parse cấu trúc thật object.message.info.lpr ──
                    obj = data.get("object", {})
                    msg = obj.get("message", {})
                    info = msg.get("info", {}) if isinstance(msg, dict) else {}
                    lpr_list = info.get("lpr", [])
                    lp_probs = info.get("lp_probs", [])

                    valid_plates = [
                        (p.strip(), prob)
                        for p, prob in zip(lpr_list, lp_probs)
                        if p and p.strip() and p.strip() not in ("Không rõ", "")
                    ]

                    if valid_plates:
                        valid_plates.sort(key=lambda x: x[1], reverse=True)
                        best_plate = valid_plates[0][0]
                        all_plate_strings = [p for p, _ in valid_plates]
                        return {
                            "plate": best_plate,
                            "plates": all_plate_strings,
                            "raw": raw_data,
                        }

                # ── Bước 2b: SmartVision thất bại → fallback SmartReader OCR ──
                # Download ảnh từ CDN rồi OCR để bóc biển số bằng text recognition
                print(f"[LPR] SmartVision INTERNAL_SERVER_ERROR — thử fallback SmartReader OCR")
                try:
                    # Download ảnh từ CDN URL
                    async with httpx.AsyncClient(timeout=10) as dl:
                        img_resp = await dl.get(img_url)
                        if img_resp.status_code == 200:
                            img_bytes = img_resp.content
                            ocr_result = await self.call_smartreader_ocr(img_bytes, "plate.jpg")
                            ocr_text = ocr_result.get("text", "")
                            print(f"[LPR] OCR text: {ocr_text!r}")
                            plates_from_ocr = _extract_plate_from_text(ocr_text)
                            if plates_from_ocr:
                                print(f"[LPR] Boc bien so tu OCR: {plates_from_ocr}")
                                return {
                                    "plate": plates_from_ocr[0],
                                    "plates": plates_from_ocr,
                                    "raw": {"mode": "ocr_fallback", "ocr_text": ocr_text},
                                }
                except Exception as ocr_ex:
                    print(f"[LPR] OCR fallback failed: {ocr_ex}")

                # Không đọc được
                return {"plate": "Không rõ", "plates": [], "raw": raw_data}

        except Exception as ex:
            print(f"[LPR] Exception: {ex}")
            return {"plate": "Không rõ", "plates": [], "raw": {"error": str(ex)}}



    # ── SmartBot: Chatbot hỗ trợ bệnh nhân ───────────────────────
    async def call_smartbot_conversation(
        self, text: str, session_id: str = "patient_001", metadata: dict = None
    ) -> dict:
        """Trả lời câu hỏi y tế của bệnh nhân qua SmartBot."""
        bot_id = getattr(settings, "VNPT_SMARTBOT_ID", "hackathon_bot")
        payload = {
            "bot_id": bot_id,
            "sender_id": session_id,
            "text": text,
            "input_channel": "livechat",
            "session_id": session_id,
            "metadata": metadata or {"button_variables": []},
        }
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    "https://assistant-stream.vnpt.vn/v1/conversation",
                    json=payload,
                    headers=_smartbot_headers(),
                )
                
                text_response = resp.text
                last_data = None
                
                for line in text_response.strip().split('\n'):
                    line = line.strip()
                    if line.startswith('data:'):
                        try:
                            import json
                            last_data = json.loads(line[5:])
                        except Exception:
                            pass
                
                if last_data:
                    try:
                        reply_text = last_data["object"]["sb"]["card_data"][0]["text"]
                        return {"reply": reply_text, "raw": last_data}
                    except KeyError:
                        return {"reply": "", "raw": {"error": "Lỗi bóc tách nội dung từ SmartBot", "raw": last_data}}
                else:
                    try:
                        data = resp.json()
                        replies = data.get("data", [])
                        reply_text = replies[0].get("text", "") if replies else ""
                        return {"reply": reply_text, "raw": data}
                    except Exception:
                        return {"reply": "", "raw": {"error": "Lỗi đọc phản hồi từ SmartBot: " + text_response}}
        except Exception as e:
            return {"reply": "", "raw": {"error": f"Lỗi gọi VNPT SmartBot: {type(e).__name__} - {str(e)}" }}

        # ── SmartVoice: Speech To Text ───────────────────────────────

    async def call_smartvoice_stt(
        self, audio_bytes: bytes, filename: str = "audio.wav", content_type: str = "audio/wav"
    ) -> dict:
        """Chuyển file âm thanh thành văn bản."""
        import uuid
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/stt-service/v1/grpc/standard",
                    headers=_smartvoice_headers(),
                    files={"audioFile": (filename, audio_bytes, content_type)},
                    data={"clientSession": str(uuid.uuid4())}
                )
                data = resp.json()
                
                # Bóc tách transcript từ STT
                results = data.get("object", {}).get("results", [])
                transcript = ""
                for res in results:
                    # Dạng 1: Nằm trực tiếp
                    if "transcript" in res:
                        transcript += str(res.get("transcript", "")) + " "
                    elif "text" in res:
                        transcript += str(res.get("text", "")) + " "
                    elif "sentence" in res:
                        transcript += str(res.get("sentence", "")) + " "
                    # Dạng 2: Nằm trong 'alternatives' (Chuẩn trả về của VNPT grpc/standard)
                    elif "alternatives" in res and len(res["alternatives"]) > 0:
                        alt = res["alternatives"][0]
                        if "transcript" in alt:
                            transcript += str(alt.get("transcript", "")) + " "
                        elif "text" in alt:
                            transcript += str(alt.get("text", "")) + " "
                        
                return {
                    "transcript": transcript.strip(),
                    "raw": data,
                }
        except Exception as e:
            return {
                "transcript": "",
                "raw": {"error": str(e)},
            }

    # ── SmartReader: OCR tài liệu ───────────────────────────────

    async def call_smartreader_ocr(
        self,
        file_bytes: bytes,
        filename: str = "doc.jpg",
    ) -> dict:
        """Đọc văn bản từ tài liệu (upload và bóc tách)."""
        import uuid
        
        try:
            async with httpx.AsyncClient(timeout=VNPT_TIMEOUT) as client:
                # 1. Upload file using SmartReader headers
                headers = _smartreader_headers()
                headers.pop("Content-Type", None)
                content_type = "image/jpeg"
                if filename.lower().endswith(".pdf"):
                     content_type = "application/pdf"
                     
                upload_resp = await client.post(
                    "https://api.idg.vnpt.vn/file-service/v1/addFile",
                    headers=headers,
                    files={"file": (filename, file_bytes, content_type)},
                    data={"title": filename, "description": "EyeCU document"},
                )
                upload_data = upload_resp.json()
                hash_string = upload_data.get("object", {}).get("hash")
                
                if not hash_string:
                    return {"text": "", "raw": upload_data}

                # 2. Call OCR/Scan
                headers["Content-Type"] = "application/json"
                headers["mac-address"] = "WEB-001"
                payload = {
                    "file_hash": hash_string,
                    "file_type": "pdf" if filename.lower().endswith(".pdf") else "jpg",
                    "token": "8928skjhfa89298jahga1771vbvb",
                    "client_session": str(uuid.uuid4()),
                    "details": True
                }
                
                ocr_resp = await client.post(
                    "https://api.idg.vnpt.vn/rpa-service/aidigdoc/v1/ocr/scan",
                    json=payload,
                    headers=headers,
                )

                data = ocr_resp.json()
                
                # Extract text
                text_result = ""
                if "object" in data and isinstance(data["object"], list):
                     for item in data["object"]:
                         text_result += str(item.get("text", "")) + " "
                elif "object" in data and isinstance(data["object"], dict):
                     text_result = data["object"].get("text", str(data["object"]))

                return {
                    "text": text_result.strip(),
                    "raw": data,
                }

        except Exception:
            return get_mock_json("smartreader_ocr")

    # ── SmartVoice: Speaker Diarization (ACI - Ambient Clinical Intelligence) ──

    async def call_smartvoice_diarization(
        self,
        audio_bytes: bytes,
        max_speakers: int = 3,
        filename: str = "audio.wav",
    ) -> dict:
        """Phân tách hội thoại đa người (Speaker Diarization) qua VNPT SmartVoice.

        Gọi endpoint summary-meeting để bóc tách từng câu nói theo người nói.
        Dùng cho tính năng ACI (Ambient Clinical Intelligence) - tự động điền bệnh án SOAPE
        từ hội thoại giữa Bác sĩ - Bệnh nhân - Người nhà.

        Args:
            audio_bytes: Nội dung file WAV.
            max_speakers: Số người nói tối đa (mặc định 3).
            filename: Tên file gửi lên API.

        Returns:
            dict với các trường:
                - transcript_diarized (str): Kịch bản hội thoại phân tách theo người nói,
                  dạng "Speaker_1: ...\nSpeaker_2: ..."
                - speakers_detected (int): Số người nói phát hiện được.
                - raw (dict): Raw response từ VNPT.
        """
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                resp = await client.post(
                    "https://api.idg.vnpt.vn/eval-emotion-service/v1/conversation/summary-meeting",
                    headers=_smartvoice_headers(),
                    files={"file": (filename, audio_bytes, "audio/wav")},
                    data={
                        "maxNumSpeakers": str(max_speakers),
                        "languageCode": "vi-VN",
                    },
                )
                data = resp.json()
                obj = data.get("object", {})

                transcript_lines = []
                speakers_detected = 0

                # ── Dạng 1: Diarized transcript (object.results là list với speaker_tag) ──
                results = obj.get("results", [])
                if isinstance(results, list) and results:
                    speaker_set = set()
                    for item in results:
                        speaker_tag = item.get("speaker_tag") or item.get("speakerTag")
                        # Lấy nội dung câu nói (ưu tiên transcript > text > sentence)
                        sentence = (
                            item.get("transcript")
                            or item.get("text")
                            or item.get("sentence")
                            or ""
                        )
                        if speaker_tag is not None and sentence:
                            label = f"Speaker_{speaker_tag}"
                            transcript_lines.append(f"{label}: {sentence.strip()}")
                            speaker_set.add(speaker_tag)
                        elif sentence:
                            # Có kết quả nhưng không có speaker_tag — gộp thành 1 dòng
                            transcript_lines.append(sentence.strip())
                    speakers_detected = len(speaker_set) if speaker_set else (1 if transcript_lines else 0)

                # ── Dạng 2: Summary text (object.summary hoặc object.text) ──
                if not transcript_lines:
                    summary_text = obj.get("summary") or obj.get("text") or ""
                    if summary_text:
                        transcript_lines.append(str(summary_text).strip())
                        speakers_detected = 0  # Không xác định được số người nói từ summary

                transcript_diarized = "\n".join(transcript_lines)

                return {
                    "transcript_diarized": transcript_diarized,
                    "speakers_detected": speakers_detected,
                    "raw": data,
                }
        except Exception as e:
            print(f"[Diarization] Exception: {e}")
            return {
                "transcript_diarized": "",
                "speakers_detected": 0,
                "raw": {"error": str(e)},
            }


vnpt_client = VnptAPIClient()
