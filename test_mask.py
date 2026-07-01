import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import os

SEG_MODEL_PATH = os.path.join(os.path.dirname(__file__), "edge_ai/models/selfie_segmenter.tflite")
base_options = mp_python.BaseOptions(model_asset_path=SEG_MODEL_PATH)
options = mp_vision.ImageSegmenterOptions(
    base_options=base_options,
    output_category_mask=True,
)
segmenter = mp_vision.ImageSegmenter.create_from_options(options)

# Create dummy image
frame = np.ones((100, 100, 3), dtype=np.uint8) * 255
rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
result = segmenter.segment(mp_image)
mask = result.category_mask.numpy_view()
print("Unique values in mask:", np.unique(mask))
