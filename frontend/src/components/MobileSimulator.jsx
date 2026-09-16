import React, { useState, useEffect } from 'react';
import {
  MapPin, CheckCircle, XCircle, AlertTriangle, Play,
  Square, Zap, Camera, RefreshCw, Smartphone, Navigation,
  Clock, ShieldAlert, ArrowLeft, Fuel, Info
} from 'lucide-react';
import { api } from '../services/api';

export default function MobileSimulator({ sites = [] }) {
  const [selectedSiteId, setSelectedSiteId] = useState(sites[0]?.id || 1);
  const [currentTech, setCurrentTech] = useState({
    username: 'tech1',
    name: 'فني كهرباء / أحمد الشمري'
  });

  // GPS & Geofence State
  const [useRealGPS, setUseRealGPS] = useState(false);
  const [simulatedDistanceOption, setSimulatedDistanceOption] = useState('inside_close'); // inside_close, inside_edge, outside_near, outside_far
  const [userLocation, setUserLocation] = useState({ lat: 24.774265, lon: 46.738586 });
  const [geofenceResult, setGeofenceResult] = useState({
    is_inside: true,
    distance_meters: 15,
    allowed_radius: 200,
    status_message: 'أنت داخل نطاق موقع العمل المسموح به.'
  });

  // Attendance Status
  const [attendance, setAttendance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDeparture, setActiveDeparture] = useState(null);

  // Tab in phone: 'attendance' or 'electrical'
  const [phoneTab, setPhoneTab] = useState('attendance');

  // Form for electrical reading
  const [readingForm, setReadingForm] = useState({
    voltage_l1: 220,
    voltage_l2: 221,
    voltage_l3: 219,
    current_l1: 45,
    generator_status: 'يعمل',
    fuel_level_percent: 85,
    notes: 'فحص دوري أثناء الدوام'
  });

  const [faultForm, setFaultForm] = useState({
    title: '',
    description: '',
    severity: 'medium'
  });

  const activeSite = sites.find(s => s.id === Number(selectedSiteId)) || sites[0];

  // Update coordinates whenever simulation option or site changes
  useEffect(() => {
    if (!activeSite) return;

    if (useRealGPS) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            setUserLocation(loc);
            evaluateGeofence(loc.lat, loc.lon, activeSite);
          },
          (err) => {
            alert("تعذر الوصول للـ GPS، تم التحويل للوضع المحاكي.");
            setUseRealGPS(false);
          }
        );
      }
    } else {
      let lat = activeSite.latitude;
      let lon = activeSite.longitude;

      if (simulatedDistanceOption === 'inside_close') {
        // ~15 meters inside
        lat += 0.0001;
        lon += 0.0001;
      } else if (simulatedDistanceOption === 'inside_edge') {
        // ~130 meters inside (radius is 150-200)
        lat += 0.001;
        lon += 0.0005;
      } else if (simulatedDistanceOption === 'outside_near') {
        // ~450 meters outside!
        lat += 0.0035;
        lon += 0.0025;
      } else if (simulatedDistanceOption === 'outside_far') {
        // ~2.5 kilometers outside
        lat += 0.02;
        lon += 0.015;
      }

      const loc = { lat, lon };
      setUserLocation(loc);
      evaluateGeofence(loc.lat, loc.lon, activeSite);
    }
  }, [selectedSiteId, simulatedDistanceOption, useRealGPS, activeSite]);

  const evaluateGeofence = async (lat, lon, site) => {
    try {
      const res = await api.checkGeofence(lat, lon, site.id);
      setGeofenceResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckIn = async () => {
    setIsLoading(true);
    try {
      // First ensure auth as current tech
      await api.login(currentTech.username, 'tech123').catch(() => {});
      const res = await api.checkIn(userLocation.lat, userLocation.lon, activeSite.id);
      setAttendance(res.attendance);
      alert(res.message);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setIsLoading(true);
    try {
      const res = await api.checkOut(userLocation.lat, userLocation.lon);
      setAttendance(res.attendance);
      setActiveDeparture(null);
      alert(res.message);
    } catch (e) {
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate leaving site during shift
  const handleSimulateDeparture = async () => {
    setSimulatedDistanceOption('outside_near');
    // Ping with outside location
    const outsideLat = activeSite.latitude + 0.004;
    const outsideLon = activeSite.longitude + 0.003;
    const res = await api.pingLocation(outsideLat, outsideLon);
    setActiveDeparture({
      departure_time: new Date().toLocaleTimeString('ar-SA'),
      is_ongoing: true
    });
    alert("⚠️ تنبيه: تم رصد خروجك من نطاق موقع العمل أثناء الدوام وتم إشعار لوحة المشرف!");
  };

  // Simulate return to site
  const handleSimulateReturn = async () => {
    setSimulatedDistanceOption('inside_close');
    const insideLat = activeSite.latitude + 0.0001;
    const insideLon = activeSite.longitude + 0.0001;
    await api.pingLocation(insideLat, insideLon);
    setActiveDeparture(null);
    alert("✅ مرحباً بعودتك: تم رصد عودتك داخل نطاق موقع العمل وتسجيل مدة البقاء خارج الموقع في التقرير.");
  };

  const handleSendReading = async (e) => {
    e.preventDefault();
    try {
      await api.addElectricalReading({
        site_id: activeSite.id,
        ...readingForm
      });
      alert("✅ تم تسجيل قراءات الكهرباء وحالة المولد بنجاح!");
      setPhoneTab('attendance');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReportFault = async (e) => {
    e.preventDefault();
    try {
      await api.reportFault({
        site_id: activeSite.id,
        title: faultForm.title,
        description: faultForm.description,
        severity: faultForm.severity,
        latitude: userLocation.lat,
        longitude: userLocation.lon
      });
      alert("⚠️ تم إرسال بلاغ العطل الكهربائي للمشرف بنجاح مع الإحداثيات!");
      setFaultForm({ title: '', description: '', severity: 'medium' });
      setPhoneTab('attendance');
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="grid gap-6" style={{ gridTemplateColumns: '1.2fr 1fr', alignItems: 'start' }}>
      {/* Simulation Control Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '16px' }}>
          <Smartphone style={{ color: '#38bdf8' }} size={24} />
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>محاكي تطبيق الجوال الميداني (Field Mobile App)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              اختبر سيناريوهات حضور الموظف داخل الموقع، وخارجه، ورصد الخروج أثناء الدوام في الوقت الفعلي.
            </p>
          </div>
        </div>

        {/* Technician selector */}
        <div className="form-group">
          <label className="form-label">اختر الفني الميداني المسجل:</label>
          <select
            className="form-control"
            value={currentTech.username}
            onChange={(e) => {
              const u = e.target.value;
              if (u === 'tech1') setCurrentTech({ username: 'tech1', name: 'فني كهرباء / أحمد الشمري' });
              if (u === 'tech2') setCurrentTech({ username: 'tech2', name: 'فني كهرباء / خالد العتيبي' });
              if (u === 'tech3') setCurrentTech({ username: 'tech3', name: 'فني كهرباء / محمد القحطاني' });
              setAttendance(null);
            }}
          >
            <option value="tech1">أحمد الشمري (فني شبكات ولوحات تحكم)</option>
            <option value="tech2">خالد العتيبي (فني صيانة مولدات ومحولات)</option>
            <option value="tech3">محمد القحطاني (فني قوى وتمديدات)</option>
          </select>
        </div>

        {/* Site selector */}
        <div className="form-group">
          <label className="form-label">موقع العمل المخصص للفني:</label>
          <select
            className="form-control"
            value={selectedSiteId}
            onChange={e => setSelectedSiteId(e.target.value)}
          >
            {sites.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} (نصف القطر: {s.radius_meters}م | الدوام: {s.shift_start} - {s.shift_end})
              </option>
            ))}
          </select>
        </div>

        {/* GPS Control */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
            <span style={{ fontWeight: '700', fontSize: '14px' }}>طريقة تحديد الموقع الجغرافي:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className={`btn btn-outline ${!useRealGPS ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px', background: !useRealGPS ? '#0284c7' : 'transparent' }}
                onClick={() => setUseRealGPS(false)}
              >
                محاكاة المواقع
              </button>
              <button
                type="button"
                className={`btn btn-outline ${useRealGPS ? 'active' : ''}`}
                style={{ padding: '6px 14px', fontSize: '12px', background: useRealGPS ? '#0284c7' : 'transparent' }}
                onClick={() => setUseRealGPS(true)}
              >
                GPS الحقيقي للهاتف
              </button>
            </div>
          </div>

          {!useRealGPS && (
            <div>
              <label className="form-label">موقع الموظف الحالي بالنسبة لنطاق العمل:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSimulatedDistanceOption('inside_close')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${simulatedDistanceOption === 'inside_close' ? '#10b981' : 'var(--border-color)'}`,
                    background: simulatedDistanceOption === 'inside_close' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: simulatedDistanceOption === 'inside_close' ? '#34d399' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  🟢 داخل الموقع (15م من المركز)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedDistanceOption('inside_edge')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${simulatedDistanceOption === 'inside_edge' ? '#10b981' : 'var(--border-color)'}`,
                    background: simulatedDistanceOption === 'inside_edge' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: simulatedDistanceOption === 'inside_edge' ? '#34d399' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  🟡 على حافة النطاق (120م)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedDistanceOption('outside_near')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${simulatedDistanceOption === 'outside_near' ? '#ef4444' : 'var(--border-color)'}`,
                    background: simulatedDistanceOption === 'outside_near' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: simulatedDistanceOption === 'outside_near' ? '#f87171' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  🔴 خارج النطاق (480م)
                </button>

                <button
                  type="button"
                  onClick={() => setSimulatedDistanceOption('outside_far')}
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: `1px solid ${simulatedDistanceOption === 'outside_far' ? '#ef4444' : 'var(--border-color)'}`,
                    background: simulatedDistanceOption === 'outside_far' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0,0,0,0.2)',
                    color: simulatedDistanceOption === 'outside_far' ? '#f87171' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}
                >
                  ⚫ بعيد جداً عن الموقع (2.5 كم)
                </button>
              </div>
            </div>
          )}

          <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
            إحداثيات الموظف المحسوبة: <span style={{ direction: 'ltr', display: 'inline-block', color: 'white' }}>{userLocation.lat.toFixed(5)}, {userLocation.lon.toFixed(5)}</span>
          </div>
        </div>

        {/* Geofence Simulator Test Actions */}
        <div className="flex flex-col gap-2">
          <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-muted)' }}>إجراءات المحاكاة السريعة:</span>
          <div className="flex items-center gap-3">
            <button
              className="btn btn-outline"
              style={{ flex: 1, borderColor: '#ef4444', color: '#f87171' }}
              onClick={handleSimulateDeparture}
              disabled={!attendance || !!attendance.check_out_time}
            >
              <AlertTriangle size={16} /> محاكاة خروج الفني أثناء الدوام
            </button>
            <button
              className="btn btn-outline"
              style={{ flex: 1, borderColor: '#10b981', color: '#34d399' }}
              onClick={handleSimulateReturn}
              disabled={!activeDeparture}
            >
              <CheckCircle size={16} /> محاكاة عودة الفني للنطاق
            </button>
          </div>
        </div>
      </div>

      {/* THE SMARTPHONE MOCKUP */}
      <div>
        <div className="phone-mockup">
          <div className="phone-notch">
            <div className="phone-speaker" />
            <div className="phone-camera" />
          </div>

          <div className="phone-screen">
            {/* Phone Header */}
            <div className="flex items-center justify-between" style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '14px' }}>
              <div className="flex items-center gap-2">
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ⚡
                </div>
                <span style={{ fontWeight: '800', fontSize: '14px', color: 'white' }}>ميدان الكهرباء</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPhoneTab('attendance')}
                  style={{
                    background: phoneTab === 'attendance' ? '#0284c7' : 'transparent',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  الحضور
                </button>
                <button
                  onClick={() => setPhoneTab('electrical')}
                  style={{
                    background: phoneTab === 'electrical' ? '#0284c7' : 'transparent',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  المهام
                </button>
              </div>
            </div>

            {/* TAB 1: PHONE ATTENDANCE SCREEN */}
            {phoneTab === 'attendance' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Tech Profile Badge */}
                <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الفني المسجل:</div>
                  <div style={{ fontWeight: '700', fontSize: '13px', color: 'white' }}>{currentTech.name}</div>
                  <div style={{ fontSize: '11px', color: '#38bdf8' }}>الموقع: {activeSite?.name}</div>
                </div>

                {/* Geofence Radar Card */}
                <div
                  style={{
                    background: geofenceResult.is_inside ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                    border: `1.5px solid ${geofenceResult.is_inside ? '#10b981' : '#ef4444'}`,
                    borderRadius: '16px',
                    padding: '16px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      background: geofenceResult.is_inside ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      margin: '0 auto 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: geofenceResult.is_inside ? '#10b981' : '#ef4444'
                    }}
                  >
                    {geofenceResult.is_inside ? <CheckCircle size={32} /> : <XCircle size={32} />}
                  </div>

                  <h4 style={{ color: geofenceResult.is_inside ? '#34d399' : '#f87171', fontSize: '16px', fontWeight: '800', marginBottom: '4px' }}>
                    {geofenceResult.is_inside ? 'أنت داخل نطاق موقع العمل' : 'خارج نطاق موقع العمل'}
                  </h4>

                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: '6px 0' }}>
                    {geofenceResult.status_message}
                  </p>

                  <div style={{ marginTop: '8px', padding: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', fontSize: '12px' }}>
                    المسافة الحالية: <b style={{ color: '#38bdf8' }}>{geofenceResult.distance_meters} متر</b>
                    <span style={{ color: 'var(--text-dim)', marginRight: '6px' }}>(المسموح: {activeSite?.radius_meters}م)</span>
                  </div>
                </div>

                {/* Shift Hours Card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px', fontSize: '12px' }}>
                  <div className="flex items-center justify-between">
                    <span style={{ color: 'var(--text-muted)' }}>مواعيد الدوام:</span>
                    <span style={{ fontWeight: '700', color: 'white' }}>{activeSite?.shift_start} ص - {activeSite?.shift_end} م</span>
                  </div>
                </div>

                {/* Active Departure Alert inside phone */}
                {activeDeparture && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '10px', padding: '10px', fontSize: '12px', color: '#f87171' }}>
                    <div className="flex items-center gap-2" style={{ fontWeight: '700', marginBottom: '4px' }}>
                      <AlertTriangle size={16} /> تنبيه: تم رصد خروجك من الموقع!
                    </div>
                    <span>وقت الخروج: {activeDeparture.departure_time} - جاري احتساب مدة الغياب.</span>
                  </div>
                )}

                {/* Main Action Buttons */}
                <div style={{ marginTop: '10px' }}>
                  {!attendance?.check_in_time ? (
                    <div>
                      <button
                        className="btn btn-success"
                        style={{ width: '100%', height: '50px', fontSize: '15px', fontWeight: '800' }}
                        disabled={!geofenceResult.is_inside || isLoading}
                        onClick={handleCheckIn}
                      >
                        {isLoading ? 'جاري التحقق...' : 'تسجيل بداية الدوام (حضور)'}
                      </button>
                      {!geofenceResult.is_inside && (
                        <p style={{ color: '#f87171', fontSize: '11px', textAlign: 'center', marginTop: '8px' }}>
                          ⛔ الزر معطل لأنك خارج النطاق الجغرافي المحدد للمشروع.
                        </p>
                      )}
                    </div>
                  ) : !attendance?.check_out_time ? (
                    <div>
                      <div style={{ background: 'rgba(2, 132, 199, 0.15)', border: '1px solid #0284c7', borderRadius: '10px', padding: '10px', textAlign: 'center', marginBottom: '12px' }}>
                        <span style={{ color: '#38bdf8', fontWeight: '700', fontSize: '13px' }}>
                          ✅ تم تسجيل حضورك بنجاح الساعة: {new Date(attendance.check_in_time).toLocaleTimeString('ar-SA')}
                        </span>
                      </div>

                      <button
                        className="btn btn-danger"
                        style={{ width: '100%', height: '50px', fontSize: '15px', fontWeight: '800' }}
                        disabled={isLoading}
                        onClick={handleCheckOut}
                      >
                        {isLoading ? 'جاري التسجيل...' : 'تسجيل نهاية الدوام (انصراف)'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                      <CheckCircle style={{ color: '#10b981', margin: '0 auto 6px' }} size={28} />
                      <div style={{ fontWeight: '700', color: 'white', fontSize: '14px' }}>اكتمل دوام اليوم</div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        وقت الانصراف: {new Date(attendance.check_out_time).toLocaleTimeString('ar-SA')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PHONE ELECTRICAL TASKS */}
            {phoneTab === 'electrical' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div style={{ fontWeight: '700', color: '#38bdf8', fontSize: '14px' }}>
                  تسجيل قراءات الأحمال والمولد
                </div>

                <form onSubmit={handleSendReading}>
                  <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>L1 (V)</label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={readingForm.voltage_l1}
                        onChange={e => setReadingForm({ ...readingForm, voltage_l1: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>L2 (V)</label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={readingForm.voltage_l2}
                        onChange={e => setReadingForm({ ...readingForm, voltage_l2: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>L3 (V)</label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={readingForm.voltage_l3}
                        onChange={e => setReadingForm({ ...readingForm, voltage_l3: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr', marginTop: '8px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>حالة المولد</label>
                      <select
                        className="form-control"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={readingForm.generator_status}
                        onChange={e => setReadingForm({ ...readingForm, generator_status: e.target.value })}
                      >
                        <option value="يعمل">يعمل</option>
                        <option value="متوقف">متوقف</option>
                        <option value="صيانة">صيانة</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>الوقود %</label>
                      <input
                        type="number"
                        className="form-control"
                        style={{ padding: '6px', fontSize: '12px' }}
                        value={readingForm.fuel_level_percent}
                        onChange={e => setReadingForm({ ...readingForm, fuel_level_percent: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '10px', padding: '8px', fontSize: '13px' }}
                  >
                    حفظ القراءات الكهربائية
                  </button>
                </form>

                <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '8px 0' }} />

                {/* Report Fault */}
                <div style={{ fontWeight: '700', color: '#f87171', fontSize: '14px' }}>
                  رفع بلاغ عطل كهربائي طارئ
                </div>

                <form onSubmit={handleReportFault}>
                  <input
                    type="text"
                    required
                    placeholder="عنوان العطل (مثال: احتراق فيوز اللوحة)"
                    className="form-control"
                    style={{ padding: '6px', fontSize: '12px', marginBottom: '6px' }}
                    value={faultForm.title}
                    onChange={e => setFaultForm({ ...faultForm, title: e.target.value })}
                  />

                  <textarea
                    rows={2}
                    required
                    placeholder="تفاصيل العطل والقطع المتضررة..."
                    className="form-control"
                    style={{ padding: '6px', fontSize: '12px', marginBottom: '6px' }}
                    value={faultForm.description}
                    onChange={e => setFaultForm({ ...faultForm, description: e.target.value })}
                  />

                  <button
                    type="submit"
                    className="btn btn-danger"
                    style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                  >
                    إرسال بلاغ العطل مع الإحداثيات
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
