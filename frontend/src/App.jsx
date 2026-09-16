import React, { useState, useEffect } from 'react';
import {
  Zap, LayoutDashboard, Smartphone, Globe, Shield,
  Server, CheckCircle2, MapPin, Radio
} from 'lucide-react';
import AdminDashboard from './components/AdminDashboard';
import MobileSimulator from './components/MobileSimulator';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'mobile', 'domain'
  const [sites, setSites] = useState([]);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    // Initial login as admin so all endpoints are authenticated
    api.login('admin', 'admin123')
      .then(() => {
        setApiOnline(true);
        return api.getSites();
      })
      .then(data => {
        if (Array.isArray(data)) setSites(data);
      })
      .catch(err => {
        console.error("API error:", err);
      });
  }, []);

  return (
    <div className="app-container">
      {/* Top Header & Navigation */}
      <header className="glass-panel navbar">
        <div className="logo-badge">
          <div className="logo-icon">
            <Zap size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.3px', color: 'white' }}>
                نظام متابعة الكهربائية والفرق الميدانية
              </h1>
              <span className="badge badge-success">GPS + Geofencing</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              إدارة مواقع العمل، تتبع الحضور والانصراف، ورصد التواجد والخروج أثناء الدوام
            </p>
          </div>
        </div>

        {/* System & Mode Switcher */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2" style={{ fontSize: '13px', color: apiOnline ? '#10b981' : '#ef4444' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: apiOnline ? '#10b981' : '#ef4444', display: 'inline-block' }} />
            <span>{apiOnline ? 'خادم الـ API متصل (Port 8000)' : 'جاري الاتصال بالخادم...'}</span>
          </div>

          <div className="nav-tabs">
            <button
              className={`nav-tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              <LayoutDashboard size={17} /> لوحة تحكم المشرف (Dashboard)
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'mobile' ? 'active' : ''}`}
              onClick={() => setActiveTab('mobile')}
            >
              <Smartphone size={17} /> تطبيق الجوال الميداني (Field App)
            </button>
            <button
              className={`nav-tab-btn ${activeTab === 'domain' ? 'active' : ''}`}
              onClick={() => setActiveTab('domain')}
            >
              <Globe size={17} /> إعدادات الربط بالدومين
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main>
        {activeTab === 'admin' && <AdminDashboard />}
        {activeTab === 'mobile' && <MobileSimulator sites={sites} />}

        {activeTab === 'domain' && (
          <div className="glass-panel" style={{ padding: '32px', maxWidth: '960px', margin: '0 auto' }}>
            <div className="flex items-center gap-3" style={{ marginBottom: '20px' }}>
              <Globe style={{ color: '#38bdf8' }} size={28} />
              <div>
                <h2 style={{ fontSize: '22px', fontWeight: '800' }}>دليل ربط وتفعيل النظام على الدومين: rtcco.org</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                  خطوات توجيه الدومين وتشغيل سيرفر الـ API ولوحة التحكم والـ SSL على سيرفرك.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Step 1: DNS */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '10px', color: '#38bdf8', fontWeight: '700' }}>
                  <Globe size={18} /> 1. ربط الـ DNS الخاص بالدومين (DNS Records)
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7' }}>
                  في لوحة تحكم مزود الدومين (Namecheap, GoDaddy, Cloudflare...)، أضف سجلات A التالية تشير إلى IP السيرفر الخاص بك:
                </p>
                <div style={{ background: '#070b16', padding: '12px', borderRadius: '8px', fontSize: '13px', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', color: '#38bdf8', marginTop: '8px' }}>
                  Type: A &nbsp;&nbsp;|&nbsp;&nbsp; Name: @ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp; Value: [YOUR_SERVER_IP] &nbsp;&nbsp;&nbsp;(rtcco.org)<br/>
                  Type: A &nbsp;&nbsp;|&nbsp;&nbsp; Name: www &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp; Value: [YOUR_SERVER_IP] &nbsp;&nbsp;&nbsp;(www.rtcco.org)<br/>
                  Type: A &nbsp;&nbsp;|&nbsp;&nbsp; Name: api &nbsp;&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp; Value: [YOUR_SERVER_IP] &nbsp;&nbsp;&nbsp;(api.rtcco.org)
                </div>
              </div>

              {/* Step 2: Nginx & SSL */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '10px', color: '#10b981', fontWeight: '700' }}>
                  <Shield size={18} /> 2. تثبيت ملف Nginx وشهادة SSL المجانية
                </div>
                <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.7' }}>
                  الملف الجاهز <code>nginx_rtcco.org.conf</code> مبرمج لتوجيه اللوحة وتشفير الـ API تلقائياً:
                </p>
                <div style={{ background: '#070b16', padding: '12px', borderRadius: '8px', fontSize: '13px', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', color: '#a7f3d0', marginTop: '8px' }}>
                  # تشغيل سكريبت النشر الآلي على السيرفر:<br/>
                  bash deploy_rtcco.sh<br/><br/>
                  # أو توليد الشهادة يدوياً عبر Certbot:<br/>
                  sudo certbot --nginx -d rtcco.org -d www.rtcco.org
                </div>
              </div>

              {/* Step 3: Endpoints */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px' }}>
                <div className="flex items-center gap-2" style={{ marginBottom: '10px', color: '#f59e0b', fontWeight: '700' }}>
                  <Server size={18} /> 3. روابط النظام النشطة بعد الربط
                </div>
                <div style={{ background: '#070b16', padding: '12px', borderRadius: '8px', fontSize: '13px', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', color: '#fde68a' }}>
                  https://rtcco.org &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# لوحة تحكم المشرف ومحاكي الجوال<br/>
                  https://rtcco.org/docs &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;# واجهة توثيق واختبار الـ API<br/>
                  https://rtcco.org/api/v1/attendance &nbsp;# مسار تسجيل الحضور بالـ GPS
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
