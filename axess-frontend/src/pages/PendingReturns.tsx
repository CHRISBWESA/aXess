// src/pages/PendingReturns.tsx
// Admin page — two sections:
//   1. Manual return requests (user clicked "Return Key")
//   2. Overdue requests — approved keys held for MORE than 24 hours with no return
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/icons';
import Badge from '../components/ui/Badge';
import { requestsAPI } from '../lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface ReturnRequest {
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
  carriedItems?: string;
  membership?: string;
  status: string;
  returnApprovalStatus: string;
  returnRequestedAt?: string;
  requestedAt: string;
  returnedAt?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDateTime = (iso?: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const getHoursAgo = (iso?: string): number => {
  if (!iso) return 0;
  return (Date.now() - new Date(iso).getTime()) / 1000 / 60 / 60;
};

const formatDuration = (iso?: string): string => {
  if (!iso) return '—';
  const totalMinutes = Math.floor((Date.now() - new Date(iso).getTime()) / 1000 / 60);
  const days    = Math.floor(totalMinutes / 1440);
  const hours   = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0)  return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Urgency level based on hours held
const getUrgency = (hours: number): { label: string; colour: string; bg: string } => {
  if (hours >= 72) return { label: 'CRITICAL',  colour: '#7f1d1d', bg: '#fee2e2' };
  if (hours >= 48) return { label: 'HIGH',      colour: '#991b1b', bg: '#fecaca' };
  if (hours >= 24) return { label: 'OVERDUE',   colour: '#c2410c', bg: '#ffedd5' };
  return             { label: 'PENDING',    colour: '#92400e', bg: '#fef3c7' };
};

// ─── Component ───────────────────────────────────────────────────────────────
const PendingReturns: React.FC = () => {
  const navigate = useNavigate();

  // ── Auth guard: redirect to login if not admin ───────────────────────────
  useEffect(() => {
    try {
      const token    = localStorage.getItem('authToken');
      const userStr  = localStorage.getItem('currentUser');
      if (!token || !userStr) { navigate('/login', { replace: true }); return; }
      const u = JSON.parse(userStr);
      if (u.role !== 'admin')  { navigate('/dashboard', { replace: true }); return; }
    } catch {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // ── State ────────────────────────────────────────────────────────────────
  const [pendingReturns, setPendingReturns] = useState<ReturnRequest[]>([]);
  const [overdueItems,   setOverdueItems]   = useState<ReturnRequest[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState<string | null>(null);
  const [processing,     setProcessing]     = useState<string | null>(null);
  const [activeTab,      setActiveTab]      = useState<'pending' | 'overdue'>('pending');
  const [searchTerm,     setSearchTerm]     = useState('');
  // Live timer so durations tick every minute
  const [, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // ── Load data ────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Pending return approvals (user clicked "Return Key")
      const pending: ReturnRequest[] = await requestsAPI.getPendingReturns();
      setPendingReturns(pending);

      // 2. Overdue: approved requests where key was taken > 24 hours ago
      //    We fetch ALL requests and filter client-side.
      const all: ReturnRequest[] = await requestsAPI.getAllRequests();
      const overdue = all.filter(r => {
        if (r.status !== 'approved') return false;
        if (r.returnApprovalStatus === 'pending_approval') return false; // already in tab 1
        return getHoursAgo(r.requestedAt) >= 24;
      });
      setOverdueItems(overdue);
    } catch (err: any) {
      console.error('Failed to load pending returns:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleApprove = async (id: string) => {
    if (!confirm('Approve this return? The room will become available again.')) return;
    try {
      setProcessing(id);
      await requestsAPI.approveReturn(id);
      await loadData();
    } catch (err: any) {
      alert('Failed to approve: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Reject this return request?')) return;
    try {
      setProcessing(id);
      await requestsAPI.rejectReturn(id);
      await loadData();
    } catch (err: any) {
      alert('Failed to reject: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // ── Filter by search ─────────────────────────────────────────────────────
  const filterRows = (rows: ReturnRequest[]) => {
    if (!searchTerm.trim()) return rows;
    const q = searchTerm.toLowerCase();
    return rows.filter(r =>
      r.userId?.fullName?.toLowerCase().includes(q) ||
      r.roomId?.name?.toLowerCase().includes(q)     ||
      r.roomId?.code?.toLowerCase().includes(q)     ||
      r.userId?.phone?.includes(q)                  ||
      r.userId?.email?.toLowerCase().includes(q)
    );
  };

  const filteredPending = filterRows(pendingReturns);
  const filteredOverdue = filterRows(overdueItems);

  // ── Loading / error states ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="pr-loading">
        <div className="pr-spinner" />
        <p>Loading pending returns…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pr-error-box">
        <Icons.Lock size={32} color="#ef4444" />
        <h3>Failed to load data</h3>
        <p>{error}</p>
        <button className="save-btn" onClick={loadData} style={{ width: 'auto', marginTop: '1rem' }}>
          Retry
        </button>
      </div>
    );
  }

  // ── UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="pr-page">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="pr-page-header">
        <div>
          <h1 className="section-title" style={{ marginBottom: '4px' }}>
            Pending Returns
          </h1>
          <p style={{ color: 'var(--muted-text)', fontSize: '14px', margin: 0 }}>
            Manage return approvals and follow up on overdue key holders
          </p>
        </div>

        <button
          onClick={loadData}
          className="pr-refresh-btn"
          title="Refresh"
        >
          <Icons.CheckCircle size={16} /> Refresh
        </button>
      </div>

      {/* ── Summary stat pills ──────────────────────────────────────────── */}
      <div className="pr-stat-row">
        <div className="pr-stat-pill orange">
          <span className="pr-stat-number">{pendingReturns.length}</span>
          <span className="pr-stat-label">Awaiting Approval</span>
        </div>
        <div className="pr-stat-pill red">
          <span className="pr-stat-number">{overdueItems.length}</span>
          <span className="pr-stat-label">Overdue (&gt;24 hrs)</span>
        </div>
        <div className="pr-stat-pill purple">
          <span className="pr-stat-number">
            {overdueItems.filter(r => getHoursAgo(r.requestedAt) >= 48).length}
          </span>
          <span className="pr-stat-label">Critical (&gt;48 hrs)</span>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="pr-tabs">
        <button
          className={`pr-tab ${activeTab === 'pending' ? 'pr-tab-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Icons.Clock size={16} />
          Return Requests
          {pendingReturns.length > 0 && (
            <span className="pr-tab-badge pr-tab-badge-orange">{pendingReturns.length}</span>
          )}
        </button>
        <button
          className={`pr-tab ${activeTab === 'overdue' ? 'pr-tab-active' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          <Icons.Bell size={16} />
          Overdue Keys
          {overdueItems.length > 0 && (
            <span className="pr-tab-badge pr-tab-badge-red">{overdueItems.length}</span>
          )}
        </button>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="pr-search-bar">
        <Icons.Users size={16} color="var(--muted-text)" />
        <input
          type="text"
          placeholder="Search by name, room, phone or email…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="pr-search-input"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="pr-search-clear">✕</button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1 — RETURN REQUESTS (user clicked "Return Key")
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <>
          {filteredPending.length === 0 ? (
            <div className="pr-empty">
              <Icons.CheckCircle size={52} color="var(--green-success)" />
              <h3>No pending return requests</h3>
              <p>Users will appear here when they request to return a key.</p>
            </div>
          ) : (
            <div className="pr-table-wrap">
              <table className="history-table pr-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Room</th>
                    <th>Items Carried</th>
                    <th>Key Taken</th>
                    <th>Return Requested</th>
                    <th>Time Held</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map(req => {
                    const hoursHeld = getHoursAgo(req.requestedAt);
                    const urgency   = getUrgency(hoursHeld);
                    const isPast24  = hoursHeld >= 24;
                    return (
                      <tr key={req._id} className={isPast24 ? 'pr-row-overdue' : ''}>
                        <td>
                          <div className="pr-member-cell">
                            <div className="pr-avatar">
                              {(req.userId?.fullName || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--soft-blue-dark)' }}>
                                {req.userId?.fullName || 'Unknown'}
                              </div>
                              {req.membership && req.membership !== 'No Membership' && (
                                <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                                  {req.membership}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px' }}>
                            {req.userId?.phone
                              ? <a href={`tel:${req.userId.phone}`} className="pr-contact-link">📞 {req.userId.phone}</a>
                              : <span style={{ color: 'var(--muted-text)' }}>No phone</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginTop: '2px' }}>
                            {req.userId?.email || '—'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{req.roomId?.name || '—'}</div>
                          <Badge variant="available">{req.roomId?.code || '—'}</Badge>
                        </td>
                        <td style={{ maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {req.carriedItems || <span style={{ color: 'var(--muted-text)' }}>None listed</span>}
                        </td>
                        <td style={{ fontSize: '13px' }}>{formatDateTime(req.requestedAt)}</td>
                        <td style={{ fontSize: '13px' }}>{formatDateTime(req.returnRequestedAt)}</td>
                        <td>
                          <span
                            className="pr-duration-badge"
                            style={{ background: urgency.bg, color: urgency.colour }}
                          >
                            {formatDuration(req.requestedAt)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleApprove(req._id)}
                              disabled={processing === req._id}
                              className="pr-approve-btn"
                            >
                              {processing === req._id ? '…' : '✓ Approve'}
                            </button>
                            <button
                              onClick={() => handleReject(req._id)}
                              disabled={processing === req._id}
                              className="pr-reject-btn"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2 — OVERDUE KEYS (approved > 24 hours, not yet returned)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overdue' && (
        <>
          {/* Warning banner */}
          {filteredOverdue.length > 0 && (
            <div className="pr-overdue-banner">
              <Icons.Bell size={18} color="#c2410c" />
              <span>
                <strong>{filteredOverdue.length} key{filteredOverdue.length > 1 ? 's have' : ' has'} been held for over 24 hours.</strong>
                {' '}Contact the holders immediately to confirm safety and schedule a return.
              </span>
            </div>
          )}

          {filteredOverdue.length === 0 ? (
            <div className="pr-empty">
              <Icons.CheckCircle size={52} color="var(--green-success)" />
              <h3>No overdue keys</h3>
              <p>All approved key requests are within the 24-hour window.</p>
            </div>
          ) : (
            <div className="pr-table-wrap">
              <table className="history-table pr-table">
                <thead>
                  <tr>
                    <th>Urgency</th>
                    <th>Member</th>
                    <th>Contact</th>
                    <th>Room</th>
                    <th>Items Carried</th>
                    <th>Key Taken At</th>
                    <th>Time Overdue</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverdue
                    .sort((a, b) => getHoursAgo(b.requestedAt) - getHoursAgo(a.requestedAt)) // most overdue first
                    .map(req => {
                      const hours   = getHoursAgo(req.requestedAt);
                      const urgency = getUrgency(hours);
                      return (
                        <tr key={req._id} className="pr-row-overdue">
                          <td>
                            <span
                              className="pr-urgency-badge"
                              style={{ background: urgency.bg, color: urgency.colour }}
                            >
                              {urgency.label}
                            </span>
                          </td>
                          <td>
                            <div className="pr-member-cell">
                              <div className="pr-avatar pr-avatar-red">
                                {(req.userId?.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--soft-blue-dark)' }}>
                                  {req.userId?.fullName || 'Unknown'}
                                </div>
                                {req.membership && req.membership !== 'No Membership' && (
                                  <div style={{ fontSize: '11px', color: 'var(--muted-text)' }}>
                                    {req.membership}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '13px' }}>
                              {req.userId?.phone
                                ? <a href={`tel:${req.userId.phone}`} className="pr-contact-link pr-contact-urgent">
                                    📞 {req.userId.phone}
                                  </a>
                                : <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '12px' }}>
                                    ⚠ No phone on file
                                  </span>}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginTop: '2px' }}>
                              {req.userId?.email
                                ? <a href={`mailto:${req.userId.email}`} className="pr-contact-link">
                                    ✉ {req.userId.email}
                                  </a>
                                : '—'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{req.roomId?.name || '—'}</div>
                            <Badge variant="available">{req.roomId?.code || '—'}</Badge>
                          </td>
                          <td style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {req.carriedItems || <span style={{ color: 'var(--muted-text)' }}>None listed</span>}
                          </td>
                          <td style={{ fontSize: '13px' }}>{formatDateTime(req.requestedAt)}</td>
                          <td>
                            <span
                              className="pr-duration-badge pr-duration-pulse"
                              style={{ background: urgency.bg, color: urgency.colour }}
                            >
                              {formatDuration(req.requestedAt)}
                            </span>
                          </td>
                          <td>
                            {/* Quick-dial or quick-email shortcut */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {req.userId?.phone && (
                                <a href={`tel:${req.userId.phone}`} className="pr-call-btn">
                                  📞 Call Now
                                </a>
                              )}
                              {req.userId?.email && (
                                <a
                                  href={`mailto:${req.userId.email}?subject=Key Return Required – ${req.roomId?.name}&body=Hi ${req.userId.fullName},%0A%0AYour key for ${req.roomId?.name} (${req.roomId?.code}) has been held for over 24 hours. Please arrange to return it immediately.%0A%0AThank you.`}
                                  className="pr-email-btn"
                                >
                                  ✉ Email
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PendingReturns;