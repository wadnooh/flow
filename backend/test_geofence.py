import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from app.core.geofence import calculate_haversine_distance, check_geofence

def test_haversine():
    # موقع محطة تحويل شمال الرياض
    site_lat = 24.774265
    site_lon = 46.738586
    radius = 200.0  # متر

    print("--- 1. اختبار موظف داخل النطاق الجغرافي (على بعد 30 متر) ---")
    # إحداثيات قريبة جداً
    user_lat_inside = 24.774400
    user_lon_inside = 46.738700
    res_inside = check_geofence(user_lat_inside, user_lon_inside, site_lat, site_lon, radius)
    print("النتيجة:", res_inside)
    assert res_inside["is_inside"] is True, "يجب أن يكون داخل النطاق"
    print(">> نجح الفحص: الموظف داخل النطاق ويسمح له بتسجيل الحضور.\n")

    print("--- 2. اختبار موظف خارج النطاق الجغرافي (على بعد ~550 متر) ---")
    user_lat_outside = 24.778000
    user_lon_outside = 46.741000
    res_outside = check_geofence(user_lat_outside, user_lon_outside, site_lat, site_lon, radius)
    print("النتيجة:", res_outside)
    assert res_outside["is_inside"] is False, "يجب أن يكون خارج النطاق"
    assert "أنت خارج نطاق موقع العمل ولا يمكنك تسجيل الحضور" in res_outside["status_message"]
    print(">> نجح الفحص: تم رفض تسجيل الحضور وإظهار التنبيه الدقيق للموظف مع المسافة.\n")

    print("--- 3. اختبار حساب المسافة الصفرية في المركز ---")
    dist_zero = calculate_haversine_distance(site_lat, site_lon, site_lat, site_lon)
    assert dist_zero == 0.0
    print(">> نجح الفحص: المسافة 0 في نفس النقطة.\n")

    print("كل اختبارات محرك السياج الجغرافي (Geofencing) اجتازت بنجاح 100%!")

if __name__ == "__main__":
    test_haversine()
