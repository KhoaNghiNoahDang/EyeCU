"""
=============================================================
EyeCU LPR Benchmark Pipeline
=============================================================
Muc dich:
  - Doc anh bien so xe tu dataset YOLO (Kaggle topkek69)
  - Crop vung bien so ra, gui len API VNPT SmartVision
  - Tinh Precision, Recall, F1, Accuracy (Detection-level)
  - Xuat bao cao dang JSON + CSV + Console

Cach chay:
  python lpr_benchmark.py --dataset_dir ./dataset --max_images 200 --output_dir ./results

Yeu cau:
  pip install httpx pillow tqdm python-dotenv

Cau truc dataset mong doi (YOLO format):
  dataset/
    images/
      train/ (hoac test/, val/)
        *.jpg / *.png
    labels/
      train/
        *.txt  (YOLO format: class cx cy w h)
=============================================================
"""

import asyncio
import argparse
import csv
import json
import os
import sys
import time
import re
import base64
from pathlib import Path
from datetime import datetime
from typing import Optional

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

try:
    import httpx
except ImportError:
    os.system(f"{sys.executable} -m pip install httpx -q")
    import httpx

try:
    from PIL import Image
except ImportError:
    os.system(f"{sys.executable} -m pip install pillow -q")
    from PIL import Image

try:
    from tqdm import tqdm
    HAS_TQDM = True
except ImportError:
    HAS_TQDM = False

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / "backend" / ".env")
except Exception:
    pass

# ── Cau hinh ──────────────────────────────────────────────────────────
VNPT_EKYC_TOKEN_ID     = os.getenv("VNPT_EKYC_TOKEN_ID", "")
VNPT_EKYC_TOKEN_KEY    = os.getenv("VNPT_EKYC_TOKEN_KEY", "")
VNPT_EKYC_ACCESS_TOKEN = os.getenv("VNPT_EKYC_ACCESS_TOKEN", "")
VNPT_SV_TOKEN_ID       = os.getenv("VNPT_SMARTVISION_TOKEN_ID", "")
VNPT_SV_TOKEN_KEY      = os.getenv("VNPT_SMARTVISION_TOKEN_KEY", "")
VNPT_SV_ACCESS_TOKEN   = os.getenv("VNPT_SMARTVISION_ACCESS_TOKEN", "")

sv_token = VNPT_SV_ACCESS_TOKEN
if sv_token and not sv_token.lower().startswith("bearer"):
    sv_token = "Bearer " + sv_token

BACKEND_URL = os.getenv("EYECU_BACKEND_URL", "https://eyecu.onrender.com")

EKYC_HEADERS = {
    "Token-id": VNPT_EKYC_TOKEN_ID,
    "Token-key": VNPT_EKYC_TOKEN_KEY,
    "Authorization": VNPT_EKYC_ACCESS_TOKEN,
}
SV_HEADERS = {
    "Token-id": VNPT_SV_TOKEN_ID,
    "Token-key": VNPT_SV_TOKEN_KEY,
    "Authorization": sv_token,
    "Content-Type": "application/json",
}

TIMEOUT = 20
CONCURRENCY = 3  # So luong anh test dong thoi (tranh qua tai VNPT)


# ── Tien xu ly anh ────────────────────────────────────────────────────

def load_yolo_labels(image_path: Path, labels_dir: Path) -> list[tuple[float, float, float, float]]:
    """Doc file label YOLO tuong ung voi anh. Tra ve list (cx, cy, w, h) da normalize."""
    label_path = labels_dir / (image_path.stem + ".txt")
    if not label_path.exists():
        return []
    boxes = []
    for line in label_path.read_text().strip().splitlines():
        parts = line.strip().split()
        if len(parts) >= 5:
            try:
                _, cx, cy, w, h = float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
                boxes.append((cx, cy, w, h))
            except ValueError:
                continue
    return boxes


def crop_plate_from_image(img_path: Path, box: tuple) -> Optional[bytes]:
    """Crop vung bien so tu anh goc, tra ve bytes JPEG."""
    try:
        img = Image.open(img_path).convert("RGB")
        iw, ih = img.size
        cx, cy, w, h = box
        x1 = max(0, int((cx - w / 2) * iw) - 5)
        y1 = max(0, int((cy - h / 2) * ih) - 5)
        x2 = min(iw, int((cx + w / 2) * iw) + 5)
        y2 = min(ih, int((cy + h / 2) * ih) + 5)
        cropped = img.crop((x1, y1, x2, y2))
        # Dam bao kich thuoc toi thieu cho OCR
        if cropped.size[0] < 50 or cropped.size[1] < 15:
            cropped = img  # Dung ca anh neu crop qua nho
        import io
        buf = io.BytesIO()
        cropped.save(buf, format="JPEG", quality=95)
        return buf.getvalue()
    except Exception as ex:
        print(f"  [CROP ERROR] {img_path.name}: {ex}")
        return None


