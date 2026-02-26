// src/pages/Reports.tsx
// UPDATED — Enhanced UI with stat summary cards, polished tabs, and refined layout
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Icons } from '../components/icons';
import Badge, { BadgeVariant } from '../components/ui/Badge';
import { requestsAPI, authAPI } from '../lib/api';
import { startAuthentication } from '@simplewebauthn/browser';
import { Fingerprint, Clock, CheckCircle, LogOut, Users, Key, TrendingUp, UserCheck } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface KeyRequest {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    phone?: string;
    email?: string;
  };
  roomId: {
    _id: string;
    name: string;
    code: string;
  };
  requestedBy?: {
    _id: string;
    fullName: string;
    role?: string;
  };
  isAdminRequest?: boolean;
  carriedItems?: string;
  membership?: string;
  phone?: string;
  status: 'pending' | 'approved' | 'returned';
  returnApprovalStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  requestedAt: string;
  returnedAt?: string;
  returnRequestedAt?: string;
  createdAt: string;
}

interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    fullName: string;
    email: string;
    phone?: string;
    membership?: string;
    role?: string;
    accountType?: string;
  };
  checkInTime: string;
  checkOutTime?: string;
  authMethod: 'fingerprint' | 'manual' | 'password';
  status: 'checked_in' | 'checked_out';
  date: string;
  notes?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
};

const formatTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  } catch { return iso; }
};

const statusToBadge = (status: string): BadgeVariant => {
  switch (status) {
    case 'pending':  return 'pending';
    case 'approved': return 'approved';
    case 'returned': return 'returned';
    default:         return 'restricted';
  }
};

