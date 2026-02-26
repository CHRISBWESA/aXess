// src/pages/Requests.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from '../components/icons';
import Badge, { BadgeVariant } from '../components/ui/Badge';
import { requestsAPI, roomsAPI, authAPI } from '../lib/api';
import { Lock, MapPin, Navigation, X, Fingerprint, Check, LogOut, Clock, CheckCircle } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

// Backend URL for images
const BACKEND = 'http://localhost:5000';
const toFullUrl = (path?: string) => (path ? `${BACKEND}${path}` : '');

interface Room {
  _id: string;
  name: string;
  code: string;
  status: 'available' | 'occupied' | 'requested' | 'maintenance';
  floorLabel?: 'basement' | 'ground' | 'first' | 'second';
  direction?: string;
  directionImage?: string;
  coordinator?: string;
  capacity?: number | null;
  equipment?: string[];
  isPrivate?: boolean;
}

interface RequestHistory {
  _id: string;
  userId: { _id: string; fullName: string; phone?: string; };
  roomId: { _id: string; name: string; code: string; };
  requestedBy?: { _id: string; fullName: string; role?: string; };
  isAdminRequest?: boolean;
  carriedItems?: string;
  membership?: string;
  status: 'pending' | 'approved' | 'returned';
  returnApprovalStatus?: 'none' | 'pending_approval' | 'approved' | 'rejected';
  requestedAt: string;
  returnedAt?: string;
  returnRequestedAt?: string;
  createdAt: string;
}

const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
};

const computeDuration = (s?: string, e?: string) => {
  if (!s || !e) return '';
  const ms = new Date(e).getTime() - new Date(s).getTime();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
};

const floorOrder: Room['floorLabel'][] = ['basement', 'ground', 'first', 'second'];
const floorHeading = (l?: Room['floorLabel']) =>
  l === 'basement' ? 'Basement' : l === 'ground' ? 'Ground Floor' : l === 'first' ? 'First Floor' : l === 'second' ? 'Second Floor' : 'Floor';

const CAPACITY_BUCKETS = [
  { label: 'Any capacity', min: 0, max: Infinity },
  { label: '1 – 10 people', min: 1, max: 10 },
  { label: '11 – 30 people', min: 11, max: 30 },
  { label: '31 – 60 people', min: 31, max: 60 },
  { label: '61 – 100 people', min: 61, max: 100 },
  { label: '100+ people', min: 101, max: Infinity },
];