def extract_plate_text_from_filename(filename: str) -> Optional[str]:
    """
    Mot so dataset VN dung filename de luu bien so (vd: 29A021.16.jpg).
    Thu boc text bien so tu ten file.
    """
    name = Path(filename).stem
    # Mau bien so VN: 2 so + chu + 3-5 so
    pattern = r'(\d{2}[A-Za-z]\d?\s*[-.]?\s*\d{3}[.\-]?\d{0,2})'
    matches = re.findall(pattern, name, re.IGNORECASE)
    if matches:
        return matches[0].strip()
    return None


# ── Goi API VNPT ──────────────────────────────────────────────────────

def decode_vnpt_response(data: dict) -> dict:
    """VNPT wrap response trong dataBase64 — giai ma truoc khi parse."""
    if "dataBase64" in data:
        try:
            inner = json.loads(base64.b64decode(data["dataBase64"]).decode("utf-8"))
            return inner
        except Exception:
            pass
    return data


async def test_single_image_via_backend(img_bytes: bytes, img_name: str) -> dict:
    """Gui anh truc tiep len backend EyeCU /api/ambulance/lpr/camera."""
    start = time.time()
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT + 10) as c:
            r = await c.post(
                f"{BACKEND_URL}/api/ambulance/lpr/camera",
                files={"image": (img_name, img_bytes, "image/jpeg")},
            )
            elapsed = time.time() - start
            data = r.json()
            plate = data.get("plate")
            detected = plate is not None and plate not in ("", "Không rõ", None)
            plates_list = data.get("plates", [])
            return {
                "detected": detected,
                "plate": plate,
                "plates": plates_list,
                "error": data.get("error"),
                "latency_ms": round(elapsed * 1000),
                "mode": data.get("raw", {}).get("mode", "vnpt"),
            }
    except Exception as ex:
        elapsed = time.time() - start
        return {
            "detected": False,
            "plate": None,
            "plates": [],
            "error": str(ex),
            "latency_ms": round(elapsed * 1000),
            "mode": "error",
        }


async def test_single_image_via_vnpt_direct(img_bytes: bytes, img_name: str) -> dict:
    """
    Goi VNPT truc tiep (Upload -> CDN URL -> detect-vehicle).
    Dung khi backend bi qua tai.
    """
    start = time.time()

    # Buoc 1: Upload
    file_hash = None
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://api.idg.vnpt.vn/file-service/v1/addFile",
                headers={k: v for k, v in EKYC_HEADERS.items()},
                files={"file": (img_name, img_bytes, "image/jpeg")},
                data={"title": img_name, "description": "EyeCU LPR benchmark"},
            )
            if r.status_code == 200:
                file_hash = r.json().get("object", {}).get("hash")
    except Exception:
        pass

    if not file_hash:
        return {"detected": False, "plate": None, "plates": [], "error": "Upload failed",
                "latency_ms": round((time.time() - start) * 1000), "mode": "error"}

    # Buoc 2: CDN URL
    cdn_url = None
    try:
        async with httpx.AsyncClient(timeout=10) as c:
            r = await c.get(
                "https://api.idg.vnpt.vn/proxy-service/url-file",
                params={"hash": file_hash},
                headers=SV_HEADERS,
            )
            if r.status_code == 200:
                obj = r.json().get("object")
                cdn_url = obj if isinstance(obj, str) and obj.startswith("http") else None
    except Exception:
        pass

    if not cdn_url:
        return {"detected": False, "plate": None, "plates": [], "error": "CDN URL failed",
                "latency_ms": round((time.time() - start) * 1000), "mode": "error"}

    # Buoc 3: detect-vehicle
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.post(
                "https://api.idg.vnpt.vn/data-service/v1/smartvision/detect-vehicle",
                json={"data": cdn_url},
                headers=SV_HEADERS,
            )
            raw = r.json()
            data = decode_vnpt_response(raw)
            sv_status = data.get("object", {}).get("status", "")

            if sv_status != "INTERNAL_SERVER_ERROR":
                obj = data.get("object", {})
                msg = obj.get("message", {})
                info = msg.get("info", {}) if isinstance(msg, dict) else {}
                lpr = info.get("lpr", [])
                probs = info.get("lp_probs", [])
                valid = [(p.strip(), prob) for p, prob in zip(lpr, probs)
                         if p and p.strip() not in ("", "Không rõ")]
                if valid:
                    valid.sort(key=lambda x: x[1], reverse=True)
                    best = valid[0][0]
                    return {
                        "detected": True,
                        "plate": best,
                        "plates": [p for p, _ in valid],
                        "error": None,
                        "latency_ms": round((time.time() - start) * 1000),
                        "mode": "smartvision",
                    }

            # Fallback: INTERNAL_SERVER_ERROR — bien so khong doc duoc nhung co the dat bounding box
            return {
                "detected": False,
                "plate": None,
                "plates": [],
                "error": f"SmartVision: {sv_status}",
                "latency_ms": round((time.time() - start) * 1000),
                "mode": "smartvision_failed",
            }
    except Exception as ex:
        return {"detected": False, "plate": None, "plates": [], "error": str(ex),
                "latency_ms": round((time.time() - start) * 1000), "mode": "error"}


