import React, { useState, useEffect } from 'react';
import {
  MapPin, Plus, Clock, Users, AlertTriangle, ShieldCheck,
  Zap, CheckCircle2, ChevronRight, Activity, Fuel, Gauge,
  Calendar, FileText, ArrowUpRight, Search, Radio
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [sites, setSites] = useState([]);
  const [teams, setTeams] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [departures, setDepartures] = useState([]);
  const [electricalReadings, setElectricalReadings] = useState([]);
  const [faults, setFaults] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');

  // New Site Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSite, setNewSite] = useState({
    name: '',
    code: '',
    latitude: 24.774265,
    longitude: 46.738586,
    radius_meters: 150,
    shift_start: '07:00',
    shift_end: '16:00',
    description: ''
  });

  // New Team Modal State
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: '',
    code: '',
    specialty: 'طوارئ شبكات ومحطات تحويل',
    color: '#ef4444',
    site_id: 1,
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter tab inside admin
  const [subTab, setSubTab] = useState('overview'); // overview, teams, sites, attendance, electrical

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 15000); // Live refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [sumData, sitesData, teamsData, attData, depData, readingsData, faultsData] = await Promise.all([
        api.getSummary().catch(() => null),
        api.getSites().catch(() => []),
        api.getTeams().catch(() => []),
        api.getAttendanceRecords().catch(() => []),
        api.getDepartures().catch(() => []),
        api.getElectricalReadings().catch(() => []),
        api.getFaults().catch(() => [])
      ]);

      if (sumData) setSummary(sumData);
      if (Array.isArray(sitesData)) setSites(sitesData);
      if (Array.isArray(teamsData)) setTeams(teamsData);
      if (Array.isArray(attData)) setAttendances(attData);
      if (Array.isArray(depData)) setDepartures(depData);
      if (Array.isArray(readingsData)) setElectricalReadings(readingsData);
      if (Array.isArray(faultsData)) setFaults(faultsData);
    } catch (e) {
      console.error("Dashboard refresh error:", e);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createTeam(newTeam);
      setShowAddTeamModal(false);
      setNewTeam({
        name: '',
        code: '',
        specialty: 'طوارئ شبكات ومحطات تحويل',
        color: '#ef4444',
        site_id: sites[0]?.id || 1,
        description: ''
      });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleMapClick = (coords) => {
    if (showAddModal) {
      setNewSite(prev => ({
        ...prev,
        latitude: coords.lat,
        longitude: coords.lon
      }));
    }
  };

  const handleCreateSite = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createSite({
        ...newSite,
        radius_meters: parseFloat(newSite.radius_meters),
        latitude: parseFloat(newSite.latitude),
        longitude: parseFloat(newSite.longitude)
      });
      setShowAddModal(false);
      setNewSite({
        name: '',
        code: '',
        latitude: 24.774265,
        longitude: 46.738586,
        radius_meters: 150,
        shift_start: '07:00',
        shift_end: '16:00',
        description: ''
      });
      loadDashboardData();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Statistics Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <MapPin size={26} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#38bdf8' }}>{summary?.total_sites ?? sites.length}</div>
            <div className="stat-title">مواقع العمل المجهزة بالـ GPS</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
            <Users size={26} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#10b981' }}>{summary?.currently_on_shift ?? 0}</div>
            <div className="stat-title">فنيون متواجدون داخل النطاق الآن</div>
          </div>
        </div>

        <div className="glass-panel stat-card" style={{ borderColor: summary?.currently_outside_geofence > 0 ? 'rgba(239, 68, 68, 0.5)' : undefined }}>
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
            <AlertTriangle size={26} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#ef4444' }}>{summary?.currently_outside_geofence ?? 0}</div>
            <div className="stat-title">تنبيهات خروج عن النطاق أثناء الدوام</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
            <Zap size={26} />
          </div>
          <div>
            <div className="stat-val" style={{ color: '#f59e0b' }}>{summary?.open_faults ?? 0}</div>
            <div className="stat-title">بلاغات أعطال كهربائية مفتوحة</div>
          </div>
        </div>
      </div>

      {/* Sub navigation buttons */}
      <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
        <div className="nav-tabs">
          <button
            className={`nav-tab-btn ${subTab === 'overview' ? 'active' : ''}`}
            onClick={() => setSubTab('overview')}
          >
            <Activity size={16} /> نظرة عامة والخريطة
          </button>
          <button
            className={`nav-tab-btn ${subTab === 'teams' ? 'active' : ''}`}
            onClick={() => setSubTab('teams')}
          >
            <Users size={16} /> الفرق الميدانية والتخصصات ({teams.length})
          </button>
          <button
            className={`nav-tab-btn ${subTab === 'work_orders' ? 'active' : ''}`}
            onClick={() => setSubTab('work_orders')}
          >
            <FileText size={16} /> أوامر العمل والتكليفات ({workOrders.length})
          </button>
          <button
            className={`nav-tab-btn ${subTab === 'sites' ? 'active' : ''}`}
            onClick={() => setSubTab('sites')}
          >
            <MapPin size={16} /> مواقع العمل والـ Geofence
          </button>
          <button
            className={`nav-tab-btn ${subTab === 'attendance' ? 'active' : ''}`}
            onClick={() => setSubTab('attendance')}
          >
            <Clock size={16} /> سجلات الحضور والانصراف
          </button>
          <button
            className={`nav-tab-btn ${subTab === 'electrical' ? 'active' : ''}`}
            onClick={() => setSubTab('electrical')}
          >
            <Zap size={16} /> الأعمال والمولدات الكهربائية
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            style={{ fontSize: '13px', padding: '8px 14px' }}
            onClick={handlePrintReport}
            title="طباعة تقرير الحضور والأعمال الكهربائية"
          >
            <FileText size={16} /> طباعة التقرير
          </button>

          {subTab === 'teams' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddTeamModal(true)}
            >
              <Plus size={18} /> إنشاء وتفريق فريق ميداني جديد
            </button>
          )}

          {subTab === 'work_orders' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddWorkOrderModal(true)}
            >
              <Plus size={18} /> تكليف بأمر عمل جديد
            </button>
          )}

          {subTab !== 'teams' && subTab !== 'work_orders' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} /> إضافة موقع عمل وسياج جغرافي
            </button>
          )}
        </div>
      </div>

      {/* TAB: TEAMS MANAGEMENT & CATEGORIZATION */}
      {subTab === 'teams' && (
        <div>
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>تفريق وتصنيف الفرق الميدانية وتوزيع المهام</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                  تنظيم الفنيين في فرق عمل متخصصة كهربائياً، وتحديد موقع عمل كل فريق واختصاصه الميداني.
                </p>
              </div>
              <span className="badge badge-info">{teams.length} فرق عمل نشطة</span>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
              {teams.map(team => (
                <div
                  key={team.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${team.color || 'var(--border-color)'}`,
                    borderRadius: '14px',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: `0 4px 20px ${team.color ? team.color + '22' : 'transparent'}`
                  }}
                >
                  <div>
                    <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
                      <div className="flex items-center gap-2">
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: team.color }} />
                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{team.name}</h4>
                      </div>
                      <span className="badge badge-info">{team.code}</span>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>التخصص الكهربائي: </span>
                      <b style={{ color: team.color || '#38bdf8' }}>{team.specialty}</b>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '14px' }}>
                      {team.description || 'لا يوجد وصف إضافي للفريق'}
                    </p>

                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '8px' }}>
                      الموقع الميداني المخصص: <b>{team.site_name || 'غير محدد'}</b>
                    </div>

                    {/* Members List */}
                    <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="flex items-center justify-between" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                        <span>أعضاء الفريق ({team.members_count} فنيين):</span>
                        <span style={{ color: '#10b981' }}>● متصلين بالـ GPS</span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {team.members && team.members.length > 0 ? (
                          team.members.map(m => (
                            <span
                              key={m.id}
                              style={{
                                background: 'rgba(255,255,255,0.06)',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: 'white'
                              }}
                            >
                              👤 {m.name} ({m.job_title})
                            </span>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>لم يتم إسناد فنيين بعد</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: WORK ORDERS & DISPATCHING */}
      {subTab === 'work_orders' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>أوامر العمل والتكليفات الميدانية للفرق</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                إسناد مهام الصيانة والفحص والأعمال الكهربائية للفرق المتخصصة ومتابعة حالة الإنجاز.
              </p>
            </div>
            <span className="badge badge-info">{workOrders.length} أوامر عمل</span>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>عنوان أمر العمل</th>
                  <th>الفريق الميداني المكلف</th>
                  <th>موقع العمل</th>
                  <th>الأولوية</th>
                  <th>تاريخ الاستحقاق</th>
                  <th>الحالة</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {workOrders.map(wo => (
                  <tr key={wo.id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'white' }}>{wo.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{wo.description}</div>
                    </td>
                    <td>
                      <span className="badge badge-info">{wo.assigned_team_name}</span>
                    </td>
                    <td>{wo.site_name}</td>
                    <td>
                      <span className={`badge ${wo.priority === 'urgent' ? 'badge-danger' : wo.priority === 'high' ? 'badge-warning' : 'badge-info'}`}>
                        {wo.priority === 'urgent' ? 'عاجل جداً' : wo.priority === 'high' ? 'مرتفع' : 'عادي'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px' }}>
                      {wo.due_date ? new Date(wo.due_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                    </td>
                    <td>
                      <span className={`badge ${wo.status === 'completed' ? 'badge-success' : wo.status === 'in_progress' ? 'badge-warning' : 'badge-info'}`}>
                        {wo.status === 'completed' ? 'مكتمل' : wo.status === 'in_progress' ? 'قيد التنفيذ' : 'قيد الانتظار'}
                      </span>
                    </td>
                    <td>
                      {wo.status !== 'completed' ? (
                        <button
                          className="btn btn-success"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => handleUpdateWorkOrderStatus(wo.id, 'completed')}
                        >
                          ✓ إتمام الأمر
                        </button>
                      ) : (
                        <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>تم الإنجاز</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW & MAP */}
      {subTab === 'overview' && (
        <div className="grid gap-6" style={{ gridTemplateColumns: '1.6fr 1fr' }}>
          {/* Map Column */}
          <div className="glass-panel" style={{ padding: '18px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
              <div className="flex items-center gap-2">
                <Radio className="radar-anim" style={{ color: '#38bdf8' }} size={20} />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>خريطة السياج الجغرافي (Geofencing) المباشرة</h3>
              </div>
              <span className="badge badge-info">تحديث لحظي</span>
            </div>

            <InteractiveMap
              sites={sites}
              selectedSite={selectedSite}
              onMapClick={handleMapClick}
              previewCoordinates={showAddModal ? { lat: newSite.latitude, lon: newSite.longitude } : null}
              previewRadius={showAddModal ? newSite.radius_meters : 150}
              height="450px"
            />

            <div className="flex items-center gap-4" style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
              <div className="flex items-center gap-2">
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#0284c7', display: 'inline-block' }} />
                <span>دوائر النطاق المسموح (Radius)</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span>فني متواجد داخل الموقع</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span>فني خارج الموقع أثناء الدوام</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Departures Alerts & Sites Quick View */}
          <div className="flex flex-col gap-4">
            {/* Live Departures Box */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <div className="flex items-center gap-2">
                  <AlertTriangle style={{ color: '#ef4444' }} size={18} />
                  <h3 style={{ fontSize: '15px', fontWeight: '700' }}>رصد الخروج أثناء الدوام</h3>
                </div>
                <span className="badge badge-danger">{departures.length} حالة</span>
              </div>

              {departures.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-dim)' }}>
                  <ShieldCheck size={36} style={{ color: '#10b981', margin: '0 auto 8px' }} />
                  <p>جميع الموظفين متواجدون داخل النطاق ولم يتم رصد خروج غير مصرح به.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {departures.slice(0, 4).map(dep => (
                    <div
                      key={dep.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: '10px',
                        padding: '12px 14px'
                      }}
                    >
                      <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
                        <span style={{ fontWeight: '700', color: 'white' }}>{dep.user_name}</span>
                        <span className={`badge ${dep.is_ongoing ? 'badge-danger' : 'badge-warning'}`}>
                          {dep.is_ongoing ? 'خارج الموقع حالياً' : 'عاد إلى الموقع'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#cbd5e1' }}>
                        الموقع: {dep.site_name} | المسافة: {dep.departure_distance?.toFixed(0)}م
                      </div>
                      <div className="flex items-center justify-between" style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>وقت الخروج: {new Date(dep.departure_time).toLocaleTimeString('ar-SA')}</span>
                        <span>المدة بالخارج: {dep.outside_minutes} دقيقة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sites Quick List */}
            <div className="glass-panel" style={{ padding: '20px', flex: 1 }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>المواقع المسجلة ونطاق الأمان</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sites.map(site => (
                  <div
                    key={site.id}
                    onClick={() => setSelectedSite(site)}
                    style={{
                      padding: '12px',
                      background: selectedSite?.id === site.id ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${selectedSite?.id === site.id ? 'var(--primary-light)' : 'var(--border-color)'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: '700', fontSize: '14px' }}>{site.name}</span>
                      <span className="badge badge-info">{site.radius_meters}م سياج</span>
                    </div>
                    <div className="flex items-center justify-between" style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>الدوام: {site.shift_start} - {site.shift_end}</span>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>المتواجدون: {site.present_now} فني</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SITES DETAILED */}
      {subTab === 'sites' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>إدارة مواقع العمل الميدانية ومواصفات السياج</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                تحديد إحداثيات GPS ونصف القطر المسموح لتسجيل الحضور وتعيين أوقات الدوام الرسمي.
              </p>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم موقع العمل</th>
                  <th>كود الموقع</th>
                  <th>إحداثيات GPS (Lat, Lon)</th>
                  <th>نصف القطر المسموح (Radius)</th>
                  <th>بداية الدوام</th>
                  <th>نهاية الدوام</th>
                  <th>الفنيين المربوطين</th>
                  <th>المتواجدون الآن</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {sites.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: '700' }}>{s.name}</td>
                    <td><span className="badge badge-info">{s.code}</span></td>
                    <td style={{ direction: 'ltr', textAlign: 'right' }}>{s.latitude?.toFixed(5)}, {s.longitude?.toFixed(5)}</td>
                    <td><span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{s.radius_meters} متر</span></td>
                    <td>{s.shift_start}</td>
                    <td>{s.shift_end}</td>
                    <td>{s.assigned_technicians} فنيين</td>
                    <td><span className="badge badge-success">{s.present_now} متواجد</span></td>
                    <td><span className="badge badge-success">نشط</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE RECORDS */}
      {subTab === 'attendance' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>سجل الحضور والانصراف الميداني بالـ GPS</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                متابعة أوقات الحضور والانصراف، والمسافة المسجلة عند البوابة، وفترات البقاء خارج الموقع.
              </p>
            </div>
          </div>

          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>اسم الفني</th>
                  <th>الموقع</th>
                  <th>التاريخ</th>
                  <th>وقت الحضور</th>
                  <th>المسافة عند الحضور</th>
                  <th>وقت الانصراف</th>
                  <th>ساعات العمل</th>
                  <th>فترات الخروج أثناء الدوام</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {attendances.map(a => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '700' }}>{a.user_name}</td>
                    <td>{a.site_name}</td>
                    <td>{a.date}</td>
                    <td>{a.check_in_time ? new Date(a.check_in_time).toLocaleTimeString('ar-SA') : '--:--'}</td>
                    <td><span style={{ color: '#10b981' }}>{a.check_in_distance ? `${a.check_in_distance.toFixed(1)}م` : '-'}</span></td>
                    <td>{a.check_out_time ? new Date(a.check_out_time).toLocaleTimeString('ar-SA') : 'في الموقع حالياً'}</td>
                    <td>{Math.floor((a.total_work_minutes || 0) / 60)} س و {(a.total_work_minutes || 0) % 60} د</td>
                    <td>
                      {a.departures && a.departures.length > 0 ? (
                        <span className="badge badge-warning">
                          {a.departures.length} خروج ({a.departures.reduce((acc, d) => acc + (d.outside_minutes || 0), 0)} دقيقة)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>لا يوجد خروج</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${a.check_out_time ? 'badge-info' : 'badge-success'}`}>
                        {a.check_out_time ? 'انصرف' : 'في الدوام'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTRICAL & GENERATORS */}
      {subTab === 'electrical' && (
        <div className="grid gap-6" style={{ gridTemplateColumns: '1.2fr 1fr' }}>
          {/* Readings */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px' }}>قراءات التغذية الكهربائية والمولدات</h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الموقع</th>
                    <th>المصدر</th>
                    <th>الجهد L1/L2/L3</th>
                    <th>حالة المولد</th>
                    <th>الوقود</th>
                    <th>المسجل</th>
                  </tr>
                </thead>
                <tbody>
                  {electricalReadings.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontWeight: '700' }}>{r.site_name}</td>
                      <td><span className="badge badge-info">{r.source_type}</span></td>
                      <td style={{ direction: 'ltr' }}>{r.voltage_l1}V / {r.voltage_l2}V / {r.voltage_l3}V</td>
                      <td>
                        <span className={`badge ${r.generator_status === 'يعمل' ? 'badge-success' : 'badge-warning'}`}>
                          {r.generator_status}
                        </span>
                      </td>
                      <td>
                        {r.fuel_level_percent != null ? (
                          <div className="flex items-center gap-2">
                            <Fuel size={14} style={{ color: '#f59e0b' }} />
                            <span>{r.fuel_level_percent}%</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td style={{ fontSize: '12px' }}>{r.recorded_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Fault Reports */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '800', marginBottom: '16px' }}>بلاغات الأعطال الكهربائية الميدانية</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {faults.map(f => (
                <div
                  key={f.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    padding: '14px'
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', color: 'white' }}>{f.title}</span>
                    <span className={`badge ${f.severity === 'critical' ? 'badge-danger' : 'badge-warning'}`}>
                      {f.severity === 'critical' ? 'حرج جداً' : f.severity}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px' }}>
                    {f.description}
                  </p>
                  <div className="flex items-center justify-between" style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    <span>الموقع: {f.site_name}</span>
                    <span>الحالة: <b style={{ color: f.status === 'open' ? '#f59e0b' : '#10b981' }}>{f.status === 'open' ? 'قيد المعالجة' : 'تم الإصلاح'}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD WORK SITE & GEOFENCE */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <div className="flex items-center gap-2">
                <MapPin style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>إضافة موقع عمل وتحديد السياج الجغرافي</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSite}>
              <div className="form-group">
                <label className="form-label">اسم موقع العمل / المشروع</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محطة تحويل غرب الرياض - رقم 4"
                  className="form-control"
                  value={newSite.name}
                  onChange={e => setNewSite({ ...newSite, name: e.target.value })}
                />
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">كود الموقع</label>
                  <input
                    type="text"
                    required
                    placeholder="SITE-WR-04"
                    className="form-control"
                    value={newSite.code}
                    onChange={e => setNewSite({ ...newSite, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">نصف القطر المسموح (بالأمتار)</label>
                  <select
                    className="form-control"
                    value={newSite.radius_meters}
                    onChange={e => setNewSite({ ...newSite, radius_meters: Number(e.target.value) })}
                  >
                    <option value={100}>100 متر (موقع صغير / مبنى محدد)</option>
                    <option value={150}>150 متر (موقع متوسط)</option>
                    <option value={200}>200 متر (محطة تحويل / مصنع)</option>
                    <option value={300}>300 متر (مجمع تجاري)</option>
                    <option value={500}>500 متر (مشروع بنية تحتية واسع)</option>
                  </select>
                </div>
              </div>

              {/* Coordinates */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">خط العرض (Latitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-control"
                    value={newSite.latitude}
                    onChange={e => setNewSite({ ...newSite, latitude: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">خط الطول (Longitude)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    className="form-control"
                    value={newSite.longitude}
                    onChange={e => setNewSite({ ...newSite, longitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <p style={{ fontSize: '12px', color: '#38bdf8', marginTop: '-8px', marginBottom: '16px' }}>
                💡 يمكنك النقر مباشرة على أي نقطة في الخريطة الخلفية لتعبئة الإحداثيات تلقائياً!
              </p>

              {/* Shifts */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">بداية الدوام الرسمي</label>
                  <input
                    type="time"
                    required
                    className="form-control"
                    value={newSite.shift_start}
                    onChange={e => setNewSite({ ...newSite, shift_start: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">نهاية الدوام الرسمي</label>
                  <input
                    type="time"
                    required
                    className="form-control"
                    value={newSite.shift_end}
                    onChange={e => setNewSite({ ...newSite, shift_end: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">وصف الموقع والأعمال الكهربائية</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="وصف محطة التحويل، القواطع الرئيسية، والمولدات الموجودة بالموقع..."
                  value={newSite.description}
                  onChange={e => setNewSite({ ...newSite, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ الموقع وتفعيل الـ Geofence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIELD TEAM */}
      {showAddTeamModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <div className="flex items-center gap-2">
                <Users style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>إنشاء وتفريق فريق ميداني جديد</h3>
              </div>
              <button
                onClick={() => setShowAddTeamModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeam}>
              <div className="form-group">
                <label className="form-label">اسم الفريق الميداني</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فريق طوارئ الكابلات والجهد العالي"
                  className="form-control"
                  value={newTeam.name}
                  onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                />
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">كود الفريق</label>
                  <input
                    type="text"
                    required
                    placeholder="TEAM-HV-01"
                    className="form-control"
                    value={newTeam.code}
                    onChange={e => setNewTeam({ ...newTeam, code: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">التخصص الميداني</label>
                  <select
                    className="form-control"
                    value={newTeam.specialty}
                    onChange={e => setNewTeam({ ...newTeam, specialty: e.target.value })}
                  >
                    <option value="طوارئ شبكات ومحطات تحويل">طوارئ شبكات ومحطات تحويل</option>
                    <option value="صيانة المولدات ومحركات الديزل">صيانة المولدات ومحركات الديزل</option>
                    <option value="تمديدات القوى واللوحات MDB">تمديدات القوى واللوحات MDB</option>
                    <option value="فحص واختبارات الكابلات والعزل">فحص واختبارات الكابلات والعزل</option>
                    <option value="سلامة وتأريض كهربائي">سلامة وتأريض كهربائي</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">موقع العمل المخصص</label>
                  <select
                    className="form-control"
                    value={newTeam.site_id}
                    onChange={e => setNewTeam({ ...newTeam, site_id: Number(e.target.value) })}
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">لون تمييز الفريق على الخريطة</label>
                  <input
                    type="color"
                    className="form-control"
                    style={{ height: '42px', padding: '4px' }}
                    value={newTeam.color}
                    onChange={e => setNewTeam({ ...newTeam, color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">وصف مهام ومسؤوليات الفريق</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="وصف الأعمال المسندة للفريق والمسؤوليات الميدانية..."
                  value={newTeam.description}
                  onChange={e => setNewTeam({ ...newTeam, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddTeamModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'جاري الحفظ...' : 'إنشاء الفريق وتفعيله'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE WORK ORDER */}
      {showAddWorkOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
              <div className="flex items-center gap-2">
                <FileText style={{ color: '#38bdf8' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>إصدار وتكليف أمر عمل ميداني</h3>
              </div>
              <button
                onClick={() => setShowAddWorkOrderModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder}>
              <div className="form-group">
                <label className="form-label">عنوان أمر العمل</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فحص قواطع MDB الرئيسية واستبدال فيوزات 100A"
                  className="form-control"
                  value={newWorkOrder.title}
                  onChange={e => setNewWorkOrder({ ...newWorkOrder, title: e.target.value })}
                />
              </div>

              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">الفريق الميداني المختص</label>
                  <select
                    className="form-control"
                    value={newWorkOrder.assigned_team_id}
                    onChange={e => setNewWorkOrder({ ...newWorkOrder, assigned_team_id: Number(e.target.value) })}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">موقع العمل المستهدف</label>
                  <select
                    className="form-control"
                    value={newWorkOrder.site_id}
                    onChange={e => setNewWorkOrder({ ...newWorkOrder, site_id: Number(e.target.value) })}
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">درجة الأولوية</label>
                <select
                  className="form-control"
                  value={newWorkOrder.priority}
                  onChange={e => setNewWorkOrder({ ...newWorkOrder, priority: e.target.value })}
                >
                  <option value="normal">عادية (أعمال روتينية وجداول مجدولة)</option>
                  <option value="high">مرتفعة (صيانة وقائية هامة أو خلل غير طارئ)</option>
                  <option value="urgent">عاجلة جداً (انقطاع تغذية / خطر كهربائي داهم)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">تفاصيل وتعليمات أمر العمل الميداني</label>
                <textarea
                  rows={3}
                  className="form-control"
                  placeholder="حدد بدقة الخطوات المطلوبة ومعدات السلامة اللازمة..."
                  value={newWorkOrder.description}
                  onChange={e => setNewWorkOrder({ ...newWorkOrder, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between" style={{ marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddWorkOrderModal(false)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'جاري الإصدار...' : 'إصدار أمر العمل وإرساله للفريق'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
