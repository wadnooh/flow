import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  // الدومين المعتمد للنظام (2-aa.com)
  static const String baseUrl = "https://2-aa.com/api/v1";

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);
  }

  static Future<Map<String, dynamic>> login(String username, String password) async {
    final url = Uri.parse('$baseUrl/auth/login/json');
    final response = await http.post(
      url,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(utf8.decode(response.bodyBytes));
      await saveToken(data['access_token']);
      return data;
    } else {
      final error = jsonDecode(utf8.decode(response.bodyBytes));
      throw Exception(error['detail'] ?? 'فشل تسجيل الدخول');
    }
  }

  static Future<Map<String, dynamic>> checkGeofence(double lat, double lon, {int? siteId}) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/attendance/check-geofence?latitude=$lat&longitude=$lon${siteId != null ? '&site_id=$siteId' : ''}');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      final error = jsonDecode(utf8.decode(response.bodyBytes));
      throw Exception(error['detail'] ?? 'خطأ في فحص النطاق الجغرافي');
    }
  }

  static Future<Map<String, dynamic>> checkIn(double lat, double lon, {int? siteId}) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/attendance/check-in');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'latitude': lat, 'longitude': lon, 'site_id': siteId}),
    );

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['detail'] ?? 'تعذر تسجيل الحضور');
    }
  }

  static Future<Map<String, dynamic>> checkOut(double lat, double lon) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/attendance/check-out');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'latitude': lat, 'longitude': lon}),
    );

    final data = jsonDecode(utf8.decode(response.bodyBytes));
    if (response.statusCode == 200) {
      return data;
    } else {
      throw Exception(data['detail'] ?? 'تعذر تسجيل الانصراف');
    }
  }

  static Future<Map<String, dynamic>> pingLocation(double lat, double lon) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/attendance/ping-location');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'latitude': lat, 'longitude': lon}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    return {'status': 'error'};
  }

  static Future<Map<String, dynamic>> getTodayStatus() async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/attendance/today');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    return {};
  }

  static Future<List<dynamic>> getWorkOrders() async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/work-orders');
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    }
    return [];
  }

  static Future<Map<String, dynamic>> updateWorkOrderStatus(int id, String status) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/work-orders/$id');
    final response = await http.patch(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'status': status}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('فشل تحديث حالة أمر العمل');
    }
  }

  static Future<Map<String, dynamic>> submitReading(Map<String, dynamic> data) async {
    final token = await getToken();
    final url = Uri.parse('$baseUrl/electrical/readings');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      },
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(utf8.decode(response.bodyBytes));
    } else {
      throw Exception('فشل تسجيل القراءة الكهربائية');
    }
  }
}