# ── Tinh Metrics ──────────────────────────────────────────────────────

def compute_metrics(results: list[dict]) -> dict:
    """
    Tinh Accuracy, Precision, Recall, F1 theo 2 cach:

    1. DETECTION metrics (co the tinh cho moi anh):
       - Ground truth: Anh co label bien so (co bien so = Positive)
       - Prediction: API co tra ve bien so hay khong

    2. OCR metrics (chi khi co ground truth text):
       - Ground truth text co trong filename hoac annotation
       - So sanh text tra ve voi ground truth
    """
    total = len(results)
    if total == 0:
        return {}

    # --- Detection Metrics ---
    tp = sum(1 for r in results if r["has_plate_gt"] and r["detected"])
    fp = sum(1 for r in results if not r["has_plate_gt"] and r["detected"])
    fn = sum(1 for r in results if r["has_plate_gt"] and not r["detected"])
    tn = sum(1 for r in results if not r["has_plate_gt"] and not r["detected"])

    accuracy    = (tp + tn) / total if total > 0 else 0
    precision   = tp / (tp + fp) if (tp + fp) > 0 else 0
    recall      = tp / (tp + fn) if (tp + fn) > 0 else 0
    f1          = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0

    # --- OCR Metrics (neu co ground truth text) ---
    ocr_results = [r for r in results if r.get("ground_truth_text")]
    ocr_exact   = 0
    ocr_partial = 0
    for r in ocr_results:
        gt = r["ground_truth_text"].replace("-", "").replace(".", "").replace(" ", "").upper()
        pred = (r.get("plate") or "").replace("-", "").replace(".", "").replace(" ", "").upper()
        if pred == gt:
            ocr_exact += 1
        elif gt in pred or pred in gt:
            ocr_partial += 1

    # --- Latency Stats ---
    latencies = [r["latency_ms"] for r in results if r.get("latency_ms", 0) > 0]
    avg_latency = sum(latencies) / len(latencies) if latencies else 0
    max_latency = max(latencies) if latencies else 0
    min_latency = min(latencies) if latencies else 0

    return {
        "total_images": total,
        "ground_truth_has_plate": tp + fn,
        "detection": {
            "TP": tp, "FP": fp, "FN": fn, "TN": tn,
            "accuracy":  round(accuracy * 100, 2),
            "precision": round(precision * 100, 2),
            "recall":    round(recall * 100, 2),
            "f1_score":  round(f1 * 100, 2),
        },
        "ocr": {
            "total_with_gt_text": len(ocr_results),
            "exact_match": ocr_exact,
            "partial_match": ocr_partial,
            "exact_accuracy": round(ocr_exact / len(ocr_results) * 100, 2) if ocr_results else None,
        },
        "latency_ms": {
            "avg": round(avg_latency),
            "min": round(min_latency),
            "max": round(max_latency),
        },
        "errors": sum(1 for r in results if r.get("error")),
    }


