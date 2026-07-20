import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import urllib.request
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "pose_landmarker.task")
MODEL_URL = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task"


def _ensure_model():
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    if not os.path.exists(MODEL_PATH):
        print("[INFO] Dang tai pose_landmarker model (~10MB)...")
        urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
        print("[OK] Tai model xong.")


_landmarker = None


def _get_landmarker():
    global _landmarker
    if _landmarker is None:
        _ensure_model()
        base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
        options = mp_vision.PoseLandmarkerOptions(
            base_options=base_options,
            output_segmentation_masks=False,
            min_pose_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            num_poses=4,
        )
        _landmarker = mp_vision.PoseLandmarker.create_from_options(options)
    return _landmarker


# Index cua cac landmarks quan trong (giong PoseLandmark enum cu)
LEFT_SHOULDER  = 11
RIGHT_SHOULDER = 12
LEFT_HIP       = 23
RIGHT_HIP      = 24


def get_landmarks(frame: np.ndarray, bbox: tuple = None):
    """
    Tra ve (landmarks_list, image_shape) hoac None neu khong phat hien.
    landmarks_list: list cac NormalizedLandmark
    image_shape: (height, width, channels)
    """
    if bbox is not None:
        x1, y1, x2, y2 = bbox
        crop = frame[y1:y2, x1:x2]
    else:
        crop = frame

    if crop.size == 0:
        return None

    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = _get_landmarker().detect(mp_image)

    if not result.pose_landmarks:
        return []

    return [(landmarks, crop.shape) for landmarks in result.pose_landmarks]

def draw_skeleton(frame: np.ndarray, landmarks: list):
    """
    Ve khung xuong len frame dua tren danh sach cac diem anh.
    """
    h, w = frame.shape[:2]
    
    # Cac diem noi cua khung xuong (Pose connections)
    connections = [
        (0, 1), (1, 2), (2, 3), (3, 7), (0, 4), (4, 5), (5, 6), (6, 8), 
        (9, 10), (11, 12), (11, 13), (13, 15), (15, 17), (15, 19), (15, 21), 
        (17, 19), (12, 14), (14, 16), (16, 18), (16, 20), (16, 22), (18, 20), 
        (11, 23), (12, 24), (23, 24), (23, 25), (24, 26), (25, 27), (26, 28), 
        (27, 29), (28, 30), (29, 31), (30, 32), (27, 31), (28, 32)
    ]
    
    # Chuyen doi toa do tu 0-1 thanh pixel
    points = []
    for lm in landmarks:
        px, py = int(lm.x * w), int(lm.y * h)
        points.append((px, py))
        # Ve diem khop (mau do, ban kinh 8)
        cv2.circle(frame, (px, py), 8, (0, 0, 255), -1)
        
    # Ve duong noi
    for p1, p2 in connections:
        if p1 < len(points) and p2 < len(points):
            # Chi ve neu diem do co kha nang nhin thay tot (visibility > 0.3)
            if landmarks[p1].visibility > 0.3 and landmarks[p2].visibility > 0.3:
                cv2.line(frame, points[p1], points[p2], (0, 0, 255), 6)
    
    return frame
