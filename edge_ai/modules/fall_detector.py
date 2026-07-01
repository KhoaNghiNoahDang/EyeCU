import joblib
import numpy as np
from collections import deque
from pathlib import Path

MODEL_PATH = Path(__file__).parent.parent / "models" / "fall_model.pkl"
WINDOW_SIZE = 10
FALL_PROB_THRESHOLD = 0.6
FALL_LABEL = 1

_model = None
_recent_preds = deque(maxlen=WINDOW_SIZE)

def _load_model():
    global _model
    if _model is None:
        if MODEL_PATH.exists():
            _model = joblib.load(MODEL_PATH)
            print(f"[OK] Da tai model tu {MODEL_PATH}")
        else:
            print(f"[WARN] Khong tim thay model tai {MODEL_PATH}. Dung Rule-based fallback.")
    return _model

def predict_fall(features: list) -> bool:
    model = _load_model()
    
    # Bo rule qua khat khe vi no chan mat tinh huong nga ve phia truoc (Forward Fall)
    # Thay vao do chung ta nang do kho cua ML Model len.
    
    if model is not None:
        X = np.array(features, dtype=np.float32).reshape(1, -1)
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(X)[0]
            fall_index = int(np.where(model.classes_ == FALL_LABEL)[0][0]) if hasattr(model, "classes_") else 1
            fall_prob = float(proba[fall_index])
            
            # Model phai rat chac chan (> 75%) thi moi tinh la 1 frame nga
            is_fall = fall_prob > 0.75
            _recent_preds.append(is_fall)
        else:
            pred_label = int(model.predict(X)[0])
            _recent_preds.append(pred_label == FALL_LABEL)
            
        if _recent_preds:
            # Chi can 40% so frame trong window la nga (tuc la ~4/10 frame) -> bao dong luon de phan ung nhanh
            fall_ratio = sum(_recent_preds) / len(_recent_preds)
            return fall_ratio >= 0.4
        return False
    else:
        # Rule-based fallback: Nho hon -> Nga ngang hoac vai thap hon hong
        torso_angle = features[0]
        bbox_w = features[3]
        bbox_h = features[4]
        rule_is_fall = (abs(torso_angle) > 45) or (bbox_w > bbox_h)
        _recent_preds.append(rule_is_fall)
        if _recent_preds:
            return sum(_recent_preds) / len(_recent_preds) >= 0.5
        return False