// ─── Small stat summary card ─────────────────────────────────────────────────
interface MiniStatProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
}
const MiniStat: React.FC<MiniStatProps> = ({ icon, label, value, color, bg }) => (
  <div style={{
    flex: '1 1 160px',
    background: bg,
    borderRadius: '12px',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: `1px solid ${color}33`,
    minWidth: 0,
  }}>
    <div style={{
      width: 40, height: 40,
      borderRadius: '10px',
      background: color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap' }}>{label}</div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'requests' | 'attendance'>('requests');

  // Request history state
  const [requests, setRequests] = useState<KeyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'returned'>('all');
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Attendance state
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [myStatus, setMyStatus] = useState<any>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  // ══════════════════════════════════════════════════════════════════════════
  // LOAD REQUESTS
  // ══════════════════════════════════════════════════════════════════════════
  const loadRequests = async () => {
    try {
      setLoading(true);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.role !== 'admin') {
        throw new Error('You must be an admin to view all requests. Your current role: ' + (currentUser.role || 'unknown'));
      }
      const data = await requestsAPI.getAllRequests();
      setRequests(data);
    } catch (err: any) {
      console.error('Failed to load requests:', err);
      alert(err.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LOAD TODAY'S ATTENDANCE
  // ══════════════════════════════════════════════════════════════════════════
  const loadAttendance = async () => {
    try {
      setAttendanceLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance/today', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to load attendance');
      const data = await response.json();
      setAttendanceRecords(data.attendances || []);
    } catch (err: any) {
      console.error('Failed to load attendance:', err);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK MY ATTENDANCE STATUS
  // ══════════════════════════════════════════════════════════════════════════
  const checkMyStatus = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance/my-status', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) return;
      const data = await response.json();
      setMyStatus(data);
    } catch (err: any) {
      console.error('Failed to check status:', err);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // FINGERPRINT CHECK-IN
  // ══════════════════════════════════════════════════════════════════════════
  const handleFingerprintCheckIn = async () => {
    try {
      setCheckInLoading(true);
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const email = user.email || currentUserEmail;
      if (!email) { alert('Email not found. Please log in again.'); return; }

      const optionsResponse = await authAPI.webauthnAuthStart(email);
      if (!optionsResponse.options) {
        throw new Error('No fingerprint registered. Please register your fingerprint in Settings.');
      }

      let credential;
      try {
        credential = await startAuthentication(optionsResponse.options);
      } catch (authError: any) {
        if (authError.name === 'NotAllowedError') throw new Error('Fingerprint authentication cancelled');
        throw new Error('Fingerprint authentication failed: ' + authError.message);
      }

      const verifyResponse = await authAPI.webauthnAuthFinish(optionsResponse.userId, credential);
      if (!verifyResponse.verified) throw new Error('Fingerprint verification failed');

      const token = localStorage.getItem('authToken');
      const checkInResponse = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!checkInResponse.ok) {
        const error = await checkInResponse.json();
        throw new Error(error.msg || 'Check-in failed');
      }

      alert('✅ Checked in successfully!');
      await Promise.all([loadAttendance(), checkMyStatus()]);
    } catch (err: any) {
      console.error('Check-in error:', err);
      alert('Check-in failed: ' + err.message);
    } finally {
      setCheckInLoading(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // CHECK-OUT
  // ══════════════════════════════════════════════════════════════════════════
  const handleCheckOut = async () => {
    if (!confirm('Are you sure you want to check out?')) return;
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/attendance/check-out', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Check-out failed');
      }
      alert('✅ Checked out successfully!');
      await Promise.all([loadAttendance(), checkMyStatus()]);
    } catch (err: any) {
      console.error('Check-out error:', err);
      alert('Check-out failed: ' + err.message);
    }
  };

  // ══════════════════════════════════════════════════════════════════════════
  // LIFECYCLE
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    loadRequests();
    checkMyStatus();
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUserEmail(user.email || '');
  }, []);

  useEffect(() => {
    if (activeTab === 'attendance') loadAttendance();
  }, [activeTab]);

  // ══════════════════════════════════════════════════════════════════════════
  // FILTERED REQUESTS
  // ══════════════════════════════════════════════════════════════════════════
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return requests.filter(r => {
      const matchesQuery =
        r.userId?.fullName?.toLowerCase().includes(q) ||
        r.userId?.phone?.toLowerCase().includes(q)    ||
        r.userId?.email?.toLowerCase().includes(q)    ||
        r.roomId?.name?.toLowerCase().includes(q)     ||
        r.roomId?.code?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [requests, query, statusFilter]);

  const paginated    = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages   = Math.ceil(filtered.length / perPage);

  // Derived stats for the summary strip (requests tab)
  const statsStrip = useMemo(() => ({
    total:    requests.length,
    pending:  requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    returned: requests.filter(r => r.status === 'returned').length,
  }), [requests]);

  // Derived stats for attendance tab
  const attendanceStats = useMemo(() => ({
    total:     attendanceRecords.length,
    checkedIn: attendanceRecords.filter(r => r.status === 'checked_in').length,
    checkedOut: attendanceRecords.filter(r => r.status === 'checked_out').length,
    fingerprint: attendanceRecords.filter(r => r.authMethod === 'fingerprint').length,
  }), [attendanceRecords]);

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <Icons.BarChart size={26} />
          Reports &amp; Attendance
        </h1>
        <p style={{ color: 'var(--muted-text)', fontSize: '14px', margin: 0 }}>
          Monitor key request history and daily member attendance
        </p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="reports-tabs">
        {(['requests', 'attendance'] as const).map(tab => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              className={`reports-tab-btn${isActive ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'requests'
                ? <><Key size={15} /><span className="reports-tab-label">Request History</span></>
                : <><Users size={15} /><span className="reports-tab-label">Daily Attendance</span></>}
            </button>
          );
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          REQUEST HISTORY TAB
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'requests' && (
        <div>
          {/* Stat Summary Strip */}
          {!loading && (
            <div className="reports-mini-stats">
              <MiniStat icon={<TrendingUp size={18} color="#fff" />} label="Total Requests" value={statsStrip.total}    color="#6366f1" bg="#f5f3ff" />
              <MiniStat icon={<Clock       size={18} color="#fff" />} label="Pending"        value={statsStrip.pending}  color="#f59e0b" bg="#fffbeb" />
              <MiniStat icon={<CheckCircle size={18} color="#fff" />} label="Approved"       value={statsStrip.approved} color="#10b981" bg="#f0fdf4" />
              <MiniStat icon={<LogOut      size={18} color="#fff" />} label="Returned"       value={statsStrip.returned} color="#3b82f6" bg="#eff6ff" />
            </div>
          )}

          {/* Search and Filter */}
          <div className="reports-filters-bar">
            <div className="reports-search-wrap">
              <Icons.Users size={15} color="#94a3b8" />
              <input
                className="reports-search-input"
                type="text"
                placeholder="Search by name, phone, email, room..."
                value={query}
                onChange={e => { setQuery(e.target.value); setPage(1); }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }}
              style={{
                padding: '9px 14px',
                border: '1.5px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '150px',
                background: '#fff',
                color: '#1e293b',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="returned">Returned</option>
            </select>
            {(query || statusFilter !== 'all') && (
              <button
                onClick={() => { setQuery(''); setStatusFilter('all'); setPage(1); }}
                style={{ padding: '9px 14px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
              <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div>Loading requests...</div>
            </div>
          ) : (
            <>
              {/* Results count */}
              <div style={{ marginBottom: '10px', fontSize: '13px', color: '#64748b' }}>
                Showing <strong>{paginated.length}</strong> of <strong>{filtered.length}</strong> requests
                {statusFilter !== 'all' && ` · filtered by "${statusFilter}"`}
              </div>

              <div className="reports-table-wrap">
                <table className="reports-table history-table" style={{ margin: 0, borderRadius: '12px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th>User</th>
                      <th>Contact</th>
                      <th>Room</th>
                      <th>Items</th>
                      <th>Requested</th>
                      <th>Status</th>
                      <th>Duration</th>
                      <th>Returned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                          <CheckCircle size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                          <div style={{ fontWeight: 500 }}>No requests found</div>
                          {(query || statusFilter !== 'all') && (
                            <div style={{ fontSize: '13px', marginTop: '4px' }}>Try adjusting your search or filter</div>
                          )}
                        </td>
                      </tr>
                    ) : (
                      paginated.map(r => (
                        <tr key={r._id} style={{ transition: 'background 0.1s' }}
                          onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseOut={e => (e.currentTarget.style.background = '')}
                        >
                          <td data-label="User" style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {(r.userId?.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{r.userId?.fullName || 'Unknown'}</div>
                                {r.isAdminRequest && r.requestedBy && (
                                  <div style={{ fontSize: '11px', color: '#6366f1', marginTop: '2px' }}>🔑 Via: {r.requestedBy.fullName}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td data-label="Contact" style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: '13px', color: '#374151' }}>{r.userId?.phone || '—'}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{r.userId?.email || '—'}</div>
                          </td>
                          <td data-label="Room" style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>{r.roomId?.name || 'Unknown'}</div>
                            <div style={{ marginTop: '4px' }}><Badge variant="available">{r.roomId?.code || '—'}</Badge></div>
                          </td>
                          <td data-label="Items" style={{ padding: '12px 16px', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#374151', fontSize: '13px' }}>
                            {r.carriedItems || <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                          <td data-label="Requested" style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{formatDateTime(r.requestedAt)}</td>
                          <td data-label="Status" style={{ padding: '12px 16px' }}>
                            <Badge variant={statusToBadge(r.status)}>
                              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                            </Badge>
                          </td>
                          <td data-label="Duration" style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>
                            {r.returnedAt
                              ? (() => {
                                  const mins = Math.round((new Date(r.returnedAt).getTime() - new Date(r.requestedAt).getTime()) / 60000);
                                  if (mins < 60) return `${mins}m`;
                                  const h = Math.floor(mins / 60), m = mins % 60;
                                  return m > 0 ? `${h}h ${m}m` : `${h}h`;
                                })()
                              : <span style={{ color: '#cbd5e1' }}>—</span>}
                          </td>
                          <td data-label="Returned" style={{ padding: '12px 16px', fontSize: '13px', color: '#475569' }}>{formatDateTime(r.returnedAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{
                      padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
                      background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer',
                      color: page === 1 ? '#cbd5e1' : '#374151', fontWeight: 500, fontSize: '13px',
                    }}
                  >
                    ← Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      style={{
                        padding: '8px 13px',
                        background: p === page ? '#6366f1' : '#fff',
                        color: p === page ? '#fff' : '#374151',
                        border: p === page ? '1.5px solid #6366f1' : '1.5px solid #e2e8f0',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: p === page ? 700 : 500,
                        fontSize: '13px',
                        transition: 'all 0.15s',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    style={{
                      padding: '8px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px',
                      background: '#fff', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                      color: page === totalPages ? '#cbd5e1' : '#374151', fontWeight: 500, fontSize: '13px',
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          DAILY ATTENDANCE TAB
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'attendance' && (
        <div>
          {/* ── Attendance Stat Strip ─────────────────────────────────────── */}
          {!attendanceLoading && (
            <div className="reports-mini-stats">
              <MiniStat icon={<Users       size={18} color="#fff" />} label="Total Today"     value={attendanceStats.total}       color="#6366f1" bg="#f5f3ff" />
              <MiniStat icon={<CheckCircle size={18} color="#fff" />} label="Checked In"      value={attendanceStats.checkedIn}   color="#10b981" bg="#f0fdf4" />
              <MiniStat icon={<LogOut      size={18} color="#fff" />} label="Checked Out"     value={attendanceStats.checkedOut}  color="#3b82f6" bg="#eff6ff" />
              <MiniStat icon={<Fingerprint size={18} color="#fff" />} label="Via Fingerprint" value={attendanceStats.fingerprint} color="#8b5cf6" bg="#f5f3ff" />
            </div>
          )}

          {/* ── My Status Card ─────────────────────────────────────────────── */}
          <div style={{
            background: myStatus?.checkedIn
              ? 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
              : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '14px',
            padding: '22px 24px',
            marginBottom: '24px',
            border: `2px solid ${myStatus?.checkedIn ? '#6ee7b7' : '#fcd34d'}`,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: myStatus?.checkedIn ? '#10b981' : '#f59e0b',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 0 4px ${myStatus?.checkedIn ? '#a7f3d0' : '#fde68a'}`,
                }}>
                  {myStatus?.checkedIn
                    ? <CheckCircle size={24} color="#fff" />
                    : <Clock size={24} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#1e293b' }}>
                    {myStatus?.checkedIn ? 'You are checked in' : "You haven't checked in today"}
                  </div>
                  {myStatus?.checkedIn && (
                    <div style={{ fontSize: '13px', color: '#374151', marginTop: '3px' }}>
                      In: <strong>{formatTime(myStatus.checkInTime)}</strong>
                      {myStatus.checkOutTime && (
                        <> &nbsp;·&nbsp; Out: <strong>{formatTime(myStatus.checkOutTime)}</strong></>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!myStatus?.checkedIn ? (
                  <button
                    onClick={handleFingerprintCheckIn}
                    disabled={checkInLoading}
                    style={{
                      padding: '11px 22px',
                      background: checkInLoading ? '#6ee7b7' : '#10b981',
                      color: '#fff',
                      border: 'none', borderRadius: '10px',
                      fontWeight: 700, fontSize: '14px',
                      cursor: checkInLoading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      transition: 'filter 0.15s',
                    }}
                    onMouseOver={e => { if (!checkInLoading) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseOut={e => (e.currentTarget.style.filter = 'none')}
                  >
                    <Fingerprint size={18} />
                    {checkInLoading ? 'Checking in…' : 'Check In with Fingerprint'}
                  </button>
                ) : myStatus.status === 'checked_in' && (
                  <button
                    onClick={handleCheckOut}
                    style={{
                      padding: '11px 22px',
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none', borderRadius: '10px',
                      fontWeight: 700, fontSize: '14px',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '8px',
                    }}
                  >
                    <LogOut size={18} />
                    Check Out
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Today's Attendance Table ────────────────────────────────────── */}
          <div>
            <div className="attendance-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1e293b' }}>
                  Today's Attendance
                  <span style={{ marginLeft: '10px', fontSize: '13px', fontWeight: 600, background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', padding: '2px 10px' }}>
                    {attendanceRecords.length}
                  </span>
                </h2>
                <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#94a3b8' }}>
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={loadAttendance}
                style={{ padding: '9px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '9px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px' }}
              >
                <Icons.CheckCircle size={15} />
                Refresh
              </button>
            </div>

            {attendanceLoading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                <Clock size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div>Loading attendance...</div>
              </div>
            ) : (
              <div className="attendance-table-wrap">
                <table className="reports-table attendance-table history-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['#', 'Name', 'Email', 'Membership', 'Check-in', 'Check-out', 'Status', 'Method'].map(h => (
                        <th key={h} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                          <Users size={32} style={{ marginBottom: '10px', opacity: 0.4 }} />
                          <div style={{ fontWeight: 500 }}>No attendance records for today</div>
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((record, index) => (
                        <tr key={record._id} style={{ transition: 'background 0.1s' }}
                          onMouseOver={e => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseOut={e => (e.currentTarget.style.background = '')}
                        >
                          <td data-label="#" style={{ padding: '12px 16px', fontWeight: 700, color: '#6366f1', fontSize: '14px' }}>
                            {index + 1}
                          </td>
                          <td data-label="Name" style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {(record.userId?.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>
                                {record.userId?.fullName || 'Unknown'}
                              </span>
                            </div>
                          </td>
                          <td data-label="Email" style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                            {record.userId?.email || '—'}
                          </td>
                          <td data-label="Membership" style={{ padding: '12px 16px', fontSize: '13px', color: '#374151' }}>
                            {record.userId?.membership
                              ? <span style={{ background: '#eff6ff', color: '#3b82f6', borderRadius: '20px', padding: '2px 10px', fontWeight: 600, fontSize: '12px' }}>{record.userId.membership}</span>
                              : <span style={{ color: '#cbd5e1' }}>None</span>}
                          </td>
                          <td data-label="Check-in" style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#10b981', fontWeight: 600 }}>
                              <Clock size={14} />
                              {formatTime(record.checkInTime)}
                            </div>
                          </td>
                          <td data-label="Check-out" style={{ padding: '12px 16px' }}>
                            {record.checkOutTime ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#ef4444', fontWeight: 600 }}>
                                <LogOut size={14} />
                                {formatTime(record.checkOutTime)}
                              </div>
                            ) : (
                              <span style={{ color: '#cbd5e1', fontSize: '13px' }}>—</span>
                            )}
                          </td>
                          <td data-label="Status" style={{ padding: '12px 16px' }}>
                            <Badge variant={record.status === 'checked_in' ? 'approved' : 'returned'}>
                              {record.status === 'checked_in' ? 'Checked In' : 'Checked Out'}
                            </Badge>
                          </td>
                          <td data-label="Method" style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#374151' }}>
                              {record.authMethod === 'fingerprint' && (
                                <><Fingerprint size={14} color="#8b5cf6" /><span style={{ color: '#8b5cf6', fontWeight: 600 }}>Fingerprint</span></>
                              )}
                              {record.authMethod === 'manual' && <span>Manual</span>}
                              {record.authMethod === 'password' && <span>Password</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;