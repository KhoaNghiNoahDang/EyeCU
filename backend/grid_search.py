import json
from itertools import product
from collections import deque

def simulate_predict_fall(frames, params):
    W = params["WINDOW_SIZE"]
    RATIO_TH = params["FALL_RATIO_THRESHOLD"]
    PER_FRAME = params["PER_FRAME_THRESHOLD"]
    CONF_DUR = params["CONFIRMATION_DURATION"]
    GROUND_Y = params["GROUND_HIP_Y_THRESHOLD"]
    VEL_MULT = params["VELOCITY_MULTIPLIER"]
    SCORE_TH = params["SCORE_THRESHOLD"]
    
    history_preds = deque(maxlen=W)
    history_hip_y = deque(maxlen=W)
    history_ts = deque(maxlen=W)
    
    fall_stage = 'normal'
    suspicious_since = 0.0
    now = 0.0
    
    for frame in frames:
        f_prob = frame["fall_prob"]
        hip_y = frame["hip_y"]
        dt = frame["dt"]
        now += dt
        
        is_fall_frame = f_prob > PER_FRAME
        history_preds.append(is_fall_frame)
        history_hip_y.append(hip_y)
        history_ts.append(now)
        
        fall_ratio = sum(history_preds) / len(history_preds)
        stage1_suspicious = fall_ratio >= RATIO_TH
        
        buffer_velocity = 0.0
        if len(history_hip_y) > 5:
            oldest_hip = history_hip_y[0]
            oldest_ts = history_ts[0]
            if now > oldest_ts:
                buffer_velocity = (hip_y - oldest_hip) / (now - oldest_ts)
                
        score = 0
        score += min(40, int(f_prob * 40))
        
        kinematic_score = min(30, int(max(0, buffer_velocity) * VEL_MULT))
        score += kinematic_score
        
        elapsed = 0.0
        if stage1_suspicious and hip_y > GROUND_Y:
            if fall_stage == 'normal':
                fall_stage = 'confirming'
                suspicious_since = now
            else:
                elapsed = now - suspicious_since
        else:
            fall_stage = 'normal'
            suspicious_since = 0.0
            
        immobility_score = min(30, int((elapsed / CONF_DUR) * 30)) if CONF_DUR > 0 else 0
        score += immobility_score
        
        if score > SCORE_TH:
            return True # Fall detected
            
    return False

def evaluate(cache_data, params):
    tp = fn = fp = tn = 0
    for name, data in cache_data.items():
        label = data["label"]
        frames = data["frames"]
        pred = simulate_predict_fall(frames, params)
        if label == 1 and pred: tp += 1
        elif label == 1 and not pred: fn += 1
        elif label == 0 and pred: fp += 1
        else: tn += 1
        
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
    return {"tp": tp, "fn": fn, "fp": fp, "tn": tn, "p": precision, "r": recall, "f1": f1}

def main():
    with open("benchmark_cache.json", "r") as f:
        cache = json.load(f)
        
    print(f"Loaded {len(cache)} videos from cache.")
    
    # Define search space
    grid = {
        "WINDOW_SIZE": [10, 15, 20],
        "FALL_RATIO_THRESHOLD": [0.3, 0.4, 0.5],
        "PER_FRAME_THRESHOLD": [0.6, 0.7, 0.75],
        "CONFIRMATION_DURATION": [0.3, 0.5, 0.8],
        "GROUND_HIP_Y_THRESHOLD": [0.2, 0.3, 0.4],
        "VELOCITY_MULTIPLIER": [60, 120, 200],
        "SCORE_THRESHOLD": [40, 50, 55, 60]
    }
    
    keys = list(grid.keys())
    values = list(grid.values())
    combinations = list(product(*values))
    print(f"Total combinations to test: {len(combinations)}")
    
    best_results = []
    for i, combo in enumerate(combinations):
        params = dict(zip(keys, combo))
        res = evaluate(cache, params)
        best_results.append((res["f1"], res, params))
        if i % 1000 == 0:
            print(f"Tested {i}/{len(combinations)}...")
            
    best_results.sort(key=lambda x: x[0], reverse=True)
    
    print("\n" + "="*50)
    print("TOP 5 CONFIGURATIONS FOR HIGHEST F1-SCORE")
    print("="*50)
    
    for i in range(5):
        f1, res, p = best_results[i]
        print(f"\nTOP {i+1} - F1: {f1:.4f} | Recall: {res['r']:.4f} | Precision: {res['p']:.4f}")
        print(f"TP={res['tp']}, FN={res['fn']}, FP={res['fp']}, TN={res['tn']}")
        for k, v in p.items():
            print(f"  {k} = {v}")

if __name__ == "__main__":
    main()
