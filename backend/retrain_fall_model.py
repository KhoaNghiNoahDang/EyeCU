"""
Retrain fall_model.pkl su dung 70 video tu UR Fall Detection Dataset.

Chien luoc nhan nhan:
  - ADL video : tat ca frame = NORMAL (label 0)
  - FALL video: 
      - Frame tu 0 den 50%: NORMAL (nguoi dang dung / chuan bi nga)
      - Frame tu 50% den het: FALL   (nguoi dang nga / da nam)
      
De tranh bias, se ap dung class_weight='balanced' trong Random Forest.
"""

import os, sys, cv2, json
import numpy as np
from pathlib import Path
from collections import Counter

sys.path.insert(0, str(Path(__file__).parent.parent / "edge_ai"))

from modules.pose_extractor import get_landmarks
from modules.feature_extractor import extract_features

DATASET_DIR = Path("datasets/ur_fall")
MODEL_OUT   = Path("../edge_ai/models/fall_model.pkl")
FRAME_STEP  = 2   # Doc moi 2 frame (giong benchmark)

def extract_video_features(video_path: str, fall_label_strategy: str = "auto"):
    """
    Trich xuat feature tung frame tu mot video.
    
    fall_label_strategy:
        'all_fall'  - toan bo frame la FALL
        'all_normal'- toan bo frame la NORMAL
        'auto'      - 50% dau la NORMAL, 50% sau la FALL (cho fall video)
    """
    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    X, y = [], []
    frame_idx = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        if frame_idx % FRAME_STEP == 0:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = get_landmarks(frame_rgb)
            if results:
                lms, shape = results[0]
                feats = extract_features(lms, shape)
                if feats is not None:
                    # Quyet dinh nhan
                    if fall_label_strategy == "all_normal":
                        label = 0
                    elif fall_label_strategy == "all_fall":
                        label = 1
                    else:  # auto: 50% cuoi la FALL
                        progress = frame_idx / max(total_frames, 1)
                        label = 1 if progress >= 0.5 else 0
                    
                    X.append(feats)
                    y.append(label)
        
        frame_idx += 1
    
    cap.release()
    return X, y


def main():
    print("=" * 60)
    print("  RETRAIN FALL DETECTION MODEL")
    print("  Dataset: UR Fall Detection (30 falls + 40 ADLs)")
    print("=" * 60)
    
    if not DATASET_DIR.exists():
        print(f"[ERROR] Khong tim thay thu muc dataset: {DATASET_DIR}")
        sys.exit(1)
    
    videos = list(DATASET_DIR.glob("*.mp4"))
    if not videos:
        print("[ERROR] Khong co file MP4 nao trong thu muc dataset!")
        sys.exit(1)
    
    print(f"\nTim thay {len(videos)} video.")
    
    all_X, all_y = [], []
    
    for i, video_path in enumerate(sorted(videos)):
        name = video_path.name
        is_fall = name.startswith("fall")
        strategy = "auto" if is_fall else "all_normal"
        label_str = "FALL(auto)" if is_fall else "NORMAL"
        
        print(f"[{i+1:2d}/{len(videos)}] {name} [{label_str}]", end="", flush=True)
        
        X, y = extract_video_features(str(video_path), fall_label_strategy=strategy)
        all_X.extend(X)
        all_y.extend(y)
        
        fall_count   = sum(1 for lbl in y if lbl == 1)
        normal_count = sum(1 for lbl in y if lbl == 0)
        print(f" → {len(X)} frames (fall={fall_count}, normal={normal_count})")
    
    all_X = np.array(all_X)
    all_y = np.array(all_y)
    
    counter = Counter(all_y)
    print(f"\nTong so mau:")
    print(f"  NORMAL (0): {counter[0]}")
    print(f"  FALL   (1): {counter[1]}")
    print(f"  Tong      : {len(all_y)}")
    
    # ─── Train model ─────────────────────────────────────────────────────────
    print("\nDang train RandomForestClassifier...")
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.model_selection import cross_val_score
    import joblib
    
    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        class_weight="balanced",  # Tu dong can bang do lech nhan
        random_state=42,
        n_jobs=-1
    )
    
    # Cross-validation 5-fold de danh gia truoc khi luu
    print("Dang chay cross-validation 5-fold...")
    cv_scores = cross_val_score(model, all_X, all_y, cv=5, scoring="f1")
    print(f"  CV F1 scores: {[f'{s:.3f}' for s in cv_scores]}")
    print(f"  CV F1 mean  : {cv_scores.mean():.3f} ± {cv_scores.std():.3f}")
    
    # Train tren toan bo data
    model.fit(all_X, all_y)
    
    # Luu model
    MODEL_OUT.parent.mkdir(parents=True, exist_ok=True)
    
    # Backup model cu truoc
    if MODEL_OUT.exists():
        backup = MODEL_OUT.with_suffix(".pkl.bak")
        import shutil
        shutil.copy(MODEL_OUT, backup)
        print(f"\n[OK] Da backup model cu → {backup}")
    
    joblib.dump(model, MODEL_OUT)
    print(f"[OK] Da luu model moi → {MODEL_OUT}")
    
    # Feature importance
    print("\nFeature Importance (tuyen truyen luoc):")
    feature_names = ["torso_angle_deg", "hip_y_norm", "shoulder_y_norm", "bbox_w_norm", "bbox_h_norm"]
    for name, imp in sorted(zip(feature_names, model.feature_importances_), key=lambda x: -x[1]):
        bar = "█" * int(imp * 40)
        print(f"  {name:20s}: {imp:.4f} {bar}")
    
    print("\n✅ Retrain hoan tat! Chay lai benchmark_fall_detection.py de xem ket qua.")


if __name__ == "__main__":
    main()
