import argparse
import random
import queue
import threading
import time
import sys
import os
import signal

sys.path.insert(0, os.path.dirname(__file__))

from config import WS_BACKEND_URL
from demo_engine.renderer import create_demo_frame
from demo_engine.skeleton import (
    WalkAnimator, FallAnimator, StandUpAnimator, get_pose
)
from demo_engine.ws_demo import ws_demo_worker


def demo_room_thread(room_id, prefix, ws_url, fall_interval_range):
    """Thread chay 1 phong demo."""
    frame_queue = queue.Queue(maxsize=3)

    # Khoi tao WS worker
    ws_thread = threading.Thread(
        target=ws_demo_worker,
        args=(room_id, prefix, ws_url, frame_queue),
        daemon=True,
    )
    ws_thread.start()

    # Animation state
    walk = WalkAnimator(
        start_x=random.randint(100, 200),
        direction=random.choice([-1, 1]),
    )
    fall_anim = None
    standup_anim = None

    state = "walking"
    fall_timer = random.uniform(*fall_interval_range)
    ground_counter = 0
    fps = 10

    while True:
        try:
            if state == "walking":
                walk.check_bounds()
                pose = walk.update()
                is_falling = False
                fall_timer -= 1.0 / fps
                if fall_timer <= 0:
                    state = "falling"
                    fall_anim = FallAnimator(base_x=walk.x, floor_y=0)
                    print(f"[DEMO-{room_id}] Fall triggered")

            elif state == "falling":
                pose, done = fall_anim.update()
                is_falling = True
                if done:
                    state = "ground"
                    ground_counter = 30
                    print(f"[DEMO-{room_id}] Ground")

            elif state == "ground":
                pose = get_pose("fall_ground")
                is_falling = False
                ground_counter -= 1
                if ground_counter <= 0:
                    state = "standing_up"
                    standup_anim = StandUpAnimator(
                        base_x=fall_anim.base_x, floor_y=0
                    )
                    print(f"[DEMO-{room_id}] Standing up")

            elif state == "standing_up":
                pose, done = standup_anim.update()
                is_falling = False
                if done:
                    state = "walking"
                    walk = WalkAnimator(
                        start_x=standup_anim.base_x,
                        direction=random.choice([-1, 1]),
                    )
                    fall_timer = random.uniform(*fall_interval_range)
                    print(f"[DEMO-{room_id}] Walking again, next fall in {fall_timer:.1f}s")

            else:
                pose = get_pose("stand")
                is_falling = False

            frame = create_demo_frame(room_id, pose, is_falling)

            try:
                frame_queue.put_nowait((frame, is_falling))
            except queue.Full:
                pass

            time.sleep(1.0 / fps)

        except Exception as e:
            print(f"[DEMO-{room_id}] Error: {e}")
            time.sleep(0.5)


def main():
    parser = argparse.ArgumentParser(description="EyeCU Demo Mode - Animated Scene")
    parser.add_argument("--rooms", type=int, default=1, help="So phong demo (mac dinh: 1)")
    parser.add_argument("--prefix", default="P.20", help="Tien to room (mac dinh: P.20)")
    parser.add_argument("--url", default=None, help="WebSocket URL (mac dinh: tu config)")
    parser.add_argument(
        "--fall-range", default="15,30",
        help="Khoang thoi gian giua cac lan nga, giay (mac dinh: 15,30)",
    )
    parser.add_argument("--no-ws", action="store_true", help="Chi render, khong gui WebSocket")
    args = parser.parse_args()

    ws_url = args.url or WS_BACKEND_URL
    fall_min, fall_max = map(float, args.fall_range.split(","))
    fall_interval_range = (fall_min, fall_max)

    print(f"[DEMO] Starting {args.rooms} rooms with prefix '{args.prefix}'")
    print(f"[DEMO] WebSocket: {ws_url}")
    print(f"[DEMO] Fall interval: {fall_min}-{fall_max}s")

    threads = []
    for i in range(1, args.rooms + 1):
        room_id = f"{args.prefix}{i}"
        t = threading.Thread(
            target=demo_room_thread,
            args=(room_id, args.prefix, ws_url, fall_interval_range),
            daemon=True,
        )
        t.start()
        threads.append(t)
        print(f"[DEMO] Room {room_id} started")
        time.sleep(0.2)

    print(f"\n[DEMO] {args.rooms} rooms running. Press Ctrl+C to stop.\n")

    def shutdown(sig, frame):
        print("\n[DEMO] Stopping...")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    while True:
        time.sleep(1)


if __name__ == "__main__":
    main()
