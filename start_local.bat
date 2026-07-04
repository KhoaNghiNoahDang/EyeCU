@echo off
echo ========================================================
echo DANG KHOI DONG BACKEND VA FRONTEND EYE-CU
echo ========================================================

:: Cap nhat duong dan de he thong nhan dien Node.js vua cai dat
set PATH=%PATH%;C:\Program Files\nodejs

echo [1/2] Dang cai dat thu vien cho Backend...
cd backend
python -m pip install -r requirements.txt
start "EyeCU Backend" cmd /c "title EyeCU Backend (DUNG TAT BANG NAY) && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
cd ..

echo.
echo [2/2] Dang cai dat thu vien cho Frontend...
cd frontend
call npm install
start "EyeCU Frontend" cmd /c "title EyeCU Frontend (DUNG TAT BANG NAY) && npm run dev -- --host"
cd ..

echo.
echo ========================================================
echo KHOI DONG THANH CONG!
echo.
echo Vui long mo trinh duyet tren may tinh va truy cap: 
echo http://localhost:5173
echo.
echo Neu ban muon test bang dien thoai iPhone, vui long bat
echo cung mang Wifi roi go dia chi IP mang (vi du http://192.168.100.53:5173)
echo ========================================================
pause
