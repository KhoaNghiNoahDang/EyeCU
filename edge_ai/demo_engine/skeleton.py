import math
import random

HEAD = 0
L_SHOULDER = 1
R_SHOULDER = 2
L_ELBOW = 3
R_ELBOW = 4
L_HAND = 5
R_HAND = 6
L_HIP = 7
R_HIP = 8
L_KNEE = 9
R_KNEE = 10
L_FOOT = 11
R_FOOT = 12

NUM_JOINTS = 13

SKELETON_PAIRS = [
    (HEAD, L_SHOULDER),
    (HEAD, R_SHOULDER),
    (L_SHOULDER, L_ELBOW),
    (L_ELBOW, L_HAND),
    (R_SHOULDER, R_ELBOW),
    (R_ELBOW, R_HAND),
    (L_SHOULDER, R_SHOULDER),
    (L_SHOULDER, L_HIP),
    (R_SHOULDER, R_HIP),
    (L_HIP, R_HIP),
    (L_HIP, L_KNEE),
    (L_KNEE, L_FOOT),
    (R_HIP, R_KNEE),
    (R_KNEE, R_FOOT),
]

BODY_CONTOUR_ORDER = [
    HEAD, R_SHOULDER, R_ELBOW, R_HAND,
    R_HIP, R_FOOT, L_FOOT, L_HIP,
    L_ELBOW, L_HAND, L_SHOULDER, HEAD,
]


def _standing(cx=240, cy=80, scale=1.0):
    """Pose dung thang, co the lam kho cho cac pose khac."""
    s = scale
    return {
        HEAD:        (cx, cy),
        L_SHOULDER:  (cx - int(18*s), cy + int(30*s)),
        R_SHOULDER:  (cx + int(18*s), cy + int(30*s)),
        L_ELBOW:     (cx - int(28*s), cy + int(55*s)),
        R_ELBOW:     (cx + int(28*s), cy + int(55*s)),
        L_HAND:      (cx - int(22*s), cy + int(78*s)),
        R_HAND:      (cx + int(22*s), cy + int(78*s)),
        L_HIP:       (cx - int(12*s), cy + int(75*s)),
        R_HIP:       (cx + int(12*s), cy + int(75*s)),
        L_KNEE:      (cx - int(14*s), cy + int(105*s)),
        R_KNEE:      (cx + int(14*s), cy + int(105*s)),
        L_FOOT:      (cx - int(16*s), cy + int(135*s)),
        R_FOOT:      (cx + int(16*s), cy + int(135*s)),
    }


STAND = _standing()

WALK_FRAMES = [
    # Frame 0: chan trai tien
    {
        HEAD:        (240, 78),
        L_SHOULDER:  (222, 108),
        R_SHOULDER:  (258, 108),
        L_ELBOW:     (210, 133),
        R_ELBOW:     (270, 133),
        L_HAND:      (216, 158),
        R_HAND:      (264, 158),
        L_HIP:       (228, 150),
        R_HIP:       (252, 150),
        L_KNEE:      (218, 182),
        R_KNEE:      (262, 178),
        L_FOOT:      (210, 212),
        R_FOOT:      (272, 208),
    },
    # Frame 1: chan phai tien
    {
        HEAD:        (240, 80),
        L_SHOULDER:  (222, 110),
        R_SHOULDER:  (258, 110),
        L_ELBOW:     (212, 135),
        R_ELBOW:     (268, 135),
        L_HAND:      (218, 158),
        R_HAND:      (262, 158),
        L_HIP:       (228, 152),
        R_HIP:       (252, 152),
        L_KNEE:      (222, 178),
        R_KNEE:      (262, 182),
        L_FOOT:      (212, 208),
        R_FOOT:      (272, 212),
    },
    # Frame 2: chan ngang (neutral)
    {
        HEAD:        (240, 76),
        L_SHOULDER:  (222, 106),
        R_SHOULDER:  (258, 106),
        L_ELBOW:     (214, 130),
        R_ELBOW:     (266, 130),
        L_HAND:      (220, 155),
        R_HAND:      (260, 155),
        L_HIP:       (228, 148),
        R_HIP:       (252, 148),
        L_KNEE:      (224, 180),
        R_KNEE:      (256, 180),
        L_FOOT:      (220, 212),
        R_FOOT:      (260, 212),
    },
]

