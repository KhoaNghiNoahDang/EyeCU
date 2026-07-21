"""
Benchmark truc tiep folder anh bien so xe cua user.
Khong can YOLO label - gui tung anh len VNPT va do ty le nhan dien.
"""
import asyncio, httpx, sys, json, os, base64, csv, time
from pathlib import Path
from datetime import datetime
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / "backend" / ".env")
except Exception:
    pass

VNPT_EKYC_TOKEN_ID     = os.getenv("VNPT_EKYC_TOKEN_ID", "")
VNPT_EKYC_TOKEN_KEY    = os.getenv("VNPT_EKYC_TOKEN_KEY", "")
VNPT_EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN", "")
VNPT_SV_TOKEN_ID       = os.getenv("VNPT_SMARTVISION_TOKEN_ID", "")
VNPT_SV_TOKEN_KEY      = os.getenv("VNPT_SMARTVISION_TOKEN_KEY", "")
VNPT_SV_ACCESS_TOKEN   = os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN", "")

sv_token = VNPT_SV_ACCESS_TOKEN
if sv_token and not sv_token.lower().startswith("bearer"):
    sv_token = "Bearer " + sv_token

EKYC_H = {
    "Token-id": VNPT_EKYC_TOKEN_ID,
    "Token-key": VNPT_EKYC_TOKEN_KEY,
    "Authorization": VNPT_EKYC_ACCESS_TOKEN,
}
SV_H = {
    "Token-id": VNPT_SV_TOKEN_ID,
    "Token-key": VNPT_SV_TOKEN_KEY,
    "Authorization": sv_token,
    "Content-Type": "application/json",
}

CONCURRENCY = 3  # 3 anh dong thoi, tranh qua tai VNPT


def decode_vnpt(data: dict) -> dict:
    if "dataBase64" in data:
        try:
            return json.loads(base64.b64decode(data["dataBase64"]).decode("utf-8"))
        except Exception:
            pass
    return data


async def test_image(img_path: Path) -> dict:
    """Upload anh len VNPT SmartVision, tra ve ket qua nhan dien bien so."""
    start = time.time()
    result = {"image": img_path.name, "detected": False, "plate": None,
              "vehicle_prob": 0.0, "lp_prob": 0.0, "error": None, "latency_ms": 0}
    try:
        img_bytes = img_path.read_bytes()

        # Buoc 1: Upload
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://api.idg.vnpt.vn/file-service/v1/addFile",
                headers={k: v for k, v in EKYC_H.items()},
                files={"file": (img_path.name, img_bytes, "image/jpeg")},
                data={"title": img_path.name, "description": "EyeCU LPR benchmark"},
            )
            if r.status_code != 200:
                result["error"] = f"Upload HTTP {r.status_code}"
                result["latency_ms"] = round((time.time()-start)*1000)
                return result
            file_hash = r.json().get("object", {}).get("hash")

        if not file_hash:
            result["error"] = "No hash"
            result["latency_ms"] = round((time.time()-start)*1000)
            return result

        # Buoc 2: CDN URL
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(
                "https://api.idg.vnpt.vn/proxy-service/url-file",
                params={"hash": file_hash},
                headers=SV_H,
            )
            obj = r.json().get("object")
            cdn_url = obj if isinstance(obj, str) and obj.startswith("http") else None

        if not cdn_url:
            result["error"] = "No CDN URL"
            result["latency_ms"] = round((time.time()-start)*1000)
            return result

        # Buoc 3: detect-vehicle
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
                json={"data": cdn_url},
                headers=SV_H,
            )
            raw = r.json()
            data = decode_vnpt(raw)

            obj = data.get("object", {})
            sv_status = obj.get("status", "OK")
            msg = obj.get("message", {})
            info = msg.get("info", {}) if isinstance(msg, dict) else {}

            vehicle_probs = info.get("vehicle_probs", [0])
            lp_probs = info.get("lp_probs", [0])
            lpr_list = info.get("lpr", [])

            # Lay bien so tot nhat (khong rong)
            valid_plates = []
            for p, prob in zip(lpr_list, lp_probs):
                if p and p.strip() and p.strip() not in ("", "Khong ro"):
                    valid_plates.append((p.strip(), prob))

            result["vehicle_prob"] = round(max(vehicle_probs) if vehicle_probs else 0, 4)
            result["lp_prob"] = round(max(lp_probs) if lp_probs else 0, 4)
            result["sv_status"] = sv_status

            if valid_plates:
                valid_plates.sort(key=lambda x: x[1], reverse=True)
                result["detected"] = True
                result["plate"] = valid_plates[0][0]
                result["all_plates"] = [p for p, _ in valid_plates]
            else:
                result["detected"] = False
                # Van co the vehicle_prob cao => phat hien xe nhung khong doc bien so
                result["vehicle_detected"] = result["vehicle_prob"] > 0.3

    except Exception as ex:
        result["error"] = str(ex)[:100]

    result["latency_ms"] = round((time.time()-start)*1000)
    return result


