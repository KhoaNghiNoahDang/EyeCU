import asyncio


async def process_ur_fall_dataset(websocket_manager):
    """
    Giả lập Background Worker đọc video từ UR Fall Dataset và âm thanh ESC-50.
    Gửi tín hiệu AI Sensor Fusion về Frontend.
    """
    # Trong môi trường giả lập (nếu chưa cài cv2), ta gửi dữ liệu mô phỏng
    while True:
        # Mô phỏng AI phát hiện người ngã sau mỗi 30 giây (cho demo)
        await asyncio.sleep(30)

        alert_data = {
            "type": "CAMERA_EVENT",
            "severity": "critical",
            "room": "CC01",
            "title": "CẢNH BÁO KÉP — HỢP NHẤT CẢM BIẾN",
            "description": "Phát hiện ngã & Tiếng va đập lớn (Camera & Micro P.103)",
            "audio_match": "ESC-50-Scream.wav",
        }
        await websocket_manager.broadcast(alert_data)