FALL_TILT_30 = {
    HEAD:        (260, 95),
    L_SHOULDER:  (242, 120),
    R_SHOULDER:  (275, 118),
    L_ELBOW:     (225, 142),
    R_ELBOW:     (290, 140),
    L_HAND:      (215, 165),
    R_HAND:      (300, 158),
    L_HIP:       (248, 168),
    R_HIP:       (275, 165),
    L_KNEE:      (240, 195),
    R_KNEE:      (268, 200),
    L_FOOT:      (232, 220),
    R_FOOT:      (262, 225),
}

FALL_TILT_60 = {
    HEAD:        (290, 145),
    L_SHOULDER:  (275, 165),
    R_SHOULDER:  (305, 158),
    L_ELBOW:     (255, 178),
    R_ELBOW:     (320, 175),
    L_HAND:      (240, 195),
    R_HAND:      (335, 190),
    L_HIP:       (278, 200),
    R_HIP:       (302, 195),
    L_KNEE:      (268, 222),
    R_KNEE:      (295, 228),
    L_FOOT:      (258, 240),
    R_FOOT:      (288, 245),
}

FALL_GROUND = {
    HEAD:        (320, 210),
    L_SHOULDER:  (300, 218),
    R_SHOULDER:  (325, 215),
    L_ELBOW:     (275, 225),
    R_ELBOW:     (345, 222),
    L_HAND:      (260, 232),
    R_HAND:      (355, 230),
    L_HIP:       (275, 235),
    R_HIP:       (300, 233),
    L_KNEE:      (255, 242),
    R_KNEE:      (285, 245),
    L_FOOT:      (240, 248),
    R_FOOT:      (270, 250),
}

STANDUP_1 = {
    HEAD:        (290, 170),
    L_SHOULDER:  (272, 188),
    R_SHOULDER:  (305, 185),
    L_ELBOW:     (255, 200),
    R_ELBOW:     (320, 198),
    L_HAND:      (245, 215),
    R_HAND:      (330, 212),
    L_HIP:       (275, 215),
    R_HIP:       (300, 212),
    L_KNEE:      (260, 232),
    R_KNEE:      (290, 235),
    L_FOOT:      (250, 245),
    R_FOOT:      (280, 248),
}

STANDUP_2 = {
    HEAD:        (260, 110),
    L_SHOULDER:  (242, 138),
    R_SHOULDER:  (275, 135),
    L_ELBOW:     (228, 160),
    R_ELBOW:     (290, 158),
    L_HAND:      (235, 180),
    R_HAND:      (285, 178),
    L_HIP:       (248, 180),
    R_HIP:       (272, 178),
    L_KNEE:      (238, 205),
    R_KNEE:      (265, 208),
    L_FOOT:      (230, 225),
    R_FOOT:      (260, 228),
}

FALL_SEQUENCE = [FALL_TILT_30, FALL_TILT_60, FALL_GROUND]
FALL_FRAME_DURATIONS = [8, 6, 30]

STANDUP_SEQUENCE = [STANDUP_1, STANDUP_2, STAND]
STANDUP_FRAME_DURATIONS = [8, 8, 1]


def _lerp(a, b, t):
    return a + (b - a) * t


def lerp_pose(pose_a, pose_b, t):
    t = max(0.0, min(1.0, t))
    result = {}
    for joint in range(NUM_JOINTS):
        ax, ay = pose_a[joint]
        bx, by = pose_b[joint]
        result[joint] = (int(_lerp(ax, bx, t)), int(_lerp(ay, by, t)))
    return result


