import asyncio, httpx, sys, json
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
BACKEND = "https://eyecu.onrender.com"
FAKE_JPG = bytes([0xFF,0xD8,0xFF,0xE0,0,0x10,0x4A,0x46,0x49,0x46,0,1,1,0,0,1,0,1,0,0,0xFF,0xD9])

async def check():
    async with httpx.AsyncClient(timeout=20) as c:
        print("=== TEST: Backend LPR demo mode ===")
        r = await c.post(
            f"{BACKEND}/api/ambulance/lpr/camera",
            data={"plate_hint": "29A-02116"},
            files={"image": ("t.jpg", FAKE_JPG, "image/jpeg")}
        )
        print(f"HTTP {r.status_code}: {r.text[:300]}")

        print()
        print("=== TEST: Active Missions ===")
        try:
            r2 = await c.get(f"{BACKEND}/api/ems/dispatch_records", params={"status": "active"})
            print(f"HTTP {r2.status_code}: {r2.text[:400]}")
        except Exception as ex:
            print(f"ERROR: {ex}")

        print()
        print("=== TEST: LPR real mode (VNPT) ===")
        r3 = await c.post(
            f"{BACKEND}/api/ambulance/lpr/camera",
            files={"image": ("real.jpg", FAKE_JPG, "image/jpeg")}
        )
        print(f"HTTP {r3.status_code}")
        data = r3.json()
        plate_val = data.get("plate")
        error_val = data.get("error")
        raw = data.get("raw", {})
        mode_val = raw.get("mode", "N/A")
        print(f"plate: {plate_val}")
        print(f"error: {error_val}")
        print(f"raw.mode: {mode_val}")

asyncio.run(check())
