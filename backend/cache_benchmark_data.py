import os
import json
import cv2
import time
import numpy as np
from pathlib import Path
import sys

# Them thu muc vao sys.path de import
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "edge_ai"))
from modules.pose_extractor import get_landmarks
from modules.feature_extractor import extract_features
from modules.fall_detector import _load_model, RULE_TORSO_ANGLE_MIN, RULE_BBOX_RATIO

def compute_fall_prob(features, landmarks):
    model = _load_model()
    # Tinh toan rule-based features
    left_shoulder = landmarks[11]
    left_hip = landmarks[23]
    right_hip = landmarks[24]
    
    torso_dx = left_shoulder.x - left_hip.x
    torso_dy = left_shoulder.y - left_hip.y
    torso_angle = np.degrees(np.arctan2(torso_dy, torso_dx))
    
    xs = [lm.x for lm in landmarks]
    ys = [lm.y for lm in landmarks]
    bbox_w = max(xs) - min(xs)
    bbox_h = max(ys) - min(ys)
    hip_y = (left_hip.y + right_hip.y) / 2.0

    if model is not None:
        X = np.array(features).reshape(1, -1)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            fall_prob = float(proba[1]) if len(proba) > 1 else 0.0
        else:
            pred = int(model.predict(X)[0])
            fall_prob = 1.0 if pred == 1 else 0.0
    else:
        rule_is_fall = (abs(torso_angle) > RULE_TORSO_ANGLE_MIN) or (bbox_w > bbox_h * RULE_BBOX_RATIO)
        fall_prob = 0.85 if rule_is_fall else 0.15

    return fall_prob, hip_y

def main():
    dataset_dir = Path("datasets/ur_fall")
    
    videos = []
    for f in dataset_dir.glob("*.mp4"):
        label = 1 if f.name.startswith("fall") else 0
        videos.append((f.name, str(f), label))
    
    cache_data = {}
    
    for i, (name, path, label) in enumerate(videos):
        print(f"Caching [{i+1}/{len(videos)}]: {name}")
        cap = cv2.VideoCapture(path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        dt_per_frame = 1.0 / fps
        
        frames_data = []
        frame_idx = 0
        while True:
            ret, frame = cap.read()
            if not ret: break
            
            # Skip frames to match FRAME_STEP=2
            if frame_idx % 2 == 0:
                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = get_landmarks(frame_rgb)
                if results:
                    # just take the first person
                    lms, shape = results[0]
                    feats = extract_features(lms, shape)
                    if feats is not None:
                        f_prob, h_y = compute_fall_prob(feats, lms)
                        frames_data.append({
                            "fall_prob": round(f_prob, 4),
                            "hip_y": round(h_y, 4),
                            "dt": round(dt_per_frame * 2, 4)
                        })
            frame_idx += 1
        cap.release()
        cache_data[name] = {"label": label, "frames": frames_data}
    
    with open("benchmark_cache.json", "w") as f:
        json.dump(cache_data, f)
    print("Xong! Da luu benchmark_cache.json")

if __name__ == "__main__":
    main()
