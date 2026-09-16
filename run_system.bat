@echo off
chcp 65001 > nul
echo ===================================================
echo   نظام متابعة الكهربائية والفرق الميدانية (GPS)
echo ===================================================
echo.
echo 1. تشغيل خادم FastAPI في الخلفية على المنفذ 8000...
start "Electrical Backend API" cmd /k "cd /d %~dp0backend && .\.venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak > nul

echo 2. تشغيل لوحة التحكم ومحاكي الجوال على المنفذ 3000...
start "Electrical Web Dashboard" cmd /k "cd /d %~dp0frontend && npm run dev -- --port 3000 --host"

timeout /t 2 /nobreak > nul

echo.
echo ===================================================
echo   تم تشغيل النظام بنجاح!
echo ===================================================
echo - لوحة تحكم المشرف ومحاكي الجوال: http://localhost:3000
echo - واجهة توثيق الـ API (Swagger):  http://localhost:8000/docs
echo ===================================================
echo.
start http://localhost:3000
pause
