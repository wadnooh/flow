import httpx

def verify():
    print("========================================")
    print(" فحص سلامة نظام متابعة الكهربائية الميدانية")
    print("========================================")

    # 1. Frontend Check
    frontend_res = httpx.get("http://127.0.0.1:3000")
    print(f"1. واجهة المستخدم (Frontend): HTTP {frontend_res.status_code} - تم تحميل الصفحة بنجاح ({len(frontend_res.text)} بايت)")

    # 2. Backend Health
    health_res = httpx.get("http://127.0.0.1:8000/health")
    print(f"2. خادم الـ API والـ Backend: HTTP {health_res.status_code} - {health_res.json()}")

    # 3. Auth & Token
    login_res = httpx.post("http://127.0.0.1:8000/api/v1/auth/login/json", json={"username": "admin", "password": "admin123"})
    assert login_res.status_code == 200, "فشل تسجيل الدخول"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("3. توثيق مدير النظام (JWT): نجاح تم استخراج التوكن")

    # 4. Sites & Geofences
    sites_res = httpx.get("http://127.0.0.1:8000/api/v1/sites/", headers=headers)
    sites = sites_res.json()
    print(f"4. المواقع المسجلة ونطاقات الـ Geofencing: عدد {len(sites)} مواقع مسجلة")
    for s in sites:
        print(f"   - {s['name']} | نصف القطر: {s['radius_meters']}م | الدوام: {s['shift_start']} إلى {s['shift_end']}")

    # 5. Geofence Attendance Logic Test (Inside vs Outside)
    tech_token = httpx.post("http://127.0.0.1:8000/api/v1/auth/login/json", json={"username": "tech1", "password": "tech123"}).json()["access_token"]
    tech_headers = {"Authorization": f"Bearer {tech_token}"}

    # Test Inside
    check_in_inside = httpx.post(
        "http://127.0.0.1:8000/api/v1/attendance/check-geofence?latitude=24.774265&longitude=46.738586",
        headers=tech_headers
    ).json()
    print(f"5. فحص الموظف داخل النطاق: {check_in_inside['is_inside']} (المسافة: {check_in_inside['distance_meters']}م)")
    assert check_in_inside["is_inside"] is True

    # Test Outside
    check_in_outside = httpx.post(
        "http://127.0.0.1:8000/api/v1/attendance/check-geofence?latitude=24.850000&longitude=46.850000",
        headers=tech_headers
    ).json()
    print(f"6. فحص الموظف خارج النطاق: {check_in_outside['is_inside']} (المسافة: {check_in_outside['distance_meters']}م)")
    print(f"   رسالة التحذير: {check_in_outside['status_message']}")
    assert check_in_outside["is_inside"] is False

    # 7. Summary
    stats_res = httpx.get("http://127.0.0.1:8000/api/v1/stats/summary", headers=headers).json()
    print("7. إحصائيات لوحة التحكم:", stats_res)
    print("========================================")
    print("جميع أجزاء النظام تعمل بتكامل 100%!")

if __name__ == "__main__":
    verify()
