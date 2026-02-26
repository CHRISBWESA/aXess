// src/components/layout/Header.tsx
// ONLY CHANGE: Added `onMenuClick` prop and hamburger button for mobile.
// All other logic is identical to the original.
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../icons';
import { requestsAPI } from '../../lib/api';

// ─── Role display map ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  admin:     'Admin',
  innovator: 'Innovator',
  user:      'User',
  member:    'Member',
  guard:     'Guard',
  leader:    'Leader',
};

const formatRole = (raw: string): string => {
  if (!raw) return 'User';
  return (
    ROLE_LABELS[raw.toLowerCase()] ??
    raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
  );
};

const ROLE_COLOURS: Record<string, string> = {
  Admin:     'linear-gradient(135deg,#6366f1,#4f46e5)',
  Innovator: 'linear-gradient(135deg,#10b981,#059669)',
  User:      'linear-gradient(135deg,#64748b,#475569)',
  Member:    'linear-gradient(135deg,#f59e0b,#d97706)',
  Guard:     'linear-gradient(135deg,#ef4444,#dc2626)',
  Leader:    'linear-gradient(135deg,#8b5cf6,#7c3aed)',
};

const ROLE_BORDER: Record<string, string> = {
  Admin:     '#6366f1',
  Innovator: '#10b981',
  User:      '#64748b',
  Member:    '#f59e0b',
  Guard:     '#ef4444',
  Leader:    '#8b5cf6',
};

const PROFILE_PIC_KEY = 'userProfilePic';

interface NotifItem {
  _id: string;
  type: 'return_request' | 'overdue';
  userName: string;
  roomName: string;
  roomCode: string;
  timeAgo: string;
  hoursHeld: number;
  urgency: 'pending' | 'overdue' | 'high' | 'critical';
}

const getHoursAgo = (iso?: string) =>
  iso ? (Date.now() - new Date(iso).getTime()) / 3_600_000 : 0;

const formatTimeAgo = (iso?: string): string => {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60)  return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const urgencyOf = (hours: number): NotifItem['urgency'] => {
  if (hours >= 72) return 'critical';
  if (hours >= 48) return 'high';
  if (hours >= 24) return 'overdue';
  return 'pending';
};

const URGENCY_COLOUR: Record<NotifItem['urgency'], { dot: string; bg: string; text: string }> = {
  pending:  { dot: '#f59e0b', bg: '#fffbeb', text: '#92400e' },
  overdue:  { dot: '#ea580c', bg: '#fff7ed', text: '#9a3412' },
  high:     { dot: '#dc2626', bg: '#fef2f2', text: '#991b1b' },
  critical: { dot: '#7f1d1d', bg: '#fee2e2', text: '#7f1d1d' },
};

// ─── Bell Icon ────────────────────────────────────────────────────────────────
const BellIcon: React.FC<{ count: number; onClick: () => void; hasNew: boolean }> = ({ count, onClick, hasNew }) => (
  <>
    <style>{`
      @keyframes bell-swing {
        0%,100%{ transform: rotate(0deg); }
        15%    { transform: rotate(18deg); }
        30%    { transform: rotate(-16deg); }
        45%    { transform: rotate(12deg); }
        60%    { transform: rotate(-8deg); }
        75%    { transform: rotate(4deg); }
      }
      @keyframes badge-pop {
        0%  { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.25); opacity: 1; }
        100%{ transform: scale(1);   opacity: 1; }
      }
      @keyframes ripple-out {
        0%   { transform: scale(0.9); opacity: 0.7; }
        100% { transform: scale(2.2); opacity: 0; }
      }
    `}</style>
    <button
      onClick={onClick}
      title="Pending return notifications"
      style={{
        position: 'relative',
        width: 40, height: 40,
        borderRadius: '12px',
        border: hasNew ? '1.5px solid #fbbf24' : '1.5px solid #e2e8f0',
        background: hasNew ? '#fffbeb' : '#f8fafc',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.2s, background 0.2s, box-shadow 0.2s',
        boxShadow: hasNew ? '0 0 0 0 #fbbf2455' : 'none',
        flexShrink: 0,
      }}
    >
      {hasNew && (
        <span style={{
          position: 'absolute', inset: 0,
          borderRadius: '12px',
          border: '2px solid #fbbf24',
          animation: 'ripple-out 1.6s ease-out infinite',
          pointerEvents: 'none',
        }} />
      )}
      <span style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: hasNew ? 'bell-swing 1.2s ease 0.3s 3' : 'none',
        transformOrigin: 'top center',
        color: hasNew ? '#d97706' : '#64748b',
      }}>
        <Icons.Bell size={18} />
      </span>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -5, right: -5,
          minWidth: 18, height: 18,
          background: '#ef4444',
          color: '#fff',
          borderRadius: '9px',
          fontSize: '10px',
          fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px',
          border: '2px solid #fff',
          animation: 'badge-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          lineHeight: 1,
        }}>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  </>
);

