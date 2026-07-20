import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import urllib.request
import os

SEG_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "selfie_segmenter.tflite")
SEG_MODEL_URL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite"

_segmenter = None


def _ensure_seg_model():
    os.makedirs(os.path.dirname(SEG_MODEL_PATH), exist_ok=True)
    if not os.path.exists(SEG_MODEL_PATH):
        print("[INFO] Dang tai selfie_segmenter model (~1MB)...")
        urllib.request.urlretrieve(SEG_MODEL_URL, SEG_MODEL_PATH)
        print("[OK] Tai model xong.")


def _get_segmenter():
    global _segmenter
    if _segmenter is None:
        _ensure_seg_model()
        base_options = mp_python.BaseOptions(model_asset_path=SEG_MODEL_PATH)
        options = mp_vision.ImageSegmenterOptions(
            base_options=base_options,
            output_category_mask=True,
        )
        _segmenter = mp_vision.ImageSegmenter.create_from_options(options)
    return _segmenter


def anonymize_body(frame: np.ndarray, blur_level: str = 'heavy', return_mask: bool = False):
    """
    Lam mo hoac che khuat co the nguoi trong frame, giu nguyen phong canh.
    - 'heavy': Lam mo rat manh hoac to mau den de an hoan toan nguoi (chi hien khung xuong).
    - 'light': Lam mo nhe de thay hinh anh nguoi benh.
    - return_mask: Tra ve them mang boolean (H, W, 3) chi vi tri nguoi.
    """
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

    result = _get_segmenter().segment(mp_image)
    if result.category_mask is None:
        if return_mask:
            return frame, np.zeros((frame.shape[0], frame.shape[1], 3), dtype=bool)
        return frame

    mask = result.category_mask.numpy_view()
    mask = np.squeeze(mask)  # (H, W)
    condition = np.stack((mask,) * 3, axis=-1) < 0.1 # Nguoi la mask == 0

    if blur_level == 'heavy':
        # Privacy tuyet doi: To mau den hoan toan len co the nguoi benh (tao thanh bong den)
        black_silhouette = np.zeros_like(frame)
        res_frame = np.where(condition, black_silhouette, frame) 
    else:
        # Lam mo nhe de van thay hinh dang nguoi benh (giam thieu canh bao nham)
        blurred = cv2.GaussianBlur(frame, (21, 21), 10)
        res_frame = np.where(condition, blurred, frame)

    if return_mask:
        return res_frame, condition
    return res_frame
