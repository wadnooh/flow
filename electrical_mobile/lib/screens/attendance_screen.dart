import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:field_staff_tracker/services/api_service.dart';
import 'package:field_staff_tracker/services/location_service.dart';
import 'package:field_staff_tracker/screens/login_screen.dart';
import 'package:field_staff_tracker/screens/work_orders_screen.dart';
import 'package:field_staff_tracker/screens/electrical_screen.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  Map<String, dynamic>? _siteInfo;
  Map<String, dynamic>? _attendanceInfo;
  Position? _currentPosition;

  bool _isLoading = true;
  bool _isActionLoading = false;
  bool _isInside = false;
  double _distanceMeters = 0.0;
  String _geofenceMessage = "جاري تحديد موقعك الجغرافي...";
  Timer? _trackingTimer;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  @override
  void dispose() {
    _trackingTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final status = await ApiService.getTodayStatus();
      _siteInfo = status['site'];
      _attendanceInfo = status['attendance'];

      await _refreshLocationAndGeofence();

      // إذا كان الموظف مسجلاً الحضور ولم ينصرف، نبدأ مؤقت التتبع الدوري
      if (_attendanceInfo != null && _attendanceInfo!['check_out_time'] == null) {
        _startLocationTracking();
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('خطأ في جلب البيانات: $e')),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _refreshLocationAndGeofence() async {
    try {
      final pos = await LocationService.determinePosition();
      setState(() {
        _currentPosition = pos;
      });

      if (_siteInfo != null) {
        final geofenceRes = await ApiService.checkGeofence(pos.latitude, pos.longitude);
        setState(() {
          _isInside = geofenceRes['is_inside'] ?? false;
          _distanceMeters = (geofenceRes['distance_meters'] as num?)?.toDouble() ?? 0.0;
          _geofenceMessage = geofenceRes['status_message'] ?? '';
        });
      }
    } catch (e) {
      setState(() {
        _geofenceMessage = e.toString().replaceAll('Exception: ', '');
      });
    }
  }

  void _startLocationTracking() {
    _trackingTimer?.cancel();
    _trackingTimer = Timer.periodic(const Duration(minutes: 2), (timer) async {
      if (_currentPosition != null) {
        try {
          final pos = await LocationService.determinePosition();
          _currentPosition = pos;
          final res = await ApiService.pingLocation(pos.latitude, pos.longitude);
          if (res['status'] == 'outside') {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                backgroundColor: Colors.amber,
                content: Text('تنبيه: أنت حالياً خارج نطاق موقع العمل أثناء فترة الدوام.'),
              ),
            );
          }
        } catch (_) {}
      }
    });
  }

  Future<void> _handleCheckIn() async {
    if (_currentPosition == null) return;
    setState(() => _isActionLoading = true);

    try {
      final res = await ApiService.checkIn(_currentPosition!.latitude, _currentPosition!.longitude);
      setState(() {
        _attendanceInfo = res['attendance'];
      });
      _startLocationTracking();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.green, content: Text(res['message'] ?? 'تم تسجيل الحضور بنجاح')),
      );
    } catch (e) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: const Color(0xFF1E293B),
          title: const Text('تنبيه النطاق الجغرافي', style: TextStyle(color: Colors.white)),
          content: Text(e.toString().replaceAll('Exception: ', ''), style: const TextStyle(color: Color(0xFF94A3B8))),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('حسناً', style: TextStyle(color: Color(0xFF38BDF8))),
            ),
          ],
        ),
      );
    } finally {
      setState(() => _isActionLoading = false);
    }
  }

  Future<void> _handleCheckOut() async {
    if (_currentPosition == null) return;
    setState(() => _isActionLoading = true);

    try {
      final res = await ApiService.checkOut(_currentPosition!.latitude, _currentPosition!.longitude);
      setState(() {
        _attendanceInfo = res['attendance'];
      });
      _trackingTimer?.cancel();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.blue, content: Text(res['message'] ?? 'تم تسجيل الانصراف بنجاح')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(backgroundColor: Colors.red, content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    } finally {
      setState(() => _isActionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasCheckedIn = _attendanceInfo != null && _attendanceInfo!['check_in_time'] != null;
    final hasCheckedOut = _attendanceInfo != null && _attendanceInfo!['check_out_time'] != null;

    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1E293B),
        elevation: 0,
        title: const Text("حضور وانصراف الموقع الميداني", style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            tooltip: "أوامر العمل والتكليفات",
            icon: const Icon(Icons.assignment, color: Color(0xFF38BDF8)),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const WorkOrdersScreen()));
            },
          ),
          IconButton(
            tooltip: "تسجيل قراءات الكهرباء",
            icon: const Icon(Icons.electric_bolt, color: Colors.amberAccent),
            onPressed: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const ElectricalScreen()));
            },
          ),
          IconButton(
            tooltip: "تحديث الموقع",
            icon: const Icon(Icons.refresh),
            onPressed: _refreshLocationAndGeofence,
          ),
          IconButton(
            tooltip: "تسجيل خروج",
            icon: const Icon(Icons.logout),
            onPressed: () {
              Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8)))
          : RefreshIndicator(
              onRefresh: _loadInitialData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // بطاقة الموقع المرتبط
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF1E293B),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF334155)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.location_city, color: Color(0xFF38BDF8)),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  _siteInfo?['name'] ?? 'لم يتم تعيين موقع',
                                  style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const Divider(color: Color(0xFF334155), height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                "نصف القطر: ${_siteInfo?['radius_meters'] ?? 0} متر",
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                              ),
                              Text(
                                "الدوام: ${_siteInfo?['shift_start'] ?? '--:--'} إلى ${_siteInfo?['shift_end'] ?? '--:--'}",
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // حالة السياج الجغرافي
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: _isInside
                            ? Colors.green.withOpacity(0.12)
                            : Colors.red.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _isInside ? Colors.green : Colors.red,
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _isInside ? Icons.verified : Icons.warning_amber_rounded,
                            color: _isInside ? Colors.greenAccent : Colors.redAccent,
                            size: 48,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            _isInside ? "داخل نطاق موقع العمل" : "خارج نطاق موقع العمل",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: _isInside ? Colors.greenAccent : Colors.redAccent,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            _geofenceMessage,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            "المسافة الحالية للموقع: ${_distanceMeters.toStringAsFixed(1)} متر",
                            style: const TextStyle(
                              color: Color(0xFF38BDF8),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 28),

                    // زر تسجيل الحضور أو الانصراف
                    if (!hasCheckedIn)
                      SizedBox(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton.icon(
                          onPressed: (_isInside && !_isActionLoading) ? _handleCheckIn : null,
                          icon: const Icon(Icons.login),
                          label: _isActionLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text(
                                  "تسجيل بداية الدوام (حضور)",
                                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.green[600],
                            disabledBackgroundColor: const Color(0xFF334155),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      )
                    else if (!hasCheckedOut)
                      Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.blue.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.timer, color: Colors.blueAccent),
                                SizedBox(width: 8),
                                Text(
                                  "أنت في فترة الدوام الرسمي حالياً",
                                  style: TextStyle(color: Colors.blueAccent, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 16),
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton.icon(
                              onPressed: !_isActionLoading ? _handleCheckOut : null,
                              icon: const Icon(Icons.logout),
                              label: _isActionLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : const Text(
                                      "تسجيل نهاية الدوام (انصراف)",
                                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                                    ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFDC2626),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              ),
                            ),
                          ),
                        ],
                      )
                    else
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E293B),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.check_circle, color: Colors.green),
                            SizedBox(width: 8),
                            Text(
                              "تم اكتمال حضور وانصراف هذا اليوم",
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }
}