def print_report(metrics: dict, output_path: str = None):
    """In bao cao dep ra console va luu file."""
    sep = "=" * 60
    lines = [
        sep,
        "         EyeCU LPR BENCHMARK REPORT",
        f"  Thoi gian: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
        sep,
        f"  Tong so anh test           : {metrics['total_images']}",
        f"  Anh co bien so (GT)        : {metrics['ground_truth_has_plate']}",
        "",
        "  --- DETECTION METRICS ---",
        f"  True Positive  (TP)        : {metrics['detection']['TP']}",
        f"  False Positive (FP)        : {metrics['detection']['FP']}",
        f"  False Negative (FN)        : {metrics['detection']['FN']}",
        f"  True Negative  (TN)        : {metrics['detection']['TN']}",
        "",
        f"  Accuracy   = {metrics['detection']['accuracy']}%",
        f"  Precision  = {metrics['detection']['precision']}%",
        f"  Recall     = {metrics['detection']['recall']}%",
        f"  F1 Score   = {metrics['detection']['f1_score']}%",
        "",
        "  --- OCR TEXT ACCURACY ---",
    ]
    ocr = metrics["ocr"]
    if ocr["total_with_gt_text"] > 0:
        lines += [
            f"  So anh co ground truth text: {ocr['total_with_gt_text']}",
            f"  Khop chinh xac 100%        : {ocr['exact_match']} ({ocr['exact_accuracy']}%)",
            f"  Khop mot phan              : {ocr['partial_match']}",
        ]
    else:
        lines.append("  (Khong co ground truth text trong dataset nay)")

    lat = metrics["latency_ms"]
    lines += [
        "",
        "  --- LATENCY (ms) ---",
        f"  Trung binh : {lat['avg']} ms",
        f"  Nhanh nhat : {lat['min']} ms",
        f"  Cham nhat  : {lat['max']} ms",
        "",
        f"  Loi API    : {metrics['errors']} / {metrics['total_images']}",
        sep,
    ]

    report_text = "\n".join(lines)
    print(report_text)

    if output_path:
        Path(output_path).write_text(report_text, encoding="utf-8")
        print(f"\n  [OK] Bao cao luu tai: {output_path}")


# ── Pipeline chinh ────────────────────────────────────────────────────