def get_pose(name="stand"):
    if name == "stand":
        return dict(STAND)
    elif name == "walk_0":
        return dict(WALK_FRAMES[0])
    elif name == "walk_1":
        return dict(WALK_FRAMES[1])
    elif name == "walk_2":
        return dict(WALK_FRAMES[2])
    elif name == "fall_30":
        return dict(FALL_TILT_30)
    elif name == "fall_60":
        return dict(FALL_TILT_60)
    elif name == "fall_ground":
        return dict(FALL_GROUND)
    return dict(STAND)


def offset_pose(pose, dx=0, dy=0):
    return {j: (x + dx, y + dy) for j, (x, y) in pose.items()}


class WalkAnimator:
    def __init__(self, start_x=120, floor_y=0, direction=1):
        self.x = start_x
        self.direction = direction
        self.phase = 0
        self.floor_y = floor_y
        self.step_speed = random.uniform(2.0, 3.5)

    def update(self):
        self.phase += self.step_speed
        if self.phase >= len(WALK_FRAMES) * 6:
            self.phase = 0
        self.x += self.direction * 2
        return self.get_pose()

    def get_pose(self):
        idx = int(self.phase / 6) % len(WALK_FRAMES)
        next_idx = (idx + 1) % len(WALK_FRAMES)
        sub_t = (self.phase % 6) / 6.0
        pose = lerp_pose(WALK_FRAMES[idx], WALK_FRAMES[next_idx], sub_t)
        return offset_pose(pose, dx=self.x - 240, dy=self.floor_y)

    def check_bounds(self, x_min=60, x_max=400):
        if self.x >= x_max:
            self.direction = -1
        elif self.x <= x_min:
            self.direction = 1


class FallAnimator:
    def __init__(self, base_x=240, floor_y=0):
        self.base_x = base_x
        self.floor_y = floor_y
        self.sequence_idx = 0
        self.frame_counter = 0
        self.done = False

    def update(self):
        if self.done:
            return None, True
        if self.sequence_idx >= len(FALL_SEQUENCE):
            self.done = True
            return None, True

        target = FALL_SEQUENCE[self.sequence_idx]
        duration = FALL_FRAME_DURATIONS[self.sequence_idx]
        t = self.frame_counter / max(duration, 1)

        if self.sequence_idx == 0:
            pose = lerp_pose(WALK_FRAMES[2], target, t)
        else:
            prev = FALL_SEQUENCE[self.sequence_idx - 1]
            pose = lerp_pose(prev, target, t)

        self.frame_counter += 1
        if self.frame_counter >= duration:
            self.frame_counter = 0
            self.sequence_idx += 1

        return offset_pose(pose, dx=self.base_x - 240, dy=self.floor_y), False

    @property
    def is_ground(self):
        return self.sequence_idx >= len(FALL_SEQUENCE)


class StandUpAnimator:
    def __init__(self, base_x=240, floor_y=0):
        self.base_x = base_x
        self.floor_y = floor_y
        self.sequence_idx = 0
        self.frame_counter = 0
        self.done = False

    def update(self):
        if self.done:
            return STAND, True

        target = STANDUP_SEQUENCE[self.sequence_idx]
        duration = STANDUP_FRAME_DURATIONS[self.sequence_idx]
        t = self.frame_counter / max(duration, 1)

        if self.sequence_idx == 0:
            pose = lerp_pose(FALL_GROUND, target, t)
        else:
            prev = STANDUP_SEQUENCE[self.sequence_idx - 1]
            pose = lerp_pose(prev, target, t)

        self.frame_counter += 1
        if self.frame_counter >= duration:
            self.frame_counter = 0
            self.sequence_idx += 1
            if self.sequence_idx >= len(STANDUP_SEQUENCE):
                self.done = True
                return dict(STAND), True

        return offset_pose(pose, dx=self.base_x - 240, dy=self.floor_y), False