const Requests: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [carriedItems, setCarriedItems] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PER_PAGE = 5;

  // ═══════════════════════════════════════════════════════════════
  // ROLE-BASED ACCESS CONTROL
  // Check if current user is admin for privacy masking
  // ═══════════════════════════════════════════════════════════════
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsAdmin(user.role === 'admin');
        setCurrentUserId(user.id || user._id || '');
      }
    } catch (err) {
      console.error('Failed to parse current user:', err);
      setIsAdmin(false);
    }
  }, []);

  // Direction image state
  const [showDirection, setShowDirection] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fingerprint authentication state
  const [showFingerprintModal, setShowFingerprintModal] = useState(false);
  const [fingerprintEmail, setFingerprintEmail] = useState('');
  const [fingerprintLoading, setFingerprintLoading] = useState(false);
  const [fingerprintError, setFingerprintError] = useState('');
  const [fingerprintSuccess, setFingerprintSuccess] = useState(false);

  // ═══════════════════════════════════════════════════════════════
  // PRIVACY HELPER FUNCTION
  // Masks phone number for non-admin users viewing other users' data
  // ═══════════════════════════════════════════════════════════════
  const maskPhone = (phone: string | undefined, ownerId: string): string => {
    if (!phone) return '—';
    if (isAdmin) return phone; // Admins see everything
    if (ownerId === currentUserId) return phone; // Users see their own phone
    return '•••••••'; // Hide other users' phones
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFloor, setFilterFloor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCapacity, setFilterCapacity] = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rd, hd] = await Promise.all([roomsAPI.getAll(), requestsAPI.getAll()]);
      setRooms(rd);
      setHistory(hd);
    } catch (err: any) {
      alert('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openRoom = (room: Room) => {
    setSelectedRoom(room);
    setCarriedItems('');
    setPhoneNumber('');
    setShowDirection(false);
    setLightboxOpen(false);
    setFingerprintSuccess(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    setShowDirection(false);
    setLightboxOpen(false);
    setFingerprintSuccess(false);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // FINGERPRINT AUTHENTICATION FOR AUTO-FILL
  // ═══════════════════════════════════════════════════════════════════════
  const handleFingerprintAuth = () => {
    setShowFingerprintModal(true);
    setFingerprintEmail('');
    setFingerprintError('');
  };

  const closeFingerprintModal = () => {
    setShowFingerprintModal(false);
    setFingerprintEmail('');
    setFingerprintError('');
    setFingerprintLoading(false);
  };

  const authenticateWithFingerprint = async () => {
    if (!fingerprintEmail.trim()) {
      setFingerprintError('Please enter your email address');
      return;
    }

    setFingerprintLoading(true);
    setFingerprintError('');

    try {
      // Step 1: Get challenge from server
      const options = await authAPI.webauthnAuthStart(fingerprintEmail.trim());

      // Step 2: Trigger browser's fingerprint prompt
      const credential = await startAuthentication(options);

      // Step 3: Send credential to server for verification
      const result = await authAPI.webauthnAuthFinish(options.userId, credential);

      if (result.success && result.user) {
        // Auto-fill user details
        setPhoneNumber(result.user.phone || '');
        setFingerprintSuccess(true);
        
        // Store user data in localStorage for session
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        localStorage.setItem('authToken', result.token);

        // Show success message
        setTimeout(() => {
          closeFingerprintModal();
        }, 1500);
      }
    } catch (err: any) {
      console.error('Fingerprint auth error:', err);
      if (err.name === 'NotAllowedError') {
        setFingerprintError('Fingerprint authentication was cancelled or timed out.');
      } else if (err.name === 'NotSupportedError') {
        setFingerprintError('Fingerprint authentication is not supported on this device.');
      } else if (err.message?.includes('No fingerprint registered')) {
        setFingerprintError('No fingerprint registered for this email. Please register your fingerprint first or use manual entry.');
      } else {
        setFingerprintError(err.message || 'Fingerprint authentication failed. Please try again or use manual entry.');
      }
    } finally {
      setFingerprintLoading(false);
    }
  };

  const handleRequestKey = async (room: Room | null) => {
    if (!room || room.isPrivate || room.status !== 'available') return;
    
    const hasUnreturned = history.some(r => r.status === 'pending' || r.status === 'approved');
    if (hasUnreturned) {
      const u = history.find(r => r.status === 'pending' || r.status === 'approved');
      alert(`You have an unreturned room key!\n\nRoom: ${u?.roomId?.name} (${u?.roomId?.code})\nRequested: ${formatDateTime(u?.requestedAt)}\n\nPlease return it first.`);
      return;
    }
    
    if (!carriedItems.trim()) {
      alert('Please list the items you will bring.');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('Please provide a phone number.');
      return;
    }
    
    try {
      setSubmitting(true);
      const cu = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const isAdmin = cu.role === 'admin';
      await requestsAPI.create({
        roomId: room._id,
        carriedItems: carriedItems.trim(),
        phone: phoneNumber.trim(),
        membership: cu.membership || 'None',
        // If admin is making this request, flag it so the requester shows as "Admin (name)"
        ...(isAdmin ? { isAdminRequest: true, adminName: cu.fullName || cu.name || 'Admin' } : {}),
      });
      await loadData();
      closeModal();
      const label = isAdmin ? `Admin (${cu.fullName || cu.name || 'Admin'})` : (cu.fullName || cu.name || 'User');
      alert(`Request submitted by ${label} for ${room.name} (${room.code})\nStatus: Pending approval`);
    } catch (err: any) {
      alert('Failed to submit request: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async (id: string) => {
    if (!confirm('Request to sign out and return the room key?\n\nAn admin will need to approve your return.')) return;
    try {
      await requestsAPI.returnRequest(id);
      await loadData();
      alert('Sign-out request submitted!\n\nWaiting for admin approval to complete the return.');
    } catch (err: any) {
      alert('Failed to request sign-out: ' + err.message);
    }
  };

  const getBadgeVariant = (s: string): BadgeVariant =>
    ({ available: 'available', occupied: 'occupied', requested: 'requested', maintenance: 'maintenance' } as any)[s] || 'restricted';
  const getHistBadge = (s: string): BadgeVariant =>
    ({ pending: 'pending', approved: 'approved', returned: 'returned' } as any)[s] || 'pending';

  const allEquipmentTags = useMemo(() => {
    const t = new Set<string>();
    rooms.forEach(r => (r.equipment || []).forEach(e => t.add(e)));
    return [...t].sort();
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const bucket = CAPACITY_BUCKETS.find(b => b.label === filterCapacity);
    return rooms.filter(r => {
      if (q && !([r.name, r.code, r.coordinator || '', r.direction || ''].join(' ').toLowerCase().includes(q))) return false;
      if (filterFloor && (r.floorLabel ?? 'ground') !== filterFloor) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (bucket && bucket.min > 0) {
        const c = r.capacity ?? 0;
        if (c < bucket.min || c > bucket.max) return false;
      }
      if (filterEquipment && !(r.equipment ?? []).includes(filterEquipment)) return false;
      return true;
    });
  }, [rooms, searchQuery, filterFloor, filterStatus, filterCapacity, filterEquipment]);

  const groupedRooms = floorOrder.map(label => ({
    label,
    rooms: filteredRooms.filter(r => (r.floorLabel ?? 'ground') === label).sort((a, b) => a.name.localeCompare(b.name)),
  }));

  const hasActiveFilters = searchQuery || filterFloor || filterStatus || filterCapacity || filterEquipment;
  const clearFilters = () => {
    setSearchQuery('');
    setFilterFloor('');
    setFilterStatus('');
    setFilterCapacity('');
    setFilterEquipment('');
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading rooms...</div>;

  const unreturnedRequests = history.filter(r => r.status === 'pending' || r.status === 'approved');
  const hasUnreturnedRequest = unreturnedRequests.length > 0;
  const dirImgUrl = selectedRoom?.directionImage ? toFullUrl(selectedRoom.directionImage) : '';

  return (
    <>
      {/* Add pulse animation for pending approval buttons */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>

      <h1 className="section-title">Request Room Key</h1>

      {/* Unreturned warning */}
      {hasUnreturnedRequest && (
        <div style={{
          background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px',
          padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'start', gap: '12px'
        }}>
          <div style={{
            background: '#f59e0b', borderRadius: '50%', width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>!</span>
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px', color: '#92400e', fontSize: 16, fontWeight: 600 }}>
              Unreturned Room Key
            </h3>
            {unreturnedRequests.map(req => (
              <p key={req._id} style={{ margin: '4px 0', color: '#78350f', fontSize: 14, lineHeight: 1.5 }}>
                <strong>{req.roomId?.name}</strong> ({req.roomId?.code}) • Requested: {formatDateTime(req.requestedAt)} • Status: <strong>{req.status === 'pending' ? 'Pending' : 'Approved'}</strong>
              </p>
            ))}
            <p style={{ margin: '12px 0 0', color: '#92400e', fontSize: 14, fontWeight: 500 }}>
              
            </p>
          </div>
        </div>
      )}

      {/* Search + Filters */}
      <div style={{
        background: 'var(--white-glass)', border: '1px solid var(--glass-border)',
        borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', boxShadow: 'var(--shadow-soft)'
      }}>
        <div style={{ position: 'relative', marginBottom: '14px' }}>
          <Icons.Search size={16} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--muted-text)', pointerEvents: 'none'
          }} />
          <input
            type="text"
            placeholder="Search by room name, code, or coordinator…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
              borderRadius: 10, border: '1px solid var(--glass-border)', background: 'var(--surface)',
              color: 'var(--text)', fontSize: 14, boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            {
              val: filterFloor, set: setFilterFloor, ph: 'All Floors',
              opts: [['basement', 'Basement'], ['ground', 'Ground Floor'], ['first', 'First Floor'], ['second', 'Second Floor']]
            },
            {
              val: filterStatus, set: setFilterStatus, ph: 'All Statuses',
              opts: [['available', 'Available'], ['occupied', 'Occupied'], ['requested', 'Requested'], ['maintenance', 'Maintenance']]
            },
          ].map(({ val, set, ph, opts }) => (
            <select key={ph} value={val} onChange={e => set(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
              background: val ? '#ede9fe' : 'var(--surface)', color: val ? '#4f46e5' : 'var(--muted-text)',
              fontSize: 13, fontWeight: val ? 600 : 400, cursor: 'pointer'
            }}>
              <option value="">{ph}</option>
              {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
          <select value={filterCapacity} onChange={e => setFilterCapacity(e.target.value)} style={{
            padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
            background: filterCapacity ? '#ede9fe' : 'var(--surface)',
            color: filterCapacity ? '#4f46e5' : 'var(--muted-text)',
            fontSize: 13, fontWeight: filterCapacity ? 600 : 400, cursor: 'pointer'
          }}>
            <option value="">Any Capacity</option>
            {CAPACITY_BUCKETS.slice(1).map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
          </select>
          {allEquipmentTags.length > 0 && (
            <select value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)} style={{
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--glass-border)',
              background: filterEquipment ? '#ede9fe' : 'var(--surface)',
              color: filterEquipment ? '#4f46e5' : 'var(--muted-text)',
              fontSize: 13, fontWeight: filterEquipment ? 600 : 400, cursor: 'pointer'
            }}>
              <option value="">All Equipment</option>
              {allEquipmentTags.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{
              padding: '8px 14px', borderRadius: 8, border: '1px solid #fca5a5',
              background: '#fee2e2', color: '#991b1b', fontSize: 13, fontWeight: 600, cursor: 'pointer'
            }}>
              Clear Filters
            </button>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--muted-text)' }}>
            {filteredRooms.length} {filteredRooms.length === 1 ? 'room' : 'rooms'} found
          </span>
        </div>
      </div>

      {/* Room grid */}
      {filteredRooms.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted-text)' }}>
          {rooms.length === 0 ? 'No rooms available. Please contact administrator.' : 'No rooms match your search / filters.'}
        </div>
      ) : groupedRooms.map(group => {
        if (group.rooms.length === 0) return null;
        return (
          <section key={group.label} style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ margin: '0.5rem 0 0.75rem', fontSize: '1.1rem', color: 'var(--soft-blue-dark)' }}>
              {floorHeading(group.label)} ({group.rooms.length})
            </h2>
            <div className="request-grid">
              {group.rooms.map(room => (
                <div
                  key={room._id}
                  className={`request-card ${room.status} ${room.isPrivate ? 'private' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => openRoom(room)}
                  onKeyDown={e => { if (e.key === 'Enter') openRoom(room); }}
                  aria-label={`${room.name} ${room.code} – ${room.status}`}
                >
                  <div className="card-status" style={{ top: 10, right: 'auto', left: 10 }} onClick={e => e.stopPropagation()}>
                    <Badge variant={getBadgeVariant(room.status)}>
                      {room.status === 'available' ? 'Available' : room.status === 'occupied' ? 'Occupied' : room.status === 'requested' ? 'Requested' : 'Maintenance'}
                    </Badge>
                  </div>
                  {room.isPrivate && <div style={{ position: 'absolute', top: 10, right: 10 }}><Lock size={18} color="#991b1b" /></div>}
                  <div style={{ width: '100%', textAlign: 'center', marginTop: '0.6rem' }}>
                    <h3 className="room-name" style={{ margin: '0.6rem 0 0.2rem' }}>{room.name}</h3>
                    <p className="room-code" style={{ margin: 0 }}>{room.code}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* ── Room detail modal ── */}
      {isModalOpen && selectedRoom && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span>{selectedRoom.name}</span>
              <Badge variant={getBadgeVariant(selectedRoom.status)}>
                {selectedRoom.status === 'available' ? 'Available' : selectedRoom.status === 'occupied' ? 'Occupied' : selectedRoom.status === 'requested' ? 'Requested' : 'Maintenance'}
              </Badge>
            </h2>

            {/* Private banner */}
            {selectedRoom.isPrivate && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8,
                marginBottom: 16, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8
              }}>
                <Lock size={18} /> This room is private and only available to authorized members.
              </div>
            )}

            {/* Unreturned key banner */}
            {hasUnreturnedRequest && selectedRoom.status === 'available' && !selectedRoom.isPrivate && (
              <div style={{
                background: '#fef3c7', border: '2px solid #f59e0b', color: '#92400e',
                padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: 500
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    background: '#f59e0b', borderRadius: '50%', width: 20, height: 20,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>!</span>
                  </div>
                  <strong>Cannot Request — Unreturned Key</strong>
                </div>
                {unreturnedRequests.map(req => (
                  <div key={req._id} style={{ marginLeft: 28, fontSize: 14, marginTop: 4 }}>
                    You have <strong>{req.roomId?.name}</strong> ({req.roomId?.code}) unreturned. Please return it first.
                  </div>
                ))}
              </div>
            )}

            {/* Fingerprint success banner */}
            {fingerprintSuccess && (
              <div style={{
                background: '#d1fae5', border: '2px solid #10b981', color: '#065f46',
                padding: 12, borderRadius: 8, marginBottom: 16, fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 8
              }}>
                <Check size={18} />
                <span style={{ display:"flex", alignItems:"center", gap:6 }}><Check size={14} /> Fingerprint verified — details auto-filled!</span>
              </div>
            )}

            {/* Basic info */}
            <p style={{ color: 'var(--gray-neutral)', marginTop: 6 }}><strong>Room Code:</strong> {selectedRoom.code}</p>
            <p style={{ color: 'var(--gray-neutral)', marginTop: 6 }}><strong>Floor:</strong> {selectedRoom.floorLabel ? floorHeading(selectedRoom.floorLabel) : '—'}</p>

            {/* Location + Direction */}
            <div style={{ marginTop: 10, padding: '14px', background: '#f8fafc', borderRadius: 12, border: '1px solid var(--glass-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MapPin size={15} color="var(--soft-blue)" />
                <strong style={{ color: 'var(--soft-blue-dark)', fontSize: 14 }}>Location</strong>
              </div>
              <p style={{ margin: 0, color: 'var(--gray-neutral)', fontSize: 14, lineHeight: 1.6 }}>
                {selectedRoom.direction || '—'}
              </p>

              {dirImgUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDirection(prev => !prev);
                  }}
                  style={{
                    marginTop: 12, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px', borderRadius: 9, border: 'none',
                    background: showDirection ? 'linear-gradient(135deg,#4f46e5,#7c3aed)' : 'linear-gradient(135deg,#3b82f6,#4f46e5)',
                    color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 3px 10px rgba(79,70,229,0.35)', transition: 'all 0.2s ease',
                    letterSpacing: '0.02em'
                  }}
                >
                  <Navigation size={16} />
                  {showDirection ? '▲ Hide Direction' : '▼ Press to View the Direction'}
                </button>
              )}

              {showDirection && dirImgUrl && (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={dirImgUrl}
                    alt={`Route to ${selectedRoom.name}`}
                    style={{
                      width: '100%', maxHeight: 340, objectFit: 'contain', borderRadius: 10,
                      border: '1px solid var(--glass-border)', background: '#f1f5f9',
                      display: 'block', cursor: 'zoom-in'
                    }}
                    onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--muted-text)', textAlign: 'center' }}>
                    Follow the route above to reach <strong>{selectedRoom.name}</strong> · Click image to enlarge
                  </p>
                </div>
              )}
            </div>

            {selectedRoom.coordinator && (
              <p style={{ color: 'var(--gray-neutral)', marginTop: 10 }}><strong>Coordinator:</strong> {selectedRoom.coordinator}</p>
            )}
            {selectedRoom.capacity != null && (
              <p style={{ color: 'var(--gray-neutral)', marginTop: 6 }}><strong>Capacity:</strong> {selectedRoom.capacity} people</p>
            )}
            {selectedRoom.equipment && selectedRoom.equipment.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <strong style={{ color: 'var(--gray-neutral)', fontSize: 14 }}>Equipment / Facilities:</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {selectedRoom.equipment.map(t => (
                    <span key={t} style={{
                      padding: '4px 10px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                      background: 'rgba(79,70,229,0.1)', color: '#4f46e5', border: '1px solid rgba(79,70,229,0.2)'
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Items you will bring (required)
              </label>
              <textarea
                value={carriedItems}
                onChange={e => setCarriedItems(e.target.value)}
                placeholder="E.g. Laptop, phone, external HDD…"
                rows={3}
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)' }}
                disabled={submitting || selectedRoom.isPrivate || hasUnreturnedRequest}
              />
            </div>

            {/* Phone */}
            <div style={{ marginTop: 12 }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
                Phone Number (required)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="E.g. +255 123 456 789"
                style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)' }}
                disabled={submitting || selectedRoom.isPrivate || hasUnreturnedRequest}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20, flexWrap: 'wrap' }}>
              {/* Use Fingerprint button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleFingerprintAuth(); }}
                disabled={submitting || selectedRoom.isPrivate || hasUnreturnedRequest}
                style={{
                  padding: '10px 16px', borderRadius: 8, border: '1px solid #6366f1',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: (submitting || selectedRoom.isPrivate || hasUnreturnedRequest) ? 0.5 : 1,
                  transition: 'all 0.2s'
                }}
              >
                <Fingerprint size={16} />
                Use Fingerprint
              </button>

              <button className="cancel-btn" onClick={closeModal} disabled={submitting}>Close</button>
              
              <button
                className="save-btn"
                onClick={(e) => { e.stopPropagation(); handleRequestKey(selectedRoom); }}
                disabled={selectedRoom.status !== 'available' || submitting || selectedRoom.isPrivate || hasUnreturnedRequest}
                style={{
                  opacity: (selectedRoom.status === 'available' && !selectedRoom.isPrivate && !submitting && !hasUnreturnedRequest) ? 1 : 0.6,
                  cursor: (selectedRoom.status === 'available' && !selectedRoom.isPrivate && !submitting && !hasUnreturnedRequest) ? 'pointer' : 'not-allowed'
                }}
              >
                {selectedRoom.isPrivate ? 'Private Room' : hasUnreturnedRequest ? 'Return Key First' : submitting ? 'Submitting…' : 'Request Key'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fingerprint Authentication Modal ── */}
      {showFingerprintModal && (
        <div className="modal-overlay" onClick={closeFingerprintModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: '#ede9fe',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Fingerprint size={32} color="#6366f1" />
              </div>
              <h2 style={{ marginBottom: 8 }}>Use Fingerprint</h2>
              <p style={{ color: '#6b7280', marginBottom: 20, fontSize: 14 }}>
                Enter your email and use your fingerprint to auto-fill your details
              </p>

              {fingerprintError && (
                <div style={{
                  padding: 12, background: '#fee2e2', color: '#991b1b',
                  borderRadius: 8, marginBottom: 16, fontSize: 14
                }}>{fingerprintError}</div>
              )}

              {fingerprintSuccess && (
                <div style={{
                  padding: 12, background: '#d1fae5', color: '#065f46',
                  borderRadius: 8, marginBottom: 16, fontSize: 14, fontWeight: 500
                }}><span style={{ display:"flex", alignItems:"center", gap:6 }}><Check size={14} /> Fingerprint verified successfully!</span></div>
              )}

              <label style={{ display: 'block', textAlign: 'left', fontWeight: 600, marginBottom: 6 }}>
                Email Address
              </label>
              <input
                type="email"
                value={fingerprintEmail}
                onChange={e => setFingerprintEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={fingerprintLoading || fingerprintSuccess}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8,
                  border: '1px solid #d1d5db', marginBottom: 20
                }}
                onKeyDown={e => { if (e.key === 'Enter' && !fingerprintLoading) authenticateWithFingerprint(); }}
              />

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="cancel-btn"
                  onClick={closeFingerprintModal}
                  disabled={fingerprintLoading}
                  style={{ flex: 1 }}
                >Cancel</button>
                <button
                  className="save-btn"
                  onClick={authenticateWithFingerprint}
                  disabled={fingerprintLoading || fingerprintSuccess}
                  style={{
                    flex: 1,
                    opacity: (fingerprintLoading || fingerprintSuccess) ? 0.6 : 1
                  }}
                >
                  {fingerprintLoading ? 'Authenticating...' : 'Authenticate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Full-screen lightbox ── */}
      {lightboxOpen && dirImgUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: 'absolute', top: 16, right: 16, width: 36, height: 36,
              borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 10000
            }}
          >
            <X size={20} />
          </button>
          <img
            src={dirImgUrl}
            alt="Direction route (full screen)"
            style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── History Table ── */}
      <div className="history-section" style={{ marginTop: 32 }}>
        <h2 className="history-title">Your Request History</h2>
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Requester</th>
                <th>Phone</th>
                <th>Items</th>
                <th>Requested at</th>
                <th>Status</th>
                <th>Time Taken</th>
                <th>Returned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={9} className="empty-table">No request history yet</td>
                </tr>
              ) : (
                history.slice((historyPage - 1) * HISTORY_PER_PAGE, historyPage * HISTORY_PER_PAGE).map(req => (
                  <tr key={req._id}>
                    <td data-label="Room">{req.roomId?.name} ({req.roomId?.code || '—'})</td>
                    <td data-label="Requester">
                      <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', fontWeight:500 }}>
                        {req.userId?.fullName || 'Unknown'}
                        {req.isAdminRequest && req.requestedBy && (
                          <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'#ede9fe', color:'#5b21b6', borderRadius:6, padding:'2px 7px', fontSize:10, fontWeight:700 }}>
                            <Lock size={9} />
                            Admin ({req.requestedBy.fullName})
                          </span>
                        )}
                      </div>
                    </td>
                    <td data-label="Phone">{maskPhone(req.userId?.phone, req.userId?._id || '')}</td>
                    <td data-label="Items" style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {req.carriedItems || '—'}
                    </td>
                    <td data-label="Requested">{formatDateTime(req.requestedAt)}</td>
                    <td data-label="Status">
                      <Badge variant={getHistBadge(req.status)}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </Badge>
                    </td>
                    <td data-label="Duration">{computeDuration(req.requestedAt, req.returnedAt) || '—'}</td>
                    <td data-label="Returned">{formatDateTime(req.returnedAt) || '—'}</td>
                    <td data-label="Action">
                      {/* BLUE: Fully signed out (returned and approved) */}
                      {req.status === 'returned' && req.returnApprovalStatus === 'approved' && (
                        <button
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'default',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            opacity: 0.8
                          }}
                          disabled
                        >
                          <CheckCircle size={14} />
                          Signed Out
                        </button>
                      )}
                      
                      {/* ORANGE/GREEN: Waiting for admin approval (pulsing) */}
                      {req.returnApprovalStatus === 'pending_approval' && (
                        <button
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'default',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            animation: 'pulse 2s ease-in-out infinite'
                          }}
                          disabled
                        >
                          <Clock size={14} />
                          Pending Approval
                        </button>
                      )}
                      
                      {/* REJECTED: Show retry button */}
                      {req.returnApprovalStatus === 'rejected' && (req.status === 'pending' || req.status === 'approved') && (
                        <button
                          onClick={() => handleSignOut(req._id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: '1px solid #dc2626',
                            background: '#fef2f2',
                            color: '#dc2626',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <LogOut size={14} />
                          Retry Sign Out
                        </button>
                      )}
                      
                      {/* RED: User needs to sign out (initial state) */}
                      {(req.status === 'pending' || req.status === 'approved') && 
                       (req.returnApprovalStatus === 'none' || !req.returnApprovalStatus) && (
                        <button
                          onClick={() => handleSignOut(req._id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.4)';
                          }}
                          onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(239,68,68,0.3)';
                          }}
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {history.length > HISTORY_PER_PAGE && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 16, padding: '0 4px'
          }}>
            <span style={{ fontSize: 14, color: 'var(--muted-text)' }}>
              Showing {(historyPage - 1) * HISTORY_PER_PAGE + 1}–{Math.min(historyPage * HISTORY_PER_PAGE, history.length)} of {history.length} requests
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setHistoryPage(p => p - 1)}
                disabled={historyPage === 1}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: '1px solid var(--glass-border)',
                  background: historyPage === 1 ? 'var(--gray-light)' : 'var(--white-glass)',
                  color: historyPage === 1 ? 'var(--muted-text)' : 'var(--soft-blue-dark)',
                  fontWeight: 500, fontSize: 14,
                  cursor: historyPage === 1 ? 'not-allowed' : 'pointer',
                  opacity: historyPage === 1 ? 0.5 : 1
                }}
              >
                &larr; Previous
              </button>
              {Array.from({ length: Math.ceil(history.length / HISTORY_PER_PAGE) }, (_, i) => i + 1).map(pg => (
                <button
                  key={pg}
                  onClick={() => setHistoryPage(pg)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: '1px solid var(--glass-border)',
                    background: pg === historyPage ? 'var(--soft-blue)' : 'var(--white-glass)',
                    color: pg === historyPage ? 'white' : 'var(--soft-blue-dark)',
                    fontWeight: pg === historyPage ? 700 : 500, fontSize: 14, cursor: 'pointer'
                  }}
                >
                  {pg}
                </button>
              ))}
              <button
                onClick={() => setHistoryPage(p => p + 1)}
                disabled={historyPage === Math.ceil(history.length / HISTORY_PER_PAGE)}
                style={{
                  padding: '7px 16px', borderRadius: 8, border: '1px solid var(--glass-border)',
                  background: historyPage === Math.ceil(history.length / HISTORY_PER_PAGE) ? 'var(--gray-light)' : 'var(--white-glass)',
                  color: historyPage === Math.ceil(history.length / HISTORY_PER_PAGE) ? 'var(--muted-text)' : 'var(--soft-blue-dark)',
                  fontWeight: 500, fontSize: 14,
                  cursor: historyPage === Math.ceil(history.length / HISTORY_PER_PAGE) ? 'not-allowed' : 'pointer',
                  opacity: historyPage === Math.ceil(history.length / HISTORY_PER_PAGE) ? 0.5 : 1
                }}
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Requests;