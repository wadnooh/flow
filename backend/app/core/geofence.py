import math

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    يحسب المسافة الجغرافية بالأمتار بين نقطتين على سطح الأرض باستخدام معادلة Haversine.
    lat1, lon1: إحداثيات النقطة الأولى (مثل موقع الموظف)
    lat2, lon2: إحداثيات النقطة الثانية (مثل مركز موقع العمل)
    العائد: المسافة بالأمتار (float)
    """
    R = 6371000.0  # نصف قطر الأرض بالأمتار
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2

    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance_meters = R * c
    return round(distance_meters, 1)

def check_geofence(user_lat: float, user_lon: float, site_lat: float, site_lon: float, radius_meters: float) -> dict:
    """
    يتحقق مما إذا كان الموظف داخل النطاق الجغرافي للموقع أم خارجه.
    """
    distance = calculate_haversine_distance(user_lat, user_lon, site_lat, site_lon)
    is_inside = distance <= radius_meters

    return {
        "is_inside": is_inside,
        "distance_meters": distance,
        "allowed_radius": radius_meters,
        "distance_difference": round(distance - radius_meters, 1) if not is_inside else 0.0,
        "status_message": (
            "أنت داخل نطاق موقع العمل المسموح به."
            if is_inside else
            f"أنت خارج نطاق موقع العمل ولا يمكنك تسجيل الحضور. تبعد بمقدار {distance:.0f} متر عن الموقع (المسموح {radius_meters:.0f} متر)."
        )
    }
