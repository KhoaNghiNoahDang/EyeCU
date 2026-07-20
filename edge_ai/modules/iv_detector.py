import cv2
import numpy as np

class IVDetector:
    def __init__(self):
        self.last_percentage = 100.0
        self.history = []
        self.alert_triggered = False

    def detect_water_level(self, roi_frame: np.ndarray) -> float:
        """
        Phan tich ROI de tim duong muc nuoc va tinh phan tram %.
        roi_frame: Anh mau BGR da cat tu khung hinh (cv2.selectROI)
        """
        if roi_frame is None or roi_frame.size == 0:
            return self.last_percentage

        h, w = roi_frame.shape[:2]
        if h == 0 or w == 0:
            return self.last_percentage

        # 1. Chuyen anh xam
        gray = cv2.cvtColor(roi_frame, cv2.COLOR_BGR2GRAY)
        
        # 2. Khu nhieu Gaussian Blur
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # 3. MANG LOC HINH HOC: Dao ham theo truc X va Y
        sobel_x = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=3)
        sobel_y = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=3)
        
        abs_sobel_x = cv2.convertScaleAbs(sobel_x)
        abs_sobel_y = cv2.convertScaleAbs(sobel_y)
        
        # Chi giu lai nhung net co bien do ngang ro ret hon bien do doc (loai bo cac dom sang tron)
        horizontal_edges = np.where(abs_sobel_y > abs_sobel_x, abs_sobel_y, 0).astype(np.uint8)
        
        # 4. MANG LOC CHOI SANG (De-glare):
        # Nhan dien cac diem anh qua sang (>220) va lam giam suc manh cua no di 1 nua
        _, bright_mask = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
        horizontal_edges[bright_mask == 255] = horizontal_edges[bright_mask == 255] // 2
        
        # 5. Tinh tong cuong do canh theo tung hang ngang
        row_sums = np.sum(horizontal_edges, axis=1, dtype=np.int32)
        
        # 6. Giam margin loai tru nap chai xuong con 5% de phat hien nuoc o day
        margin = int(h * 0.05)
        water_level_y = None
        
        if h > margin * 2:
            # Chi xet vung o giua
            valid_row_sums = row_sums[margin:h-margin]
            if len(valid_row_sums) > 0:
                # Y co tong cuong do canh ngang lon nhat chinh la muc nuoc
                best_y_local = np.argmax(valid_row_sums)
                water_level_y = best_y_local + margin
        
        if water_level_y is not None:
            # Tinh phan tram: Y=0 la 100%, Y=h la 0%
            raw_percentage = max(0, min(100, ((h - water_level_y) / h) * 100.0))
            
            # Luu vao mang lich su de lay trung vi (loc nhieu)
            self.history.append(raw_percentage)
            if len(self.history) > 30:
                self.history.pop(0)
                
            stable_percent = float(np.median(self.history))
            self.last_percentage = stable_percent
            
            # Tu dong reset trang thai canh bao neu muc nuoc tang cao (>40%)
            if stable_percent > 40.0:
                self.alert_triggered = False
            
        return self.last_percentage
