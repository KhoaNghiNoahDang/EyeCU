"""
Script tai dataset Kaggle va chuan bi cho benchmark.

Cach dung:
  1. Tai file kaggle.json tu Kaggle Account Settings > API > Create New Token
  2. Dat file kaggle.json vao: C:\\Users\\<ten_ban>\\.kaggle\\kaggle.json
  3. Chay: python setup_dataset.py
"""

import os, sys, subprocess, zipfile, shutil
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DATASET_SLUG = "topkek69/vietnamese-license-plates-detection"
DOWNLOAD_DIR = Path(__file__).parent / "dataset_raw"
FINAL_DIR    = Path(__file__).parent / "dataset"
KAGGLE_JSON  = Path.home() / ".kaggle" / "kaggle.json"


def check_kaggle_credentials():
    # Uu tien 1: environment variable (Bearer token moi)
    if os.getenv("KAGGLE_API_TOKEN"):
        print(f"[OK] Dang dung KAGGLE_API_TOKEN tu environment variable")
        return True

    # Uu tien 2: access_token file (Bearer token moi)
    access_token_path = Path.home() / ".kaggle" / "access_token"
    if access_token_path.exists():
        print(f"[OK] Tim thay access_token: {access_token_path}")
        token = access_token_path.read_text().strip()
        os.environ["KAGGLE_API_TOKEN"] = token
        return True

    # Uu tien 3: kaggle.json cu (username + key)
    if KAGGLE_JSON.exists():
        print(f"[OK] Tim thay kaggle.json: {KAGGLE_JSON}")
        return True

    print("[ERROR] Khong tim thay Kaggle credentials!")
    print()
    print("  Cach 1 - Token moi (Recommended):")
    print("  1. Dang nhap kaggle.com > Settings > API > Create New Token")
    print(f"  2. Luu token vao: {access_token_path}")
    print()
    print("  Cach 2 - kaggle.json cu:")
    print(f"  1. Download kaggle.json va dat vao: {KAGGLE_JSON}")
    return False


def install_kaggle():
    try:
        import kaggle
        print("[OK] Kaggle da duoc cai dat")
        return True
    except ImportError:
        print("[INFO] Dang cai dat kaggle...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", "kaggle", "-q"], capture_output=True)
        if result.returncode == 0:
            print("[OK] Cai dat kaggle thanh cong")
            return True
        else:
            print(f"[ERROR] Cai dat that bai: {result.stderr.decode()}")
            return False


def download_dataset():
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

    print(f"\n[INFO] Dang tai dataset: {DATASET_SLUG}")
    print(f"[INFO] Luu vao: {DOWNLOAD_DIR}")
    print("[INFO] Kich thuoc ~1.2GB, co the mat 5-15 phut...")

    result = subprocess.run([
        sys.executable, "-m", "kaggle", "datasets", "download",
        "-d", DATASET_SLUG,
        "-p", str(DOWNLOAD_DIR),
        "--unzip"
    ], capture_output=False)

    if result.returncode == 0:
        print("[OK] Tai va giai nen thanh cong!")
        return True
    else:
        print(f"[ERROR] Tai that bai, exit code: {result.returncode}")
        return False


def detect_and_prepare_structure():
    """Tim cau truc dataset sau khi giai nen va chuan bi cho benchmark."""
    print(f"\n[INFO] Quet cau truc thu muc {DOWNLOAD_DIR}...")

    # Tim thu muc images
    images_dirs = list(DOWNLOAD_DIR.rglob("images"))
    labels_dirs = list(DOWNLOAD_DIR.rglob("labels"))

    if images_dirs and labels_dirs:
        # Da co cau truc YOLO chuan
        src_images = images_dirs[0].parent
        FINAL_DIR.mkdir(parents=True, exist_ok=True)
        print(f"[OK] Tim thay cau truc YOLO tai: {src_images}")

        # Copy sang thu muc benchmark
        if not (FINAL_DIR / "images").exists():
            shutil.copytree(src_images / "images", FINAL_DIR / "images")
            shutil.copytree(src_images / "labels", FINAL_DIR / "labels")
            print(f"[OK] Da copy sang: {FINAL_DIR}")
        else:
            print(f"[OK] Thu muc da ton tai: {FINAL_DIR}")

        # Thong ke
        total_imgs = len(list((FINAL_DIR / "images").rglob("*.jpg")))
        total_imgs += len(list((FINAL_DIR / "images").rglob("*.png")))
        print(f"\n  === THONG KE DATASET ===")
        print(f"  Tong so anh: {total_imgs}")
        for split in ["train", "val", "test"]:
            split_dir = FINAL_DIR / "images" / split
            if split_dir.exists():
                n = len(list(split_dir.glob("*.jpg"))) + len(list(split_dir.glob("*.png")))
                print(f"  {split}: {n} anh")
        return True
    else:
        # Khong co cau truc chuan, tim anh truc tiep
        all_imgs = list(DOWNLOAD_DIR.rglob("*.jpg")) + list(DOWNLOAD_DIR.rglob("*.png"))
        print(f"[WARN] Khong tim thay cau truc images/labels chuan")
        print(f"[INFO] Tim thay {len(all_imgs)} anh thang trong thu muc")

        # Tao cau truc don gian
        FINAL_DIR.mkdir(parents=True, exist_ok=True)
        (FINAL_DIR / "images" / "test").mkdir(parents=True, exist_ok=True)
        (FINAL_DIR / "labels" / "test").mkdir(parents=True, exist_ok=True)

        for img in all_imgs[:2000]:
            dest = FINAL_DIR / "images" / "test" / img.name
            if not dest.exists():
                shutil.copy2(img, dest)

            # Tim label tuong ung
            label = img.parent / (img.stem + ".txt")
            if label.exists():
                shutil.copy2(label, FINAL_DIR / "labels" / "test" / label.name)

        print(f"[OK] Da copy {min(len(all_imgs), 2000)} anh vao {FINAL_DIR}/images/test/")
        return True


def print_next_steps():
    print("\n" + "=" * 60)
    print("  BUOC TIEP THEO - Chay Benchmark")
    print("=" * 60)
    print()
    print("  # Test 50 anh qua backend EyeCU (nhanh, khong can VNPT):")
    print(f"  python lpr_benchmark.py --dataset_dir ./dataset --max_images 50")
    print()
    print("  # Test 200 anh qua VNPT truc tiep:")
    print(f"  python lpr_benchmark.py --dataset_dir ./dataset --max_images 200 --mode direct")
    print()
    print("  # Chi test anh trong folder 'test':")
    print(f"  python lpr_benchmark.py --dataset_dir ./dataset --max_images 100 --splits test")
    print()
    print("  Ket qua se luu vao thu muc: ./results/")
    print("=" * 60)


if __name__ == "__main__":
    print("=" * 60)
    print("  EyeCU - Chuan bi Dataset Benchmark LPR")
    print("=" * 60)

    # Kiem tra credentials
    if not check_kaggle_credentials():
        sys.exit(1)

    # Cai dat kaggle cli
    if not install_kaggle():
        sys.exit(1)

    # Tai dataset
    if not download_dataset():
        print("\n[ALTERNATIVE] Neu muon test ngay khong can download Kaggle:")
        print("  1. Dat anh bien so xe vao: d:\\HACKAITHON\\EyeCU\\benchmark\\dataset\\images\\test\\")
        print("  2. Chay: python lpr_benchmark.py --dataset_dir ./dataset --max_images 50")
        sys.exit(1)

    # Chuan bi cau truc
    detect_and_prepare_structure()

    print_next_steps()
