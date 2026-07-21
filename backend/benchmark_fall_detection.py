"""
=====================================================================
  EyeCU Fall Detection Benchmark
  Dataset: UR Fall Detection Dataset (Michal Kepski, Univ. of Rzeszow)
  https://fenix.ur.edu.pl/~mkepski/ds/uf.html

  Phuong phap:
    - Tai tung video MP4 (fall-01..fall-30 va adl-01..adl-40)
    - Chay qua toan bo pipeline Edge AI:
        MediaPipe Pose -> extract_features -> predict_fall
    - Dan label ground-truth va tinh metrics:
        Accuracy, Precision, Recall, F1-score
  
  Luu y:
    - "fall" videos = Label 1 (co te nga)
    - "adl"  videos = Label 0 (hoat dong binh thuong, khong te nga)
    - Video duoc xu ly per-sequence (khong per-frame) vi he thong
      duoc thiet ke de phat hien su kien tren doan video lien tuc.
    - Ket qua per-video: He thong "BAO DONG" neu phat hien bat ky
      su kien te nga nao TRONG SUOT doan video do.

  Cach chay:
    cd /Users/macbook/Documents/CODE/EyeCU/EyeCU
    source backend/.venv/bin/activate
    python backend/benchmark_fall_detection.py

  De test nhanh voi 5 fall + 5 adl, sua dong:
    LIMIT_FALL = 5
    LIMIT_ADL  = 5
=====================================================================
"""

import sys
import os
import time
import json
import urllib.request
from pathlib import Path

# -- Them edge_ai vao sys.path de import module ---------------------
EDGE_AI_DIR = Path(__file__).parent.parent / "edge_ai"
sys.path.insert(0, str(EDGE_AI_DIR))

# -- Config Dataset -------------------------------------------------
BASE_URL        = "https://fenix.ur.edu.pl/~mkepski/ds/data"
NUM_FALL_VIDEOS = 30   # dataset co 30 fall sequences
NUM_ADL_VIDEOS  = 40   # dataset co 40 ADL sequences

# Thu muc cache video (khong download lai neu da co)
CACHE_DIR = Path(__file__).parent / "datasets" / "ur_fall"

# Gioi han so video test (None = test tat ca)
# Dat so nho hon de test nhanh, vi du: LIMIT_FALL = 5
LIMIT_FALL = None
LIMIT_ADL = None

# Doc moi N frame de tang toc (1=doc het, 2=skip 1 frame, ...)
FRAME_STEP = 2  # ~15 FPS neu video 30FPS


# ==================================================================
def log(msg):
    print(f"[BENCH] {msg}", flush=True)


def download_video(video_name):
    """Tai video ve cache, tra ve Path. Tra None neu that bai."""
    cache_file = CACHE_DIR / video_name
    if cache_file.exists() and cache_file.stat().st_size > 10_000:
        log(f"  (cache) {video_name}")
        return cache_file

    url = f"{BASE_URL}/{video_name}"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        log(f"  Downloading {video_name} ...")
        urllib.request.urlretrieve(url, cache_file)
        sz = cache_file.stat().st_size
        if sz < 1000:
            cache_file.unlink(missing_ok=True)
            log(f"  WARNING: {video_name} qua nho ({sz}B) - bo qua")
            return None
        log(f"  OK: {video_name} ({sz//1024}KB)")
        return cache_file
    except Exception as e:
        log(f"  FAIL: Khong tai duoc {video_name}: {e}")
        if cache_file.exists():
            cache_file.unlink(missing_ok=True)
        return None


def reset_fall_detector_state():
    """Reset trang thai global cua fall_detector giua cac video."""
    from modules import fall_detector as fd
    fd._history_preds.clear()
    if hasattr(fd, '_history_hip_y'): fd._history_hip_y.clear()
    if hasattr(fd, '_history_ts'): fd._history_ts.clear()
    fd._last_seen.clear()
    fd._tracked_boxes.clear()
    fd._prev_hip_y.clear()
    fd._fall_stage.clear()
    fd._suspicious_since.clear()
    fd._next_person_id = 0


def process_video(video_path):
    """
    Chay toan bo pipeline qua mot video MP4.
    Tra ve True neu he thong PHAT HIEN TE NGA trong video do.
    """
    import cv2
    from modules.pose_extractor import get_landmarks
    from modules.feature_extractor import extract_features
    from modules.fall_detector import predict_fall

    reset_fall_detector_state()

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        log(f"  ERROR: Khong mo duoc video: {video_path}")
        return False

    detected_fall = False
    frame_idx = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        if frame_idx % FRAME_STEP != 0:
            continue

        # Pose estimation (khong dung bbox)
        landmarks_list = get_landmarks(frame, bbox=None)
        if not landmarks_list:
            continue

        for landmarks, image_shape in landmarks_list:
            features = extract_features(landmarks, image_shape)
            if features is None:
                continue

            is_fall, fall_prob, score, person_id = predict_fall(features, landmarks)
            if is_fall:
                detected_fall = True
                break

        if detected_fall:
            break

    cap.release()
    return detected_fall


def compute_metrics(tp, fp, tn, fn):
    accuracy  = (tp + tn) / (tp + fp + tn + fn) if (tp+fp+tn+fn) > 0 else 0
    precision = tp / (tp + fp)                   if (tp + fp)     > 0 else 0
    recall    = tp / (tp + fn)                   if (tp + fn)     > 0 else 0
    f1 = (2*precision*recall)/(precision+recall)  if (precision+recall) > 0 else 0
    return accuracy, precision, recall, f1


