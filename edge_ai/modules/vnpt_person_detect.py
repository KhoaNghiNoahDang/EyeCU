import cv2
import numpy as np


def detect_person_bbox(frame: np.ndarray) -> list:
    """
    Tra ve [(x1,y1,x2,y2)] neu co nguoi trong frame.
    Voi pose_extractor moi, ta chi can biet "co nguoi" hay khong
    va pass toan bo frame vao, nen luon tra ve toan bo frame.
    Neu can dung YOLO de detect nhieu nguoi, co the nang cap o day.
    """
    h, w = frame.shape[:2]
    return [(0, 0, w, h)]