async def run_benchmark(
    dataset_dir: str,
    max_images: int = 100,
    output_dir: str = "./results",
    use_backend: bool = True,
    image_splits: list = None,
):
    dataset_path = Path(dataset_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    if image_splits is None:
        image_splits = ["test", "val", "train"]

    # Tim tat ca anh — ho tro ca 2 layout YOLO pho bien:
    # Layout A (chuan):  dataset/images/train/*.jpg + dataset/labels/train/*.txt
    # Layout B (nay):    dataset/train/images/*.jpg + dataset/train/labels/*.txt
    all_images = []
    images_root = dataset_path / "images"
    labels_root = dataset_path / "labels"

    if images_root.exists():
        # Layout A: images/split/
        for split in image_splits:
            split_dir = images_root / split
            if split_dir.exists():
                for ext in ("*.jpg", "*.jpeg", "*.png"):
                    all_images.extend(list(split_dir.glob(ext)))
    else:
        # Layout B: split/images/
        for split in image_splits:
            split_img_dir = dataset_path / split / "images"
            if split_img_dir.exists():
                for ext in ("*.jpg", "*.jpeg", "*.png"):
                    all_images.extend(list(split_img_dir.glob(ext)))
                # Cập nhật labels_root tương ứng cho layout B
                labels_root = dataset_path  # sẽ resolve động per-image

        # Fallback: tim anh thang trong dataset_dir
        if not all_images:
            for ext in ("*.jpg", "*.jpeg", "*.png"):
                all_images.extend(list(dataset_path.glob(ext)))


    if not all_images:
        print(f"[ERROR] Khong tim thay anh trong: {dataset_dir}")
        print("  Cau truc mong doi: dataset/images/test/*.jpg")
        print("  Hoac dat anh truc tiep trong thu muc dataset")
        return

    # Gioi han so luong anh
    all_images = all_images[:max_images]
    print(f"\n[INFO] Tim thay {len(all_images)} anh de test")
    print(f"[INFO] Backend URL: {BACKEND_URL}")
    print(f"[INFO] Mode: {'Backend' if use_backend else 'VNPT Direct'}")
    print(f"[INFO] Concurrency: {CONCURRENCY} anh dong thoi\n")

    results = []
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async def process_one(img_path: Path, idx: int) -> dict:
        async with semaphore:
            # Tim label file tuong ung — ho tro ca Layout A va B
            label_file = None

            # Layout A: labels/split/name.txt
            for split in image_splits:
                candidate = labels_root / split / (img_path.stem + ".txt")
                if candidate.exists():
                    label_file = candidate
                    break

            # Layout B: split/labels/name.txt (labels_root = dataset_path)
            if label_file is None:
                for split in image_splits:
                    candidate = dataset_path / split / "labels" / (img_path.stem + ".txt")
                    if candidate.exists():
                        label_file = candidate
                        break

            # Doc boxes
            boxes = []
            if label_file:
                for line in label_file.read_text().strip().splitlines():
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        try:
                            _, cx, cy, w, h = float(parts[0]), float(parts[1]), float(parts[2]), float(parts[3]), float(parts[4])
                            boxes.append((cx, cy, w, h))
                        except ValueError:
                            pass

            has_plate_gt = len(boxes) > 0
            gt_text = extract_plate_text_from_filename(img_path.name)

            # Crop bien so neu co box, else dung ca anh
            if boxes:
                img_bytes = crop_plate_from_image(img_path, boxes[0])
            else:
                img_bytes = img_path.read_bytes()

            if img_bytes is None:
                img_bytes = img_path.read_bytes()

            # Goi API
            if use_backend:
                api_result = await test_single_image_via_backend(img_bytes, img_path.name)
            else:
                api_result = await test_single_image_via_vnpt_direct(img_bytes, img_path.name)

            result = {
                "idx": idx + 1,
                "image": img_path.name,
                "has_plate_gt": has_plate_gt,
                "num_boxes_gt": len(boxes),
                "ground_truth_text": gt_text,
                **api_result,
            }

            status = "OK" if api_result["detected"] else "MISS"
            if api_result.get("error"):
                status = "ERR"
            print(f"  [{idx+1:4d}/{len(all_images)}] {status:4s} | {img_path.name[:35]:35s} | plate={str(api_result.get('plate', 'None')):20s} | {api_result.get('latency_ms', 0)}ms")
            return result


    # Chay tat ca anh
    tasks = [process_one(img, i) for i, img in enumerate(all_images)]
    results = await asyncio.gather(*tasks)

    # Tinh metrics
    metrics = compute_metrics(list(results))

    # Luu ket qua
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")

    # JSON chi tiet
    json_path = output_path / f"lpr_benchmark_{ts}.json"
    json_data = {"metrics": metrics, "results": list(results)}
    json_path.write_text(json.dumps(json_data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n  [OK] Ket qua chi tiet: {json_path}")

    # CSV
    csv_path = output_path / f"lpr_benchmark_{ts}.csv"
    if results:
        fieldnames = list(results[0].keys())
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
    print(f"  [OK] CSV: {csv_path}")

    # Bao cao text
    report_path = output_path / f"lpr_report_{ts}.txt"
    print_report(metrics, str(report_path))

    return metrics


# ── Entry point ───────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="EyeCU LPR Benchmark")
    parser.add_argument(
        "--dataset_dir", type=str, default="./dataset",
        help="Duong dan thu muc dataset YOLO (co subfolder images/ va labels/)"
    )
    parser.add_argument(
        "--max_images", type=int, default=100,
        help="So luong anh toi da de test (default: 100)"
    )
    parser.add_argument(
        "--output_dir", type=str, default="./results",
        help="Thu muc luu ket qua"
    )
    parser.add_argument(
        "--mode", choices=["backend", "direct"], default="backend",
        help="'backend' = qua EyeCU API, 'direct' = goi VNPT truc tiep"
    )
    parser.add_argument(
        "--splits", nargs="+", default=["test", "val", "train"],
        help="Subfolder de tim anh (default: test val train)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("       EyeCU LPR Benchmark - Khoi dong")
    print("=" * 60)
    print(f"  Dataset   : {args.dataset_dir}")
    print(f"  Max images: {args.max_images}")
    print(f"  Output    : {args.output_dir}")
    print(f"  Mode      : {args.mode}")
    print(f"  Splits    : {args.splits}")
    print("=" * 60)

    asyncio.run(run_benchmark(
        dataset_dir=args.dataset_dir,
        max_images=args.max_images,
        output_dir=args.output_dir,
        use_backend=(args.mode == "backend"),
        image_splits=args.splits,
    ))


if __name__ == "__main__":
    main()
