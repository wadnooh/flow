// كشف الدومين تلقائياً (flow.rtcco.org أو rtcco.org للإنتاج أو 127.0.0.1 للتطوير المحلي)
const isProductionDomain = typeof window !== 'undefined' && (
  window.location.hostname.includes('flow.rtcco.org') ||
  window.location.hostname.includes('rtcco.org') ||
  window.location.hostname.includes('onrender.com')
);

const API_BASE_URL = isProductionDomain
  ? `${window.location.origin}/api/v1`
  : 'http://127.0.0.1:8000/api/v1';

export const api = {
  getToken() {
    return localStorage.getItem('token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login/json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'فشل تسجيل الدخول');
    }
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  },

  async getSummary() {
    const res = await fetch(`${API_BASE_URL}/stats/summary`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async getSites() {
    const res = await fetch(`${API_BASE_URL}/sites/`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async getTeams() {
    const res = await fetch(`${API_BASE_URL}/teams/`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async createTeam(teamData) {
    const res = await fetch(`${API_BASE_URL}/teams/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(teamData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'فشل إنشاء الفريق الميداني');
    }
    return res.json();
  },

  async assignMemberToTeam(teamId, userId) {
    const res = await fetch(`${API_BASE_URL}/teams/${teamId}/assign-member?user_id=${userId}`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async createSite(siteData) {
    const res = await fetch(`${API_BASE_URL}/sites/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(siteData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'فشل إضافة موقع العمل');
    }
    return res.json();
  },

  async getAttendanceRecords(filterDate = null) {
    let url = `${API_BASE_URL}/attendance/records`;
    if (filterDate) url += `?filter_date=${filterDate}`;
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    return res.json();
  },

  async getDepartures() {
    const res = await fetch(`${API_BASE_URL}/attendance/departures`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async getElectricalReadings() {
    const res = await fetch(`${API_BASE_URL}/electrical/readings`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async addElectricalReading(data) {
    const res = await fetch(`${API_BASE_URL}/electrical/readings`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getFaults() {
    const res = await fetch(`${API_BASE_URL}/electrical/faults`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async reportFault(data) {
    const res = await fetch(`${API_BASE_URL}/electrical/faults`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Work Orders for Teams
  async getWorkOrders(siteId = null, teamId = null, status = null) {
    let url = `${API_BASE_URL}/work-orders/`;
    const params = new URLSearchParams();
    if (siteId) params.append('site_id', siteId);
    if (teamId) params.append('team_id', teamId);
    if (status) params.append('status_filter', status);
    if (params.toString()) url += `?${params.toString()}`;
    const res = await fetch(url, { headers: this.getAuthHeaders() });
    return res.json();
  },

  async createWorkOrder(data) {
    const res = await fetch(`${API_BASE_URL}/work-orders/`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'فشل إنشاء أمر العمل');
    }
    return res.json();
  },

  async updateWorkOrder(orderId, data) {
    const res = await fetch(`${API_BASE_URL}/work-orders/${orderId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Field Worker GPS & Geofence endpoints
  async checkGeofence(latitude, longitude, siteId = null) {
    const url = `${API_BASE_URL}/attendance/check-geofence?latitude=${latitude}&longitude=${longitude}${siteId ? `&site_id=${siteId}` : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return res.json();
  },

  async checkIn(latitude, longitude, siteId = null) {
    const res = await fetch(`${API_BASE_URL}/attendance/check-in`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ latitude, longitude, site_id: siteId })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'تعذر تسجيل الحضور');
    }
    return res.json();
  },

  async checkOut(latitude, longitude) {
    const res = await fetch(`${API_BASE_URL}/attendance/check-out`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ latitude, longitude })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'تعذر تسجيل الانصراف');
    }
    return res.json();
  },

  async pingLocation(latitude, longitude) {
    const res = await fetch(`${API_BASE_URL}/attendance/ping-location`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ latitude, longitude })
    });
    return res.json();
  },

  async getTodayStatus() {
    const res = await fetch(`${API_BASE_URL}/attendance/today`, {
      headers: this.getAuthHeaders()
    });
    return res.json();
  }
};