def run_benchmark():
    log("=" * 60)
    log("  EyeCU Fall Detection Benchmark")
    log("  Dataset: UR Fall Detection (30 falls + 40 ADLs)")
    log("=" * 60)

    results = []   # list of (video_name, ground_truth, prediction)
    failed  = []   # videos khong tai duoc

    # -- Xu ly FALL videos (label = 1) ------------------------------
    n_fall = min(LIMIT_FALL, NUM_FALL_VIDEOS) if LIMIT_FALL else NUM_FALL_VIDEOS
    log(f"\nDang xu ly {n_fall} FALL videos (label=1)...")

    for i in range(1, n_fall + 1):
        video_name = f"fall-{i:02d}-cam0.mp4"
        log(f"\n  [{i:02d}/{n_fall}] {video_name}")
        path = download_video(video_name)
        if path is None:
            failed.append(video_name)
            continue

        t0       = time.time()
        detected = process_video(path)
        elapsed  = time.time() - t0
        label    = "TP (Dung)" if detected else "FN (Sai - Bo sot)"
        log(f"  -> {'CO TE NGA' if detected else 'khong phat hien'} | GT=FALL | {label} | {elapsed:.1f}s")
        results.append((video_name, 1, int(detected)))

    # -- Xu ly ADL videos (label = 0) -------------------------------
    n_adl = min(LIMIT_ADL, NUM_ADL_VIDEOS) if LIMIT_ADL else NUM_ADL_VIDEOS
    log(f"\nDang xu ly {n_adl} ADL videos (label=0, hoat dong binh thuong)...")

    for i in range(1, n_adl + 1):
        video_name = f"adl-{i:02d}-cam0.mp4"
        log(f"\n  [{i:02d}/{n_adl}] {video_name}")
        path = download_video(video_name)
        if path is None:
            failed.append(video_name)
            continue

        t0       = time.time()
        detected = process_video(path)
        elapsed  = time.time() - t0
        label    = "TN (Dung)" if not detected else "FP (Sai - Bao nham)"
        log(f"  -> {'CO TE NGA' if detected else 'khong phat hien'} | GT=NORMAL | {label} | {elapsed:.1f}s")
        results.append((video_name, 0, int(detected)))

    # -- Tinh metrics -----------------------------------------------
    log("\n" + "=" * 60)
    log("  KET QUA BENCHMARK")
    log("=" * 60)

    tp = sum(1 for _, gt, pred in results if gt == 1 and pred == 1)
    fn = sum(1 for _, gt, pred in results if gt == 1 and pred == 0)
    fp = sum(1 for _, gt, pred in results if gt == 0 and pred == 1)
    tn = sum(1 for _, gt, pred in results if gt == 0 and pred == 0)
    total = len(results)
    accuracy, precision, recall, f1 = compute_metrics(tp, fp, tn, fn)

    print()
    print("  Confusion Matrix:")
    print(f"              | Pred FALL | Pred NORMAL")
    print(f"  Actual FALL |  TP={tp:>3}   |  FN={fn:>3}")
    print(f"  Actual NORM |  FP={fp:>3}   |  TN={tn:>3}")
    print()
    print(f"  Total videos tested : {total}  (fall={n_fall}, adl={n_adl}, failed={len(failed)})")
    print()
    print(f"  Accuracy   : {accuracy:.4f}  ({accuracy:.2%})  -- {tp+tn}/{total} dung")
    print(f"  Precision  : {precision:.4f}  ({precision:.2%})  -- {tp}/{tp+fp} canh bao la dung")
    print(f"  Recall     : {recall:.4f}  ({recall:.2%})  -- {tp}/{tp+fn} fall duoc phat hien")
    print(f"  F1-Score   : {f1:.4f}  ({f1:.2%})")
    print()

    # -- Luu ket qua ra JSON ----------------------------------------
    output = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "dataset": "UR Fall Detection Dataset",
        "config": {
            "frame_step": FRAME_STEP,
            "num_fall_tested": n_fall,
            "num_adl_tested": n_adl,
        },
        "total_videos": total,
        "failed_downloads": failed,
        "confusion_matrix": {"TP": tp, "FP": fp, "TN": tn, "FN": fn},
        "metrics": {
            "accuracy":  round(accuracy,  4),
            "precision": round(precision, 4),
            "recall":    round(recall,    4),
            "f1":        round(f1,        4),
        },
        "per_video_results": [
            {
                "video": v,
                "ground_truth": gt,
                "predicted": pred,
                "label": ("TP" if gt==1 and pred==1 else
                          "FN" if gt==1 and pred==0 else
                          "FP" if gt==0 and pred==1 else "TN"),
                "correct": (gt == pred),
            }
            for v, gt, pred in results
        ]
    }

    out_path = Path(__file__).parent / "benchmark_results.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    log(f"\n  Ket qua chi tiet da luu tai: {out_path}")
    log("=" * 60)

    # -- In cac video bi phan loai sai ------------------------------
    wrong = [(v, gt, pred) for v, gt, pred in results if gt != pred]
    if wrong:
        log(f"\n  {len(wrong)} video bi phan loai SAI:")
        for v, gt, pred in wrong:
            gt_lbl   = "FALL"   if gt   == 1 else "NORMAL"
            pred_lbl = "FALL"   if pred == 1 else "NORMAL"
            err_type = "FP - Bao nham" if (gt==0 and pred==1) else "FN - Bo sot"
            log(f"     {v:<32}  GT={gt_lbl:<6}  Pred={pred_lbl:<6}  [{err_type}]")
    else:
        log("\n  Tat ca video duoc phan loai DUNG!")

    return output


if __name__ == "__main__":
    run_benchmark()
