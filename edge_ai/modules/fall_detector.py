import joblib
import numpy as np
from collections import deque
from pathlib import Path
import time

MODEL_PATH = Path(__file__).parent.parent / "models" / "fall_model.pkl"

# ── Giai doan 1: Phat hien "nghi ngo nga" (Stage 1 - Suspicious) ─────────────
WINDOW_SIZE          = 15    # Giam tu 20 xuong 15 (phan ung nhanh hon)
FALL_RATIO_THRESHOLD = 0.50  # 50% frame vote "nga" la du
PER_FRAME_THRESHOLD  = 0.75  # Nguong AI per-frame (tang do nhay)
FALL_LABEL           = 1

# ── Giai doan 2: Xac nhan "nam yem tren san" (Stage 2 - Ground Confirmation) ─
CONFIRMATION_DURATION    = 1.0   # Giam them tu 1.5s xuong 1.0s
GROUND_HIP_Y_THRESHOLD   = 0.45  # Giam tu 0.65 xuong 0.45 (Bao phu ca nhung ca nga o xa camera)
STANDING_HIP_Y_THRESHOLD = 0.35  # Giam tu 0.55 xuong 0.35

# ── Rule-based fallback ─
RULE_TORSO_ANGLE_MIN = 45.0  # Giam tu 55 xuong 45 do
RULE_BBOX_RATIO      = 1.2   # Giam tu 1.5 xuong 1.2 (Co the hoi ngang cung bat)

_model = None

# ── Storage trang thai theo tung nguoi ───────────────────────────────────────
_history_preds    = {}   # person_id → deque(bool): lich su vote "nga" per-frame
_history_hip_y    = {}   # person_id → deque(float): lich su hip_y de tinh gia toc
_history_ts       = {}   # person_id → deque(float): lich su thoi gian
_last_seen        = {}   # person_id → float: lan cuoi nhin thay
_tracked_boxes    = {}   # person_id → [min_x, min_y, max_x, max_y]
_prev_hip_y       = {}   # person_id → float: hip_y frame truoc (de tinh velocity)
_fall_stage       = {}   # person_id → 'normal' | 'confirming'
_suspicious_since = {}   # person_id → float: timestamp bat dau Stage 2
_next_person_id   = 0


def _load_model():
    global _model
    if _model is None:
        if MODEL_PATH.exists():
            _model = joblib.load(MODEL_PATH)
            print(f"[OK] Da tai fall_model tu {MODEL_PATH}")
        else:
            print(f"[WARN] Khong tim thay fall_model. Su dung Rule-based fallback.")
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
    """Xoa trang thai cua nguoi khong xuat hien qua timeout giay."""
    to_remove = [pid for pid, ts in _last_seen.items() if now - ts > timeout]
    for pid in to_remove:
        _history_preds.pop(pid, None)
        _history_hip_y.pop(pid, None)
        _history_ts.pop(pid, None)
        _last_seen.pop(pid, None)
        _tracked_boxes.pop(pid, None)
        _prev_hip_y.pop(pid, None)
        _fall_stage.pop(pid, None)
        _suspicious_since.pop(pid, None)


def get_person_id(landmarks) -> int:
    global _next_person_id
    min_x = min(lm.x for lm in landmarks)
    max_x = max(lm.x for lm in landmarks)
    min_y = min(lm.y for lm in landmarks)
    max_y = max(lm.y for lm in landmarks)
    bbox = [min_x, min_y, max_x, max_y]

    best_id   = None
    best_iou  = 0.3  # min IoU de khop voi nguoi cu

    for pid, t_box in _tracked_boxes.items():
        iou = _compute_iou(bbox, t_box)
        if iou > best_iou:
            best_iou = iou
            best_id  = pid

    if best_id is None:
        best_id = _next_person_id
        _next_person_id += 1
        _history_preds[best_id]    = deque(maxlen=WINDOW_SIZE)
        _history_hip_y[best_id]    = deque(maxlen=WINDOW_SIZE)
        _history_ts[best_id]       = deque(maxlen=WINDOW_SIZE)
        _fall_stage[best_id]       = 'normal'
        _suspicious_since[best_id] = 0.0

    _tracked_boxes[best_id] = bbox
    _last_seen[best_id]     = time.time()
    return best_id