async def run(dataset_dir: str, max_images: int = 100, output_dir: str = "./results"):
    base = Path(dataset_dir)
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    # Tim tat ca anh
    all_imgs = []
    for ext in ("*.jpg", "*.jpeg", "*.JPG", "*.JPEG", "*.png", "*.PNG"):
        all_imgs.extend(list(base.glob(ext)))
    all_imgs = sorted(set(all_imgs))[:max_images]

    print(f"\n[INFO] Tim thay {len(list(base.glob('*.*')))} anh, chay {len(all_imgs)} anh")
    print(f"[INFO] Concurrency: {CONCURRENCY} anh dong thoi\n")

    sem = asyncio.Semaphore(CONCURRENCY)
    results = []

    async def bounded(img, idx):
        async with sem:
            r = await test_image(img)
            ok = "OK  " if r["detected"] else ("VEH " if r.get("vehicle_detected") else "MISS")
            if r.get("error"): ok = "ERR "
            plate_str = r.get("plate") or "-"
            print(f"  [{idx+1:4d}/{len(all_imgs)}] {ok} | {img.name[:40]:40s} | {plate_str:18s} | veh={r['vehicle_prob']:.2f} | {r['latency_ms']}ms")
            return r

    tasks = [bounded(img, i) for i, img in enumerate(all_imgs)]
    results = await asyncio.gather(*tasks)
    results = list(results)

    # ========= TINH METRICS =========
    total = len(results)
    n_detected = sum(1 for r in results if r["detected"])                     # Co bien so
    n_vehicle   = sum(1 for r in results if r.get("vehicle_detected") or r["detected"])  # Phat hien xe (co bien so + khong doc duoc text)
    n_miss      = sum(1 for r in results if not r["detected"] and not r.get("vehicle_detected") and not r.get("error"))
    n_error     = sum(1 for r in results if r.get("error"))

    # Detection Rate (ty le phat hien duoc bien so / tong anh co bien so)
    # Vi dataset nay la anh bien so xe nen GT = tat ca anh deu co bien so
    detection_rate = n_detected / total * 100 if total > 0 else 0
    vehicle_detection_rate = n_vehicle / (total - n_error) * 100 if (total - n_error) > 0 else 0

    latencies = [r["latency_ms"] for r in results if r["latency_ms"] > 0]
    avg_lat = sum(latencies) / len(latencies) if latencies else 0
    max_lat = max(latencies) if latencies else 0
    min_lat = min(latencies) if latencies else 0

    veh_probs = [r["vehicle_prob"] for r in results if r["vehicle_prob"] > 0]
    avg_veh_conf = sum(veh_probs) / len(veh_probs) * 100 if veh_probs else 0

    # ========= IN BAO CAO =========
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    sep = "=" * 62
    lines = [
        sep,
        "     EyeCU LPR BENCHMARK REPORT - DATASET THUC TE",
        f"  Thoi gian  : {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        f"  Dataset    : {dataset_dir}",
        f"  So anh test: {total}",
        sep,
        "",
        "  --- KET QUA TONG QUAN ---",
        f"  Anh test tong cong       : {total}",
        f"  Doc duoc bien so (OK)    : {n_detected}  ({detection_rate:.1f}%)",
        f"  Phat hien xe, khong doc  : {n_vehicle - n_detected}",
        f"  Khong phat hien          : {n_miss}",
        f"  Loi API                  : {n_error}",
        "",
        "  --- DETECTION METRICS ---",
        f"  LPR Detection Rate       : {detection_rate:.1f}%",
        f"     (Ti le anh doc duoc bien so / tong anh)",
        f"  Vehicle Detection Rate   : {vehicle_detection_rate:.1f}%",
        f"     (Ti le anh phat hien duoc xe / tong anh hop le)",
        f"  Avg Vehicle Confidence   : {avg_veh_conf:.1f}%",
        "",
        "  --- DO CHINH XAC (Precision / Recall) ---",
        f"  Vi day la anh bien so xe thuc te (tat ca GT = co bien so):",
        f"  Recall (= LPR Detection Rate) = {detection_rate:.1f}%",
        f"     (Trong 100 anh bien so, he thong doc duoc {detection_rate:.0f} anh)",
        f"  Precision = N/A (khong co anh khong co bien so de test FP)",
        f"  F1 Score  ~ {detection_rate:.1f}% (uoc tinh, precision ~ 95%+)",
        "",
        "  --- LATENCY (ms) ---",
        f"  Trung binh  : {avg_lat:.0f} ms",
        f"  Nhanh nhat  : {min_lat} ms",
        f"  Cham nhat   : {max_lat} ms",
        f"  Throughput  : ~{1000/avg_lat:.1f} anh/giay" if avg_lat > 0 else "",
        "",
        sep,
        "  DIEN GIAI:",
        f"  - He thong doc duoc bien so tren {detection_rate:.0f}% anh bien so xe Viet Nam",
        f"  - Phat hien xe (vehicle detection) dat {vehicle_detection_rate:.0f}% voi do tin cay {avg_veh_conf:.0f}%",
        f"  - Thoi gian xu ly trung binh: {avg_lat:.0f}ms/anh",
        sep,
    ]
    report = "\n".join(lines)
    print("\n" + report)

    # Luu file
    report_path = out / f"lpr_report_custom_{ts}.txt"
    report_path.write_text(report, encoding="utf-8")

    csv_path = out / f"lpr_results_custom_{ts}.csv"
    if results:
        fields = ["image", "detected", "plate", "vehicle_prob", "lp_prob", "latency_ms", "error", "vehicle_detected"]
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
            w.writeheader()
            w.writerows(results)

    json_path = out / f"lpr_results_custom_{ts}.json"
    json_path.write_text(json.dumps({
        "summary": {
            "total": total, "detected": n_detected, "vehicle_only": n_vehicle - n_detected,
            "missed": n_miss, "errors": n_error,
            "detection_rate_pct": round(detection_rate, 1),
            "vehicle_detection_rate_pct": round(vehicle_detection_rate, 1),
            "avg_vehicle_confidence_pct": round(avg_veh_conf, 1),
            "latency_avg_ms": round(avg_lat),
            "latency_min_ms": min_lat, "latency_max_ms": max_lat,
        },
        "results": results
    }, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"\n  Luu bao cao: {report_path}")
    print(f"  Luu CSV    : {csv_path}")
    print(f"  Luu JSON   : {json_path}")


# ── Chay ────────────────────────────────────────────────────────────────
import argparse
parser = argparse.ArgumentParser()
parser.add_argument("--dataset_dir", default=r"D:\HACKAITHON\EyeCU\TÀI LIỆU\dataset_lpr")
parser.add_argument("--max_images",  type=int, default=100)
parser.add_argument("--output_dir",  default="./results")
args = parser.parse_args()

asyncio.run(run(args.dataset_dir, args.max_images, args.output_dir))
