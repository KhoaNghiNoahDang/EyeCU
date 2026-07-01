import numpy as np

# Index cua landmarks trong MediaPipe Tasks API (giong cu)
LEFT_SHOULDER  = 11
RIGHT_SHOULDER = 12
LEFT_HIP       = 23
RIGHT_HIP      = 24


def extract_features(landmarks: list, image_shape: tuple) -> list:
    """
    Nhan vao list NormalizedLandmark (MediaPipe Tasks API) va kich thuoc anh.
    Tra ve vector 5 feature dung cho Random Forest.
    """
    height, width, _ = image_shape

    # Kiem tra xem vung Hong (Hips) co duoc camera nhin thay hay khong.
    # Neu dang ngoi lap top chi thay nua nguoi tren, visibility se rat thap (< 0.5).
    # Khong the phan doan chinh xac "NGA" neu khong thay duoc phan duoi co the.
    left_hip_vis = landmarks[LEFT_HIP].visibility
    right_hip_vis = landmarks[RIGHT_HIP].visibility
    
    if left_hip_vis < 0.4 and right_hip_vis < 0.4:
        return None

    def get_point(idx):
        lm = landmarks[idx]
        return np.array([lm.x * width, lm.y * height], dtype=np.float32)

    left_shoulder  = get_point(LEFT_SHOULDER)
    right_shoulder = get_point(RIGHT_SHOULDER)
    left_hip       = get_point(LEFT_HIP)
    right_hip      = get_point(RIGHT_HIP)

    mid_shoulder = (left_shoulder + right_shoulder) / 2.0
    mid_hip      = (left_hip + right_hip) / 2.0

    vec = mid_shoulder - mid_hip
    angle_rad       = np.arctan2(abs(vec[0]), abs(vec[1]) + 1e-6)
    torso_angle_deg = float(np.degrees(angle_rad))

    hip_y_norm      = float(mid_hip[1] / height)
    shoulder_y_norm = float(mid_shoulder[1] / height)

    xs = np.array([lm.x for lm in landmarks], dtype=np.float32) * width
    ys = np.array([lm.y for lm in landmarks], dtype=np.float32) * height

    bbox_w_norm = float((xs.max() - xs.min()) / width)
    bbox_h_norm = float((ys.max() - ys.min()) / height)

    return [
        torso_angle_deg,
        hip_y_norm,
        shoulder_y_norm,
        bbox_w_norm,
        bbox_h_norm,
    ]