// ─── Notification dropdown ─────────────────────────────────────────────────
const NotifDropdown: React.FC<{
  items: NotifItem[];
  loading: boolean;
  onClose: () => void;
  onGoToPage: () => void;
}> = ({ items, loading, onClose, onGoToPage }) => {
  const total = items.length;
  return (
    <div className="notif-dropdown">
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid #f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Icons.Bell size={16} color="#d97706" />
          <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
            Pending Returns
          </span>
          {total > 0 && (
            <span style={{
              background: '#ef4444', color: '#fff',
              borderRadius: '20px', padding: '1px 8px',
              fontSize: '11px', fontWeight: 700,
            }}>
              {total}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px', lineHeight: 1, padding: '2px 4px' }}
        >
          ✕
        </button>
      </div>

      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>Loading…</div>
        ) : total === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '14px' }}>All clear!</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>No pending returns right now</div>
          </div>
        ) : (
          items.map((item, i) => {
            const uc = URGENCY_COLOUR[item.urgency];
            return (
              <div
                key={item._id + i}
                style={{
                  padding: '12px 18px',
                  borderBottom: i < items.length - 1 ? '1px solid #f8fafc' : 'none',
                  background: i % 2 === 0 ? '#fff' : '#fafafa',
                  cursor: 'pointer',
                }}
                onClick={() => { onGoToPage(); onClose(); }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: uc.dot, marginTop: 4, flexShrink: 0, boxShadow: `0 0 0 3px ${uc.dot}33` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'inline-block', background: uc.bg, color: uc.text, borderRadius: '6px', padding: '1px 7px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '4px' }}>
                      {item.type === 'return_request' ? 'Return Request' : `Overdue · ${item.urgency.toUpperCase()}`}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.userName}<span style={{ color: '#94a3b8', fontWeight: 400 }}> · </span>{item.roomName}
                      <span style={{ marginLeft: 6, background: '#eff6ff', color: '#3b82f6', borderRadius: '6px', padding: '0 6px', fontSize: '11px', fontWeight: 600 }}>{item.roomCode}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                      {item.type === 'return_request' ? `Requested return ${item.timeAgo}` : `Key held for ${item.timeAgo.replace(' ago', '')}`}
                    </div>
                  </div>
                  <span style={{ color: '#cbd5e1', fontSize: '14px', alignSelf: 'center' }}>›</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {total > 0 && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 18px' }}>
          <button
            onClick={() => { onGoToPage(); onClose(); }}
            style={{
              width: '100%', padding: '10px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', border: 'none', borderRadius: '10px',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <Icons.Clock size={14} />
            View All in Pending Returns →
          </button>
        </div>
      )}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN HEADER
// ═════════════════════════════════════════════════════════════════════════════
interface HeaderProps {
  role?: string;
  onMenuClick?: () => void; // ← NEW: triggers mobile sidebar open
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const [firstName,       setFirstName]       = useState('');
  const [fullName,        setFullName]        = useState('');
  const [email,           setEmail]           = useState('');
  const [membership,      setMembership]      = useState('');
  const [userRole,        setUserRole]        = useState('');
  const [isAdmin,         setIsAdmin]         = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [adminName,       setAdminName]       = useState('');
  const [profilePic,      setProfilePic]      = useState('');
  const [dropdownOpen,    setDropdownOpen]    = useState(false);
  const [lightboxOpen,    setLightboxOpen]    = useState(false);
  const [uploading,       setUploading]       = useState(false);
  const [notifOpen,       setNotifOpen]       = useState(false);
  const [notifItems,      setNotifItems]      = useState<NotifItem[]>([]);
  const [notifLoading,    setNotifLoading]    = useState(false);
  const [hasNew,          setHasNew]          = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef  = useRef<HTMLDivElement>(null);
  const notifRef     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readUser = () => {
      try {
        const stored        = localStorage.getItem('currentUser');
        const impersonating = localStorage.getItem('impersonating') === 'true';
        const savedPic      = localStorage.getItem(PROFILE_PIC_KEY) || '';
        setProfilePic(savedPic);
        if (stored) {
          const u = JSON.parse(stored);
          const first = (u.fullName || '').trim().split(' ')[0] || 'User';
          setFirstName(first);
          setFullName(u.fullName || '');
          setEmail(u.email || '');
          setMembership(u.membership || '');
          setIsImpersonating(impersonating);
          const role = formatRole(u.role || 'user');
          setUserRole(role);
          setIsAdmin(u.role === 'admin');
          if (impersonating && u.impersonatedBy) setAdminName(u.impersonatedBy);
        }
      } catch {}
    };
    readUser();
    window.addEventListener('storage', readUser);
    return () => window.removeEventListener('storage', readUser);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setNotifLoading(true);
      const [pending, all] = await Promise.all([
        requestsAPI.getPendingReturns(),
        requestsAPI.getAllRequests(),
      ]);
      const items: NotifItem[] = [];
      for (const r of pending as any[]) {
        const hours = getHoursAgo(r.requestedAt);
        items.push({ _id: r._id, type: 'return_request', userName: r.userId?.fullName || 'Unknown', roomName: r.roomId?.name || 'Unknown Room', roomCode: r.roomId?.code || '—', timeAgo: formatTimeAgo(r.returnRequestedAt || r.requestedAt), hoursHeld: hours, urgency: urgencyOf(hours) });
      }
      const pendingIds = new Set((pending as any[]).map((r: any) => r._id));
      for (const r of all as any[]) {
        if (r.status !== 'approved') continue;
        if (r.returnApprovalStatus === 'pending_approval') continue;
        if (pendingIds.has(r._id)) continue;
        const hours = getHoursAgo(r.requestedAt);
        if (hours < 24) continue;
        items.push({ _id: r._id, type: 'overdue', userName: r.userId?.fullName || 'Unknown', roomName: r.roomId?.name || 'Unknown Room', roomCode: r.roomId?.code || '—', timeAgo: formatTimeAgo(r.requestedAt), hoursHeld: hours, urgency: urgencyOf(hours) });
      }
      items.sort((a, b) => b.hoursHeld - a.hoursHeld);
      const prevCount = notifItems.length;
      setNotifItems(items);
      if (items.length > 0 && items.length >= prevCount) {
        setHasNew(true);
        setTimeout(() => setHasNew(false), 5000);
      }
    } catch { } finally {
      setNotifLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchNotifications();
    const t = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(t);
  }, [isAdmin, fetchNotifications]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Please select an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)    { alert('Image must be smaller than 5 MB.'); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfilePic(dataUrl);
      localStorage.setItem(PROFILE_PIC_KEY, dataUrl);
      setUploading(false);
      setDropdownOpen(false);
    };
    reader.onerror = () => { alert('Failed to read image.'); setUploading(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePic = () => {
    if (!confirm('Remove profile picture?')) return;
    setProfilePic('');
    localStorage.removeItem(PROFILE_PIC_KEY);
    setDropdownOpen(false);
  };

  const handleExitUserMode = () => {
    if (confirm('Exit user mode and return to admin account?')) {
      localStorage.removeItem('impersonating');
      localStorage.removeItem('originalAdmin');
      alert('Logging out... Please log in again as admin.');
      window.location.href = '/login';
    }
  };

  const initials    = fullName ? fullName.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : firstName.charAt(0).toUpperCase();
  const roleBg      = ROLE_COLOURS[userRole] || ROLE_COLOURS.User;
  const roleBorder  = ROLE_BORDER[userRole]  || ROLE_BORDER.User;
  const membershipLabel = membership && membership !== 'None' && membership !== 'No Membership' ? membership : 'No Club Membership';

  if (!userRole) return null;

  const actionBtnStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'none', border: 'none', borderRadius: '10px',
    cursor: 'pointer', fontSize: '14px', fontWeight: 500,
    color: '#1e293b', transition: 'background 0.15s', textAlign: 'left',
  };

  const iconWrapStyle: React.CSSProperties = {
    width: 32, height: 32, borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  };

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" style={{ display: 'none' }} onChange={handleFileChange} />

      <header className="header" style={{ position: 'relative', zIndex: 100 }}>

        {/* ── LEFT: Hamburger (mobile) + Role badge ── */}
        <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="header-hamburger"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div
            className="role-badge"
            title={`Role: ${userRole}`}
            style={{
              background: roleBg, color: '#fff', border: 'none',
              padding: '6px 16px', borderRadius: '20px',
              fontWeight: 700, fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '7px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)', letterSpacing: '0.02em',
            }}
          >
            <span aria-hidden style={{ display: 'flex', alignItems: 'center' }}>
              <Icons.Users size={15} />
            </span>
            <span>{userRole}</span>
          </div>
        </div>

        {/* ── CENTRE: clock + date (hidden on small mobile) ── */}
        <div className="header-clock" style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '6px 16px', borderRadius: '12px',
          background: 'var(--white-glass)', border: '1px solid var(--glass-border)',
          boxShadow: 'var(--shadow-soft)', fontVariantNumeric: 'tabular-nums',
        }}>
          <Icons.Clock size={16} style={{ color: 'var(--soft-blue)', flexShrink: 0 }} />
          <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--soft-blue-dark)', letterSpacing: '0.04em', minWidth: '72px' }}>
            {timeStr}
          </span>
          <span style={{ width: '1px', height: '20px', background: 'var(--glass-border)', display: 'block' }} />
          <Icons.Calendar size={16} style={{ color: 'var(--soft-blue)', flexShrink: 0 }} />
          <span className="header-date" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--muted-text)', whiteSpace: 'nowrap' }}>
            {dateStr}
          </span>
        </div>

        {/* ── RIGHT: bell + welcome + avatar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>

          {isAdmin && (
            <div ref={notifRef} style={{ position: 'relative' }}>
              <BellIcon
                count={notifItems.length}
                hasNew={hasNew || notifItems.length > 0}
                onClick={() => { setNotifOpen(prev => !prev); if (!notifOpen) fetchNotifications(); }}
              />
              {notifOpen && (
                <NotifDropdown
                  items={notifItems}
                  loading={notifLoading}
                  onClose={() => setNotifOpen(false)}
                  onGoToPage={() => navigate('/pending-returns')}
                />
              )}
            </div>
          )}

          <div ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
            <div className="header-welcome" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Welcome, <span style={{ color: 'var(--soft-blue-dark)' }}>{firstName}</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted-text)', marginTop: '1px' }}>{userRole}</div>
            </div>

            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              title="Profile options"
              style={{
                width: 44, height: 44, borderRadius: '50%',
                border: `3px solid ${roleBorder}`,
                overflow: 'hidden', cursor: 'pointer', padding: 0, flexShrink: 0,
                background: profilePic ? 'transparent' : roleBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 2px 10px ${roleBorder}55`,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              {profilePic ? (
                <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px', userSelect: 'none', lineHeight: 1 }}>{initials}</span>
              )}
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute', top: '54px', right: 0,
                width: '288px', background: '#fff', borderRadius: '18px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18)', border: '1px solid #e2e8f0',
                zIndex: 9999, overflow: 'hidden', animation: 'fadeSlideIn 0.18s ease',
              }}>
                <div style={{ background: roleBg, padding: '22px 16px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <div
                    onClick={() => profilePic && setLightboxOpen(true)}
                    style={{
                      width: 82, height: 82, borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,0.85)', overflow: 'hidden',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: profilePic ? 'zoom-in' : 'default',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.2)', flexShrink: 0,
                    }}
                  >
                    {profilePic ? (
                      <img src={profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: '30px', userSelect: 'none' }}>{initials}</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.3 }}>{fullName || firstName}</div>
                    {email && <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '3px' }}>{email}</div>}
                    <div style={{ marginTop: '8px', display: 'inline-block', background: 'rgba(255,255,255,0.25)', color: '#fff', fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '12px', letterSpacing: '0.04em' }}>
                      {userRole}
                    </div>
                  </div>
                </div>

                <div style={{ padding: '8px' }}>
                  <button onClick={() => { setDropdownOpen(false); setTimeout(() => fileInputRef.current?.click(), 50); }} disabled={uploading} style={actionBtnStyle} onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <span style={{ ...iconWrapStyle, background: '#e0f2fe' }}><Icons.Edit size={15} color="#0284c7" /></span>
                    {uploading ? 'Uploading…' : profilePic ? 'Change Profile Photo' : 'Upload Profile Photo'}
                  </button>
                  {profilePic && (
                    <>
                      <button onClick={() => { setDropdownOpen(false); setLightboxOpen(true); }} style={actionBtnStyle} onMouseEnter={e => (e.currentTarget.style.background = '#f1f5f9')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <span style={{ ...iconWrapStyle, background: '#f0fdf4' }}><Icons.CheckCircle size={15} color="#16a34a" /></span>
                        View Full Photo
                      </button>
                      <button onClick={handleRemovePic} style={{ ...actionBtnStyle, color: '#dc2626' }} onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                        <span style={{ ...iconWrapStyle, background: '#fee2e2' }}><Icons.Trash size={15} color="#dc2626" /></span>
                        Remove Photo
                      </button>
                    </>
                  )}
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', padding: '10px 16px', fontSize: '12px', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icons.Users size={13} /> {membershipLabel}
                </div>
              </div>
            )}
          </div>
        </div>

        {isImpersonating && (
          <button
            onClick={handleExitUserMode}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              background: '#ef4444', color: 'white', border: 'none',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
          >
            🔓 Exit User Mode
          </button>
        )}
      </header>

      {lightboxOpen && profilePic && (
        <div onClick={() => setLightboxOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', animation: 'fadeIn 0.2s ease' }}>
          <button onClick={() => setLightboxOpen(false)} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>✕</button>
          <img src={profilePic} alt="Profile full size" onClick={e => e.stopPropagation()} style={{ maxWidth: '88vw', maxHeight: '88vh', borderRadius: '18px', boxShadow: '0 24px 80px rgba(0,0,0,0.6)', objectFit: 'contain', cursor: 'default' }} />
          <div style={{ position: 'absolute', bottom: 24, color: 'rgba(255,255,255,0.6)', fontSize: '13px', textAlign: 'center' }}>{fullName || firstName} · {userRole}</div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default Header;