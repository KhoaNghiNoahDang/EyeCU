"""
Script test nhanh endpoint /api/ambulance/lpr
Cach dung:
  py -3 test_lpr_endpoint.py                    # dung anh xe mau co san
  py -3 test_lpr_endpoint.py <duong-dan-anh>    # dung anh cua ban

Ket qua se hien thi:
  - Bien so phat hien duoc
  - Co phai xe cap cuu khong
  - Nguon khop (DB hay GPS session)
"""
import sys
import asyncio
import httpx

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE_URL = "http://localhost:8000"
SAMPLE_IMAGE = r"D:\HACKAITHON\EyeCU\TÀI LIỆU\[VNPT AI Hackathon 2025] VNPT SmartVision\Ảnh sample\Sample_Phương tiện_Biển số\giaothong.png"


async def test_lpr(image_path: str):
    print("=" * 60)
    print("  TEST: Quet bien so xe qua endpoint /api/ambulance/lpr")
    print("=" * 60)
    print(f"  Anh su dung: {image_path}\n")

    # Doc file anh
    try:
        with open(image_path, "rb") as f:
            image_bytes = f.read()
    except FileNotFoundError:
        print(f"[LOI] Khong tim thay file: {image_path}")
        print("      Hay truyen duong dan anh vao tham so khi chay script.")
        return

    ext = image_path.rsplit(".", 1)[-1].lower()
    mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png"
    filename = image_path.split("\\")[-1].split("/")[-1]

    async with httpx.AsyncClient(timeout=90) as client:
        # --- Kiem tra server dang chay khong ---
        try:
            ping = await client.get(f"{BASE_URL}/")
            print(f"[1] Server: OK ({ping.json()['message']})")
        except Exception as e:
            print(f"[LOI] Khong ket noi duoc server tai {BASE_URL}")
            print(f"      Chi tiet: {e}")
            print("      -> Hay khoi dong backend truoc: py -3 -m uvicorn app.main:app --port 8000")
            return

        # --- Goi endpoint /lpr ---
        print(f"[2] Dang gui anh '{filename}' ({len(image_bytes):,} bytes) len /api/ambulance/lpr ...")
        try:
            resp = await client.post(
                f"{BASE_URL}/api/ambulance/lpr",
                files={"file": (filename, image_bytes, mime)},
                data={"camera_id": "CAM_TEST_01"},
            )
        except Exception as e:
            print(f"[LOI] Goi HTTP that bai: {e}")
            return

        print(f"[3] HTTP Status: {resp.status_code}\n")

        if resp.status_code != 200:
            print(f"[LOI] Server tra loi {resp.status_code}:")
            print(resp.text[:500])
            return

        data = resp.json()

        # --- Hien thi ket qua ---
        print("=" * 60)
        print("  KET QUA QUET BIEN SO XE")
        print("=" * 60)

        plate = data.get("plate") or "Khong nhan ra"
        all_plates = data.get("all_plates_detected", [])
        confidence = data.get("confidence")
        is_emergency = data.get("is_emergency_vehicle", False)
        source = data.get("match_source")

        print(f"  Bien so chinh:       {plate}")
        if confidence:
            print(f"  Do chinh xac:        {confidence:.1%}")
        if all_plates:
            valid = [p for p in all_plates if p]
            print(f"  Tat ca bien so:      {valid}")

        print()
        if is_emergency:
            emoji = "[XE CAP CUU PHAT HIEN]"
            print(f"  {emoji}")
            if source == "registered_db":
                amb = data.get("matched_ambulance", {})
                print(f"  Nguon khop:          Da dang ky trong he thong")
                print(f"  Tai xe:              {amb.get('driver') or 'Chua ro'}")
                print(f"  Trang thai xe:       {amb.get('status')}")
                print()
                print("  -> He thong se: Mo cong tu dong + Phat canh bao cho kip truc!")
            elif source == "gps_session":
                sess = data.get("matched_gps_session", {})
                print(f"  Nguon khop:          Xe vang lai dang phat GPS voi bien so tu khai")
                print(f"  Vi tri GPS:          lat={sess.get('lat')}, lng={sess.get('lng')}")
                print(f"  Bat dau phat GPS:    {sess.get('started_at')}")
                print()
                print("  -> He thong se: Canh bao xe vang lai + Uu tien ho tro vao cong!")
        else:
            print("  [XE THUONG] Khong phai xe cap cuu (khong khop DB & GPS session).")

        print()
        print(f"  Log ID trong DB:     {data.get('log_id')}")
        print(f"  CDN URL anh:         {(data.get('cdn_url') or '')[:60]}...")
        print("=" * 60)

        # --- Test them: kiem tra active sessions ---
        try:
            sess_resp = await client.get(f"{BASE_URL}/api/ambulance/active-sessions")
            sessions = sess_resp.json()
            print(f"\n  Xe dang phat GPS hien tai: {len(sessions)} xe")
            for s in sessions:
                tag = "[DA DANG KY]" if s["is_registered"] else "[VANG LAI]"
                print(f"    {tag} {s['plate']} | lat={s.get('lat')}, lng={s.get('lng')}")
        except Exception:
            pass


if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else SAMPLE_IMAGE
    asyncio.run(test_lpr(image_path))
