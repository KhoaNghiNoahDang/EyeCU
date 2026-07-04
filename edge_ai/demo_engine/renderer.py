import cv2
import numpy as np
from .skeleton import (
    SKELETON_PAIRS, BODY_CONTOUR_ORDER, NUM_JOINTS,
    HEAD, L_SHOULDER, R_SHOULDER, L_HIP, R_HIP,
)

FRAME_W = 480
FRAME_H = 270


def draw_room(frame, room_id):
    """Ve nen phong benh vien don gian."""
    # Tuong nen (xam nhat)
    cv2.rectangle(frame, (0, 0), (FRAME_W, FRAME_H), (180, 180, 180), -1)

    # San (xam dam hon)
    cv2.rectangle(frame, (0, 220), (FRAME_W, FRAME_H), (140, 140, 140), -1)

    # Giuong (trang)
    cv2.rectangle(frame, (40, 170), (180, 225), (240, 240, 240), -1)
    cv2.rectangle(frame, (40, 170), (180, 175), (200, 200, 220), -1)
    # Goi
    cv2.rectangle(frame, (45, 175), (85, 195), (220, 220, 235), -1)

    # Ban ghe (xanh nhat)
    cv2.rectangle(frame, (340, 165), (400, 220), (180, 200, 190), -1)
    cv2.rectangle(frame, (345, 145), (395, 165), (170, 190, 180), -1)

    # Cua ( nau)
    cv2.rectangle(frame, (430, 90), (475, 225), (100, 70, 40), -1)
    cv2.rectangle(frame, (432, 92), (473, 223), (139, 90, 43), -1)
    # Tay nam cua
    cv2.circle(frame, (440, 160), 4, (180, 160, 100), -1)

    # Cua so (trai)
    cv2.rectangle(frame, (200, 50), (290, 140), (200, 220, 240), 2)
    cv2.line(frame, (245, 50), (245, 140), (200, 220, 240), 1)
    cv2.line(frame, (200, 95), (290, 95), (200, 220, 240), 1)
    # Rem cua so
    cv2.rectangle(frame, (200, 45), (290, 55), (180, 200, 220), -1)

    # Ten phong (goc trai tren)
    cv2.putText(frame, room_id, (12, 28),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (60, 60, 60), 2)

    # Dong ho tren tuong
    cv2.circle(frame, (320, 60), 22, (255, 255, 255), -1)
    cv2.circle(frame, (320, 60), 22, (100, 100, 100), 2)
    cv2.line(frame, (320, 60), (320, 45), (80, 80, 80), 2)
    cv2.line(frame, (320, 60), (332, 60), (80, 80, 80), 1)


def _get_body_contour_points(pose):
    """Lay cac diem tao than nguoi (body outline)."""
    points = []
    for joint_idx in BODY_CONTOUR_ORDER:
        if joint_idx < NUM_JOINTS and joint_idx in pose:
            points.append(pose[joint_idx])
    return points


def draw_figure(frame, pose, is_falling=False):
    """Ve figure nguoi: body outline + skeleton + keypoints."""
    overlay = frame.copy()

    # 1. Body outline (da giac dien quanh co the)
    contour_pts = _get_body_contour_points(pose)
    if len(contour_pts) >= 3:
        pts = np.array(contour_pts, dtype=np.int32)
        color_body = (40, 40, 50) if not is_falling else (50, 30, 30)
        cv2.fillPoly(overlay, [pts], color_body)
        cv2.addWeighted(overlay, 0.45, frame, 0.55, 0, frame)

    # 2. Skeleton (noi cac keypoints)
    line_color = (230, 230, 230) if not is_falling else (100, 100, 255)
    for (a, b) in SKELETON_PAIRS:
        if a in pose and b in pose:
            pt1 = pose[a]
            pt2 = pose[b]
            cv2.line(frame, pt1, pt2, line_color, 2, cv2.LINE_AA)

    # 3. Keypoints (cac cham tron)
    kp_color = (0, 220, 0) if not is_falling else (0, 100, 255)
    for joint_idx in range(NUM_JOINTS):
        if joint_idx in pose:
            x, y = pose[joint_idx]
            radius = 5 if joint_idx == HEAD else 3
            cv2.circle(frame, (x, y), radius, kp_color, -1, cv2.LINE_AA)

    # 4. Dau (vong tron lon hon)
    if HEAD in pose:
        hx, hy = pose[HEAD]
        cv2.circle(frame, (hx, hy), 10, kp_color, 2, cv2.LINE_AA)

    # 5. Neu dang nga -> hieu ung den + vach do
    if is_falling:
        # Vach che duoi
        alpha = 0.15
        red_overlay = frame.copy()
        cv2.rectangle(red_overlay, (0, 220), (FRAME_W, FRAME_H), (0, 0, 200), -1)
        cv2.addWeighted(red_overlay, alpha, frame, 1 - alpha, 0, frame)

        # Chu "PHAT HIEN NGA"
        cv2.putText(frame, "PHAT HIEN NGA", (FRAME_W // 2 - 80, FRAME_H - 15),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)


def create_demo_frame(room_id, pose, is_falling=False):
    """Tao 1 frame demo day du."""
    frame = np.zeros((FRAME_H, FRAME_W, 3), dtype=np.uint8)
    draw_room(frame, room_id)
    draw_figure(frame, pose, is_falling)
    return frame
