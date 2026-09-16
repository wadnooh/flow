#!/bin/bash
# ====================================================================
# سكريبت النشر والربط التلقائي بالدومين: rtcco.org
# ====================================================================

set -e

echo "🚀 بدء إعداد ونشر نظام متابعة الكهربائية على: rtcco.org"

# 1. تحديث الحزم وتثبيت المتطلبات الأساسية
sudo apt update && sudo apt install -y python3-pip python3-venv nginx certbot python3-certbot-nginx nodejs npm

# 2. إعداد بيئة الباك إند
echo "📦 تجهيز خادم FastAPI..."
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python3 migrate_teams.py

# 3. إعداد خدمة Systemd لتشغيل الباك إند تلقائياً في الخلفية
echo "⚙️ إنشاء خدمة النظام electrical-api.service..."
sudo tee /etc/systemd/system/electrical-api.service > /dev/null <<EOF
[Unit]
Description=Electrical Field Tracker FastAPI Backend
After=network.target

[Service]
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable electrical-api
sudo systemctl restart electrical-api

# 4. بناء لوحة التحكم ومحاكي الجوال
echo "🎨 بناء واجهة المستخدم..."
cd ../frontend
npm install
npm run build

# 5. تفعيل إعدادات Nginx
echo "🌐 تطبيق إعدادات Nginx لدومين rtcco.org..."
sudo cp ../nginx_rtcco.org.conf /etc/nginx/sites-available/rtcco.org
sudo ln -sf /etc/nginx/sites-available/rtcco.org /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 6. إصدار شهادة SSL المجانية تلقائياً عبر Let's Encrypt
echo "🔒 إصدار شهادة الأمان SSL..."
sudo certbot --nginx -d rtcco.org -d www.rtcco.org --non-interactive --agree-tos -m admin@rtcco.org --redirect || true

echo "✅ تم النشر والربط بنجاح على: https://rtcco.org"
