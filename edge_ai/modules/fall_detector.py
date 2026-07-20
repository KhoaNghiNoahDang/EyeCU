import joblib
import numpy as np
from collections import deque
from pathlib import Path
import time

MODEL_PATH = Path(__file__).parent.parent / "models" / "fall_model.pkl"
WINDOW_SIZE = 10
FALL_PROB_THRESHOLD = 0.6
FALL_LABEL = 1

_model = None

# Multi-person tracking storage
# person_id -> deque of recent predictions
_history_preds = {}
# person_id -> last seen timestamp
_last_seen = {}
# person_id -> last known bbox [min_x, min_y, max_x, max_y]
_tracked_boxes = {}
_next_person_id = 0

def _load_model():
    global _model
    if _model is None:
        if MODEL_PATH.exists():
            _model = joblib.load(MODEL_PATH)
            print(f"[OK] Da tai model tu {MODEL_PATH}")
        else:
            print(f"[WARN] Khong tim thay model tai {MODEL_PATH}. Dung Rule-based fallback.")
    return _model

def _compute_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interArea = max(0, xB - xA) * max(0, yB - yA)
    if interArea == 0:
        return 0.0

    boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
    boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])

    return interArea / float(boxAArea + boxBArea - interArea)

def cleanup_old_tracks(now, timeout=5.0):
    to_remove = [pid for pid, ts in _last_seen.items() if now - ts > timeout]
    for pid in to_remove:
        del _history_preds[pid]
        del _last_seen[pid]
        del _tracked_boxes[pid]

def get_person_id(landmarks) -> int:
    global _next_person_id
    # Calculate approx bbox from landmarks (x, y are 0-1 normalized)
    min_x = min([lm.x for lm in landmarks])
    max_x = max([lm.x for lm in landmarks])
    min_y = min([lm.y for lm in landmarks])
    max_y = max([lm.y for lm in landmarks])
    bbox = [min_x, min_y, max_x, max_y]
    
    best_id = None
    best_iou = 0.3 # min IoU to match
    
    for pid, t_box in _tracked_boxes.items():
        iou = _compute_iou(bbox, t_box)
        if iou > best_iou:
            best_iou = iou
            best_id = pid
            
    if best_id is None:
        best_id = _next_person_id
        _next_person_id += 1
        _history_preds[best_id] = deque(maxlen=WINDOW_SIZE)
        
    _tracked_boxes[best_id] = bbox
    _last_seen[best_id] = time.time()
    return best_id

def predict_fall(features: list, landmarks) -> tuple:
    """
    Returns (is_falling, fall_prob, person_id)
    """
    now = time.time()
    cleanup_old_tracks(now)
    
    person_id = get_person_id(landmarks)
    model = _load_model()
    is_fall = False
    fall_prob = 0.0
    
    if model is not None:
        X = np.array(features, dtype=np.float32).reshape(1, -1)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            fall_index = int(np.where(model.classes_ == FALL_LABEL)[0][0]) if hasattr(model, "classes_") else 1
            fall_prob = float(proba[fall_index])
            
            # Khong phan hoi ngay la ngã, ma dua vao history de smooth
            is_fall_frame = fall_prob > 0.75
            _history_preds[person_id].append(is_fall_frame)
        else:
            pred_label = int(model.predict(X)[0])
            fall_prob = 1.0 if pred_label == FALL_LABEL else 0.0
            _history_preds[person_id].append(pred_label == FALL_LABEL)
            
        history = _history_preds[person_id]
        if history:
            fall_ratio = sum(history) / len(history)
            is_fall = fall_ratio >= 0.4
    else:
        # Rule-based fallback
        torso_angle = features[0]
        bbox_w = features[3]
        bbox_h = features[4]
        rule_is_fall = (abs(torso_angle) > 45) or (bbox_w > bbox_h)
        fall_prob = 0.8 if rule_is_fall else 0.2
        _history_preds[person_id].append(rule_is_fall)
        history = _history_preds[person_id]
        if history:
            is_fall = sum(history) / len(history) >= 0.5

    return is_fall, fall_prob, person_id