def predict_fall(features: list, landmarks) -> tuple:
    """
    He thong 2 giai doan chong bao nham:

    Giai doan 1 - "Nghi ngo":
        ML model / Rule-based xet 20 frame gan nhat.
        Can >= 60% frame vote "nga" de chuyen sang Stage 2.

    Giai doan 2 - "Xac nhan nam yem":
        Theo doi vi tri hong (hip_y) them 2.5 giay.
        Neu hong van o sat san (hip_y > 0.65) → NGA THAT → tra True.
        Neu nguoi dung day (hip_y < 0.55) → Chi di chuyen nhanh → RESET.

    Returns: (is_falling: bool, fall_prob: float, person_id: int)
    """
    now = time.time()
    cleanup_old_tracks(now)

    person_id = get_person_id(landmarks)
    model     = _load_model()

    # ── Doc features ──────────────────────────────────────────────────────────
    torso_angle = features[0]
    hip_y       = features[1]   # 0 = dinh anh, 1 = day anh (nguoi san = gan 1)
    bbox_w      = features[3]
    bbox_h      = features[4]

    # ── Tinh van toc hong (hip velocity) ─────────────────────────────────────
    prev_hip_y   = _prev_hip_y.get(person_id, hip_y)
    hip_velocity = hip_y - prev_hip_y   # duong = hong dang XUONG (dau hieu nga)
    _prev_hip_y[person_id] = hip_y

    fall_prob = 0.0

    # ══════════════════════════════════════════════════════════════════════════
    # GIAI DOAN 1: Phat hien "nghi ngo nga" bang ML hoac Rule-based
    # ══════════════════════════════════════════════════════════════════════════
    if model is not None:
        X = np.array(features, dtype=np.float32).reshape(1, -1)
        if hasattr(model, "predict_proba"):
            proba      = model.predict_proba(X)[0]
            fall_index = int(np.where(model.classes_ == FALL_LABEL)[0][0]) \
                         if hasattr(model, "classes_") else 1
            fall_prob  = float(proba[fall_index])
            # Nguong per-frame tang len 0.85 (tu 0.75)
            is_fall_frame = fall_prob > PER_FRAME_THRESHOLD
        else:
            pred_label    = int(model.predict(X)[0])
            fall_prob     = 1.0 if pred_label == FALL_LABEL else 0.0
            is_fall_frame = (pred_label == FALL_LABEL)
    else:
        # Rule-based fallback: nguong chat hon nhieu (65 do & ty le 1.5)
        rule_is_fall  = (abs(torso_angle) > RULE_TORSO_ANGLE_MIN) or \
                        (bbox_w > bbox_h * RULE_BBOX_RATIO)
        fall_prob     = 0.85 if rule_is_fall else 0.15
        is_fall_frame = rule_is_fall

    # Cap nhat lich su window
    _history_preds[person_id].append(is_fall_frame)
    _history_hip_y[person_id].append(hip_y)
    _history_ts[person_id].append(now)
    
    history    = _history_preds[person_id]
    fall_ratio = sum(history) / len(history) if history else 0.0

    # Giai doan 1 passed: >= 50% frame
    stage1_suspicious = (fall_ratio >= FALL_RATIO_THRESHOLD)

    # ══════════════════════════════════════════════════════════════════════════
    # LOP 2: Tinh toan dong hoc (Gia toc roi)
    # ══════════════════════════════════════════════════════════════════════════
    buffer_velocity = 0.0
    if len(_history_hip_y[person_id]) > 5:
        oldest_hip = _history_hip_y[person_id][0]
        oldest_ts  = _history_ts[person_id][0]
        if now > oldest_ts:
            buffer_velocity = (hip_y - oldest_hip) / (now - oldest_ts)

    # ══════════════════════════════════════════════════════════════════════════
    # LOP 3: He thong Cham diem (Scoring System)
    # ══════════════════════════════════════════════════════════════════════════
    score = 0
    
    # 1. AI Score (Max 40 diem)
    score += min(40, int(fall_prob * 40))
    
    # 2. Kinematics Score (Max 30 diem)
    # buffer_velocity > 0 nghia la dang rot xuong.
    kinematic_score = min(30, int(max(0, buffer_velocity) * 60))
    score += kinematic_score
    
    # 3. Immobility Score (Max 30 diem)
    elapsed = 0.0
    current_stage = _fall_stage.get(person_id, 'normal')
    
    if stage1_suspicious and hip_y > GROUND_HIP_Y_THRESHOLD:
        if current_stage == 'normal':
            _fall_stage[person_id] = 'confirming'
            _suspicious_since[person_id] = now
            print(f"[STAGE1] Person {person_id}: Nghi ngo nga (prob={fall_prob:.2f}, vel={buffer_velocity:+.3f})")
        else:
            elapsed = now - _suspicious_since.get(person_id, now)
    else:
        if current_stage == 'confirming':
            print(f"[RESET] Person {person_id}: Huy nghi ngo (hip_y={hip_y:.2f})")
        _fall_stage[person_id] = 'normal'
        _suspicious_since[person_id] = 0.0
        
    immobility_score = min(30, int((elapsed / CONFIRMATION_DURATION) * 30))
    score += immobility_score
    
    # Quyen dinh cuoi cung: Tong diem > 60 la Nga (is_falling) thay vi 80
    is_falling = score > 60
    
    if is_falling:
        print(f"[ALERT] Person {person_id}: XAC NHAN TÉ NGÃ! (Score: {score}/100 - AI:{int(fall_prob*40)}, Vel:{kinematic_score}, Time:{immobility_score})")
        # Reset de tranh spam
        _fall_stage[person_id] = 'normal'
        _suspicious_since[person_id] = 0.0
        _history_preds[person_id].clear()
        _history_hip_y[person_id].clear()
        _history_ts[person_id].clear()

    return is_falling, fall_prob, score, person_id
