// src/lib/api.ts
/// <reference types="vite/client" />

// ── Base URL ──────────────────────────────────────────────────────────────────
// Local: /api (Vite proxy → backend). Production (Vercel): set VITE_API_URL to your Render API URL + /api
const API_BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = (): string | null => {
  try { return localStorage.getItem('authToken'); }
  catch { return null; }
};

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.headers) Object.assign(headers, options.headers);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running on port 5000.');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const authAPI = {
  async login(email: string, password: string) {
    return fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  },

  async checkStatus(email: string) {
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/auth/check-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running.');
    }
    return response.json();
  },

  async register(formData: FormData) {
    const token = getToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    let response: Response;
    try {
      response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include',
      });
    } catch {
      throw new Error('Cannot reach the server. Make sure the backend is running on port 5000.');
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.msg || errorData.message || `Registration failed (HTTP ${response.status})`);
    }
    return response.json();
  },

  async adminResetPassword(userId: string, newPassword: string) {
    return fetchAPI('/auth/admin-reset-password', { method: 'POST', body: JSON.stringify({ userId, newPassword }) });
  },

  async impersonate(userId: string) {
    return fetchAPI('/auth/impersonate', { method: 'POST', body: JSON.stringify({ userId }) });
  },

  async webauthnRegisterStart(email: string) {
    return fetchAPI('/auth/webauthn/register/start', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async webauthnRegisterFinish(email: string, credential: any) {
    return fetchAPI('/auth/webauthn/register/finish', { method: 'POST', body: JSON.stringify({ email, credential }) });
  },

  async webauthnAuthStart(email: string) {
    return fetchAPI('/auth/webauthn/authenticate/start', { method: 'POST', body: JSON.stringify({ email }) });
  },

  async webauthnAuthFinish(userId: string, credential: any) {
    return fetchAPI('/auth/webauthn/authenticate/finish', { method: 'POST', body: JSON.stringify({ userId, credential }) });
  },

  async checkFingerprint() {
    return fetchAPI('/auth/webauthn/check');
  },
};

export const dashboardAPI = {
  async getStats() { return fetchAPI('/dashboard/stats'); },
};

export const membersAPI = {
  async getAll() { return fetchAPI('/members'); },
  async approve(id: string) { return fetchAPI(`/members/${id}/approve`, { method: 'PATCH' }); },
  async reject(id: string) { return fetchAPI(`/members/${id}/reject`, { method: 'PATCH' }); },
  async delete(id: string) { return fetchAPI(`/members/${id}`, { method: 'DELETE' }); },
  async update(id: string, data: any) {
    return fetchAPI(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
};

function buildRoomFormData(roomData: Record<string, any>, imageFile?: File | null): FormData {
  const fd = new FormData();
  for (const [key, val] of Object.entries(roomData)) {
    if (val === undefined || val === null) continue;
    if (Array.isArray(val)) fd.append(key, JSON.stringify(val));
    else fd.append(key, String(val));
  }
  if (imageFile) fd.append('directionImage', imageFile);
  return fd;
}

async function fetchFormData(endpoint: string, method: 'POST' | 'PUT', formData: FormData) {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, { method, headers, body: formData, credentials: 'include' });
  } catch {
    throw new Error('Cannot reach the server. Make sure the backend is running.');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.msg || errorData.message || `HTTP ${response.status}`);
  }
  return response.json();
}

export const roomsAPI = {
  async getAll() { return fetchAPI('/rooms'); },
  async create(roomData: Record<string, any>, imageFile?: File | null) {
    return fetchFormData('/rooms', 'POST', buildRoomFormData(roomData, imageFile));
  },
  async update(id: string, roomData: Record<string, any>, imageFile?: File | null) {
    return fetchFormData(`/rooms/${id}`, 'PUT', buildRoomFormData(roomData, imageFile));
  },
  async delete(id: string) { return fetchAPI(`/rooms/${id}`, { method: 'DELETE' }); },
};

export const requestsAPI = {
  async getAll() { return fetchAPI('/requests'); },
  async getAllRequests() { return fetchAPI('/requests/all'); },
  async getPendingReturns() { return fetchAPI('/requests/pending-returns'); },
  async create(requestData: any) {
    return fetchAPI('/requests', { method: 'POST', body: JSON.stringify(requestData) });
  },
  async returnRequest(id: string) { return fetchAPI(`/requests/${id}/return`, { method: 'PATCH' }); },
  async approveReturn(id: string) { return fetchAPI(`/requests/${id}/approve-return`, { method: 'PATCH' }); },
  async rejectReturn(id: string) { return fetchAPI(`/requests/${id}/reject-return`, { method: 'PATCH' }); },
};

export const reportsAPI = {
  async getAll() { return fetchAPI('/reports'); },
  async create(reportData: { title: string; roomCode: string; description?: string; priority?: string }) {
    return fetchAPI('/reports', { method: 'POST', body: JSON.stringify(reportData) });
  },
};

export default {
  auth: authAPI,
  dashboard: dashboardAPI,
  members: membersAPI,
  rooms: roomsAPI,
  requests: requestsAPI,
  reports: reportsAPI,
};