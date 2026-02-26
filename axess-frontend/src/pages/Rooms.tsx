// src/pages/Rooms.tsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Icons } from '../components/icons';
import { roomsAPI } from '../lib/api';
import {
  Lock, Globe, MapPin, X, ImagePlus,
  Search, SlidersHorizontal, Building2, Users,
  Zap, ChevronDown, LayoutGrid, List, Navigation,
} from 'lucide-react';

const BACKEND = 'http://localhost:5000';

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

const EQUIPMENT_OPTIONS = [
  'Projector', 'Whiteboard', 'AC', 'WiFi', 'Smart Board',
  'TV Screen', 'Sound System', 'Desktop PCs', 'Printer',
  'Lab Equipment', 'Conference Phone', 'Webcam', 'Microphone', 'Lighting System',
];

const CAPACITY_OPTIONS: number[] = [
  ...Array.from({ length: 10 }, (_, i) => i + 1),
  ...Array.from({ length: 14 }, (_, i) => (i + 1) * 10 + 10),
];

const toFullUrl = (path?: string) => path ? `${BACKEND}${path}` : '';

const FLOOR_LABELS: Record<string, string> = {
  basement: 'Basement', ground: 'Ground Floor',
  first: 'First Floor', second: 'Second Floor',
};

const SC = {
  available:   { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0', dot: '#22c55e', lbl: 'Available' },
  occupied:    { bg: '#fee2e2', text: '#b91c1c', border: '#fecaca', dot: '#ef4444', lbl: 'Occupied' },
  requested:   { bg: '#fef3c7', text: '#92400e', border: '#fde68a', dot: '#f59e0b', lbl: 'Requested' },
  maintenance: { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb', dot: '#9ca3af', lbl: 'Maintenance' },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
const Rooms: React.FC = () => {
  const [rooms, setRooms]                 = useState<Room[]>([]);
  const [loading, setLoading]             = useState(true);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingRoom, setEditingRoom]     = useState<Room | null>(null);
  const [isEditing, setIsEditing]         = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAdmin, setIsAdmin]             = useState(false);
  const [lightboxSrc, setLightboxSrc]     = useState('');

  // ── Search / Filter ──
  const [query, setQuery]                 = useState('');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterFloor, setFilterFloor]     = useState('all');
  const [filterPrivacy, setFilterPrivacy] = useState('all');
  const [filterEquip, setFilterEquip]     = useState<string[]>([]);
  const [showPanel, setShowPanel]         = useState(false);
  const [viewMode, setViewMode]           = useState<'grid' | 'list'>('grid');

  // ── Form fields ──
  const [newName, setNewName]               = useState('');
  const [newCode, setNewCode]               = useState('');
  const [newStatus, setNewStatus]           = useState<Room['status']>('available');
  const [newFloor, setNewFloor]             = useState<Room['floorLabel'] | ''>('');
  const [newLocation, setNewLocation]       = useState('');
  const [newCoordinator, setNewCoordinator] = useState('');
  const [newCapacity, setNewCapacity]       = useState<number | ''>('');
  const [newEquipment, setNewEquipment]     = useState<string[]>([]);
  const [newIsPrivate, setNewIsPrivate]     = useState(false);
  const [existingImg, setExistingImg]       = useState('');
  const [imageFile, setImageFile]           = useState<File | null>(null);
  const [imagePreview, setImagePreview]     = useState('');

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const u = localStorage.getItem('currentUser');
      if (u) setIsAdmin(JSON.parse(u).role === 'admin');
    } catch {}
  }, []);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      setRooms(await roomsAPI.getAll());
    } catch (e: any) {
      alert('Failed to load rooms: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered list ──
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return rooms.filter(r => {
      if (q &&
        !r.name.toLowerCase().includes(q) &&
        !r.code.toLowerCase().includes(q) &&
        !(r.direction?.toLowerCase().includes(q)) &&
        !(r.coordinator?.toLowerCase().includes(q))) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterFloor !== 'all' && r.floorLabel !== filterFloor) return false;
      if (filterPrivacy === 'public' && r.isPrivate) return false;
      if (filterPrivacy === 'private' && !r.isPrivate) return false;
      if (filterEquip.length > 0 && !filterEquip.every(e => r.equipment?.includes(e))) return false;
      return true;
    });
  }, [rooms, query, filterStatus, filterFloor, filterPrivacy, filterEquip]);

  const stats = useMemo(() => ({
    total:       rooms.length,
    available:   rooms.filter(r => r.status === 'available').length,
    occupied:    rooms.filter(r => r.status === 'occupied').length,
    requested:   rooms.filter(r => r.status === 'requested').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
  }), [rooms]);

  const activeFilters = [
    filterStatus !== 'all', filterFloor !== 'all',
    filterPrivacy !== 'all', filterEquip.length > 0,
  ].filter(Boolean).length;

  const clearAll = () => {
    setQuery(''); setFilterStatus('all'); setFilterFloor('all');
    setFilterPrivacy('all'); setFilterEquip([]);
  };

  // ── Form helpers ──
  const resetForm = () => {
    setNewName(''); setNewCode(''); setNewStatus('available'); setNewFloor('');
    setNewLocation(''); setNewCoordinator(''); setNewCapacity('');
    setNewEquipment([]); setNewIsPrivate(false);
    setExistingImg(''); setImageFile(null); setImagePreview('');
  };
  const populateForm = (r: Room) => {
    setNewName(r.name); setNewCode(r.code); setNewStatus(r.status);
    setNewFloor(r.floorLabel ?? ''); setNewLocation(r.direction ?? '');
    setNewCoordinator(r.coordinator ?? ''); setNewCapacity(r.capacity ?? '');
    setNewEquipment(r.equipment ?? []); setNewIsPrivate(r.isPrivate ?? false);
    setExistingImg(r.directionImage ?? ''); setImageFile(null); setImagePreview('');
  };

  const openAdd  = () => { resetForm(); setEditingRoom(null); setIsEditing(true);  setIsModalOpen(true); };
  const openView = (r: Room) => { populateForm(r); setEditingRoom(r); setIsEditing(false); setIsModalOpen(true); };
  const openEdit = (r: Room) => { populateForm(r); setEditingRoom(r); setIsEditing(true);  setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setIsEditing(false); setEditingRoom(null); };

  const toggleEquip = (t: string) =>
    setNewEquipment(p => p.includes(t) ? p.filter(e => e !== t) : [...p, t]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { alert('Image files only'); return; }
    if (f.size > 10 * 1024 * 1024) { alert('Max 10 MB'); return; }
    setImageFile(f);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(f));
    e.target.value = '';
  };

  const removeImg = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null); setImagePreview(''); setExistingImg('');
  };

  const handleSave = async () => {
    if (!newName.trim() || !newCode.trim()) { alert('Name and code required'); return; }
    try {
      setActionLoading(true);
      const data: Record<string, any> = {
        name: newName.trim(), code: newCode.trim().toUpperCase(), status: newStatus,
        floorLabel: newFloor || undefined, direction: newLocation || undefined,
        coordinator: newCoordinator.trim() || undefined,
        capacity: newCapacity !== '' ? Number(newCapacity) : null,
        equipment: newEquipment, isPrivate: newIsPrivate,
      };
      if (editingRoom) {
        const up = await roomsAPI.update(editingRoom._id, data, imageFile ?? undefined);
        setRooms(p => p.map(r => r._id === editingRoom._id ? up : r));
      } else {
        const cr = await roomsAPI.create(data, imageFile ?? undefined);
        setRooms(p => [...p, cr]);
      }
      closeModal();
    } catch (e: any) { alert('Save failed: ' + e.message); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await roomsAPI.delete(id); setRooms(p => p.filter(r => r._id !== id)); }
    catch (e: any) { alert('Delete failed: ' + e.message); }
  };

  const previewSrc = imagePreview || toFullUrl(existingImg);

  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:14 }}>
      <div style={{ width:44, height:44, border:'4px solid #e2e8f0', borderTopColor:'#6366f1', borderRadius:'50%', animation:'rm-spin 0.8s linear infinite' }}/>
      <p style={{ color:'#64748b', fontWeight:500 }}>Loading rooms…</p>
      <style>{`@keyframes rm-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&family=DM+Mono:wght@400;500&display=swap');

        .rp { font-family:'DM Sans',system-ui,sans-serif; padding-bottom:32px; }

        /* ── PAGE HEADER ── */
        .rp-hdr { display:flex; align-items:flex-end; justify-content:space-between; margin-bottom:22px; gap:12px; flex-wrap:wrap; }
        .rp-title { font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-.03em; margin:0; line-height:1; }
        .rp-sub { font-size:13px; color:#94a3b8; margin:4px 0 0; font-weight:500; }
        .rp-add-btn {
          display:flex; align-items:center; gap:7px;
          background:linear-gradient(135deg,#6366f1,#4338ca);
          color:#fff; border:none; padding:11px 20px; border-radius:12px;
          font-size:14px; font-weight:700; cursor:pointer; font-family:inherit;
          box-shadow:0 4px 16px rgba(99,102,241,.4); transition:all .2s; white-space:nowrap;
        }
        .rp-add-btn:hover { transform:translateY(-1px); box-shadow:0 6px 22px rgba(99,102,241,.5); }

        /* ── STATS ── */
        .rp-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px; }
        .rp-stat { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:14px 16px; box-shadow:0 1px 4px rgba(0,0,0,.04); }
        .rp-stat-n { font-size:24px; font-weight:800; font-family:'DM Mono',monospace; line-height:1; margin-bottom:3px; }
        .rp-stat-l { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8; }

        /* ── TOOLBAR ── */
        .rp-toolbar {
          display:flex; align-items:center; gap:9px; flex-wrap:wrap;
          background:#fff; border:1px solid #e2e8f0; border-radius:14px;
          padding:11px 14px; margin-bottom:14px; box-shadow:0 1px 4px rgba(0,0,0,.04);
        }
        .rp-search-wrap { flex:1; min-width:180px; position:relative; }
        .rp-search {
          width:100%; padding:9px 12px 9px 36px;
          border:1.5px solid #e2e8f0; border-radius:10px;
          font-size:14px; font-family:inherit; background:#f8fafc;
          outline:none; transition:all .2s; color:#1e293b; box-sizing:border-box;
        }
        .rp-search:focus { border-color:#6366f1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,.08); }
        .rp-search::placeholder { color:#94a3b8; }
        .rp-search-ico { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:#94a3b8; pointer-events:none; display:flex; }

        .rp-sel {
          padding:9px 12px; border-radius:10px; border:1.5px solid #e2e8f0;
          background:#f8fafc; font-size:13px; font-weight:600; color:#475569;
          font-family:inherit; cursor:pointer; outline:none; transition:all .2s;
        }
        .rp-sel:focus { border-color:#6366f1; background:#fff; }

        .rp-fbtn {
          display:flex; align-items:center; gap:6px;
          padding:9px 13px; border-radius:10px; border:1.5px solid #e2e8f0;
          background:#f8fafc; font-size:13px; font-weight:600; color:#475569;
          cursor:pointer; font-family:inherit; transition:all .2s; white-space:nowrap;
        }
        .rp-fbtn:hover, .rp-fbtn.on { border-color:#6366f1; background:#eef2ff; color:#6366f1; }
        .rp-fbadge { background:#6366f1; color:#fff; border-radius:20px; width:17px; height:17px; font-size:10px; font-weight:800; display:flex; align-items:center; justify-content:center; }

        .rp-vtoggle { display:flex; gap:3px; background:#f1f5f9; border-radius:9px; padding:3px; }
        .rp-vbtn { width:31px; height:31px; border-radius:7px; border:none; background:transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#94a3b8; transition:all .15s; }
        .rp-vbtn.on { background:#fff; color:#6366f1; box-shadow:0 1px 4px rgba(0,0,0,.08); }

        /* ── FILTER PANEL ── */
        .rp-fpanel { background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:18px; margin-bottom:14px; box-shadow:0 4px 20px rgba(0,0,0,.06); animation:rp-fd .18s ease; }
        @keyframes rp-fd { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .rp-fg label { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#94a3b8; margin-bottom:5px; }
        .rp-fg select { width:100%; padding:8px 10px; border-radius:8px; border:1.5px solid #e2e8f0; background:#f8fafc; font-size:13px; font-family:inherit; color:#1e293b; outline:none; cursor:pointer; }
        .rp-fg select:focus { border-color:#6366f1; background:#fff; }

        .rp-ewrap { display:flex; flex-wrap:wrap; gap:5px; }
        .rp-echip { padding:4px 10px; border-radius:20px; border:1.5px solid #e2e8f0; background:#f8fafc; font-size:12px; font-weight:600; color:#64748b; cursor:pointer; transition:all .15s; font-family:inherit; }
        .rp-echip:hover { border-color:#6366f1; color:#6366f1; background:#eef2ff; }
        .rp-echip.on { border-color:#6366f1; background:#6366f1; color:#fff; }

        /* ── RESULTS BAR ── */
        .rp-results { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px; }
        .rp-rcount { font-size:13px; font-weight:600; color:#64748b; }
        .rp-rcount strong { color:#1e293b; }
        .rp-clear { font-size:12px; font-weight:600; color:#6366f1; background:#eef2ff; border:none; border-radius:8px; padding:5px 10px; cursor:pointer; font-family:inherit; transition:background .15s; }
        .rp-clear:hover { background:#e0e7ff; }

        /* ── GRID ── */
        .rp-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(215px,1fr)); gap:13px; }

        .rp-card {
          background:#fff; border-radius:18px; padding:18px 15px 14px;
          border:1.5px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,.04);
          transition:all .22s cubic-bezier(.34,1.56,.64,1);
          position:relative; overflow:hidden; display:flex; flex-direction:column; gap:9px;
        }
        .rp-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:3px;
          background:linear-gradient(90deg,#6366f1,#818cf8); opacity:0; transition:opacity .2s;
        }
        .rp-card:hover { transform:translateY(-4px); box-shadow:0 14px 36px rgba(99,102,241,.16); border-color:#a5b4fc; }
        .rp-card:hover::before { opacity:1; }
        .rp-card.clickable { cursor:pointer; }
        .rp-card-name { font-size:14px; font-weight:800; color:#1e293b; line-height:1.3; }
        .rp-card-code { font-family:'DM Mono',monospace; font-size:11px; font-weight:500; color:#94a3b8; letter-spacing:.04em; }

        /* Lock badge */
        .rp-lock { position:absolute; top:10px; right:10px; display:flex; align-items:center; gap:3px; background:#fee2e2; color:#b91c1c; padding:2px 7px; border-radius:6px; font-size:10px; font-weight:700; }

        /* Status badge */
        .rp-sbadge { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; border-radius:8px; font-size:11px; font-weight:700; }
        .rp-sdot { width:6px; height:6px; border-radius:50%; display:inline-block; flex-shrink:0; }

        /* Pills */
        .rp-pills { display:flex; gap:5px; flex-wrap:wrap; }
        .rp-pill { display:inline-flex; align-items:center; gap:3px; background:#f1f5f9; color:#475569; border-radius:6px; padding:2px 8px; font-size:10px; font-weight:600; }

        /* Location row */
        .rp-loc { display:flex; align-items:flex-start; gap:5px; }
        .rp-loc-txt { font-size:11px; color:#374151; line-height:1.4; flex:1; }

        /* Equipment dots */
        .rp-edots { display:flex; flex-wrap:wrap; gap:4px; }
        .rp-edot { padding:2px 7px; border-radius:5px; font-size:10px; font-weight:600; background:#f1f5f9; color:#64748b; }

        /* Card actions */
        .rp-cactions { display:flex; gap:6px; margin-top:auto; }
        .rp-abtn { flex:1; display:flex; align-items:center; justify-content:center; gap:4px; padding:7px; border-radius:9px; border:none; font-size:12px; font-weight:600; cursor:pointer; font-family:inherit; transition:all .15s; }
        .rp-edit { background:#eef2ff; color:#6366f1; }
        .rp-edit:hover { background:#e0e7ff; }
        .rp-del { background:#fff1f2; color:#e11d48; }
        .rp-del:hover { background:#ffe4e6; }

        /* ── LIST VIEW ── */
        .rp-list { display:flex; flex-direction:column; gap:8px; }
        .rp-li {
          background:#fff; border-radius:13px; padding:13px 16px;
          border:1.5px solid #e2e8f0;
          display:flex; align-items:center; gap:12px;
          transition:all .18s; box-shadow:0 1px 4px rgba(0,0,0,.03);
        }
        .rp-li:hover { border-color:#a5b4fc; box-shadow:0 4px 16px rgba(99,102,241,.1); }
        .rp-li.clickable { cursor:pointer; }
        .rp-li-ico { width:44px; height:44px; border-radius:11px; flex-shrink:0; background:linear-gradient(135deg,#eef2ff,#e0e7ff); display:flex; align-items:center; justify-content:center; color:#6366f1; }
        .rp-li-main { flex:1; min-width:0; }
        .rp-li-name { font-size:14px; font-weight:700; color:#1e293b; }
        .rp-li-sub { font-size:11px; color:#94a3b8; margin-top:2px; font-family:'DM Mono',monospace; }
        .rp-li-loc { font-size:11px; color:#374151; margin-top:4px; display:flex; align-items:flex-start; gap:4px; line-height:1.4; }
        .rp-li-right { display:flex; gap:8px; align-items:center; flex-shrink:0; flex-wrap:wrap; justify-content:flex-end; }
        .rp-li-acts { display:flex; gap:5px; flex-shrink:0; }
        .rp-li-btn { width:32px; height:32px; border-radius:8px; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all .15s; }

        /* ── EMPTY ── */
        .rp-empty { text-align:center; padding:56px 20px; background:#fff; border-radius:18px; border:2px dashed #e2e8f0; }
        .rp-empty-ico { width:60px; height:60px; background:#f1f5f9; border-radius:14px; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:#94a3b8; }

        /* ── MODAL OVERLAY ── */
        .rp-overlay { position:fixed; inset:0; z-index:1000; background:rgba(15,23,42,.6); backdrop-filter:blur(5px); display:flex; align-items:center; justify-content:center; padding:16px; animation:rp-oin .18s ease; }
        @keyframes rp-oin { from{opacity:0} to{opacity:1} }
        .rp-modal { background:#fff; border-radius:20px; padding:28px; width:100%; max-width:560px; max-height:93vh; overflow-y:auto; box-shadow:0 24px 64px rgba(0,0,0,.18); animation:rp-min .22s cubic-bezier(.34,1.56,.64,1); }
        @keyframes rp-min { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .rp-modal h2 { font-size:19px; font-weight:800; color:#0f172a; margin:0 0 22px; font-family:inherit; }
        .rp-lbl { display:block; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#64748b; margin-bottom:16px; }
        .rp-lbl input, .rp-lbl select { display:block; width:100%; margin-top:5px; padding:10px 12px; border-radius:10px; border:1.5px solid #e2e8f0; background:#f8fafc; font-size:14px; font-family:inherit; color:#1e293b; outline:none; transition:all .2s; box-sizing:border-box; }
        .rp-lbl input:focus, .rp-lbl select:focus { border-color:#6366f1; background:#fff; box-shadow:0 0 0 3px rgba(99,102,241,.08); }
        .rp-lbl input[readonly] { background:#f1f5f9; color:#64748b; cursor:default; }

        /* Location display card inside modal */
        .rp-loccard { display:flex; align-items:flex-start; gap:10px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:11px 14px; margin-bottom:16px; }
        .rp-loccard-lbl { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#15803d; margin-bottom:3px; }
        .rp-loccard-val { font-size:13px; color:#166534; font-weight:500; line-height:1.45; }

        .rp-sec-lbl { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:#64748b; display:flex; align-items:center; gap:6px; margin-bottom:7px; }
        .rp-modal-btns { display:flex; gap:10px; margin-top:20px; padding-top:16px; border-top:1px solid #f1f5f9; }
        .rp-save { flex:1; padding:11px; border-radius:10px; border:none; background:linear-gradient(135deg,#6366f1,#4338ca); color:#fff; font-size:14px; font-weight:700; cursor:pointer; font-family:inherit; transition:all .18s; }
        .rp-save:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(99,102,241,.35); }
        .rp-save:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .rp-cancel { padding:11px 20px; border-radius:10px; background:#f1f5f9; color:#64748b; border:none; font-size:14px; font-weight:600; cursor:pointer; font-family:inherit; transition:background .18s; }
        .rp-cancel:hover { background:#e2e8f0; }

        /* Lightbox */
        .rp-lb { position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,.9); display:flex; align-items:center; justify-content:center; padding:20px; animation:rp-oin .18s ease; cursor:zoom-out; }
        .rp-lb img { max-width:92vw; max-height:88vh; border-radius:12px; object-fit:contain; box-shadow:0 24px 80px rgba(0,0,0,.6); cursor:default; }
        .rp-lb-x { position:absolute; top:16px; right:16px; width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.15); border:none; color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; }

        @media(max-width:680px){
          .rp-stats { grid-template-columns:repeat(2,1fr); }
          .rp-grid { grid-template-columns:repeat(2,1fr); }
          .rp-toolbar { gap:7px; }
          .rp-sel { display:none; }
        }
      `}</style>

      {isAdmin && (
        <input ref={fileRef} type="file" accept="image/*"
          style={{ display:'none', position:'fixed', top:-9999, left:-9999 }}
          onChange={handleFile}
        />
      )}

      <div className="rp">

        {/* ══ PAGE HEADER ══ */}
        <div className="rp-hdr">
          <div>
            <h1 className="rp-title">Rooms</h1>
            <p className="rp-sub">{rooms.length} rooms · {stats.available} available right now</p>
          </div>
          {isAdmin && (
            <button className="rp-add-btn" onClick={openAdd}>
              <Icons.Plus size={16}/> Add Room
            </button>
          )}
        </div>

        {/* ══ STAT CARDS ══ */}
        <div className="rp-stats">
          {[
            { n: stats.total,       l: 'Total',       c: '#6366f1' },
            { n: stats.available,   l: 'Available',   c: '#22c55e' },
            { n: stats.occupied,    l: 'Occupied',    c: '#ef4444' },
            { n: stats.maintenance, l: 'Maintenance', c: '#f59e0b' },
          ].map(s => (
            <div className="rp-stat" key={s.l}>
              <div className="rp-stat-n" style={{ color: s.c }}>{s.n}</div>
              <div className="rp-stat-l">{s.l}</div>
            </div>
          ))}
        </div>

        {/* ══ TOOLBAR ══ */}
        <div className="rp-toolbar">
          <div className="rp-search-wrap">
            <span className="rp-search-ico"><Search size={14}/></span>
            <input className="rp-search"
              placeholder="Search by name, code, location…"
              value={query} onChange={e => setQuery(e.target.value)}
            />
          </div>

          <select className="rp-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="requested">Requested</option>
            <option value="maintenance">Maintenance</option>
          </select>

          <select className="rp-sel" value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
            <option value="all">All Floors</option>
            <option value="basement">Basement</option>
            <option value="ground">Ground Floor</option>
            <option value="first">First Floor</option>
            <option value="second">Second Floor</option>
          </select>

          <button className={`rp-fbtn ${showPanel || activeFilters > 0 ? 'on' : ''}`}
            onClick={() => setShowPanel(p => !p)}>
            <SlidersHorizontal size={14}/>
            More Filters
            {activeFilters > 0 && <span className="rp-fbadge">{activeFilters}</span>}
            <ChevronDown size={12} style={{ transform: showPanel ? 'rotate(180deg)' : 'none', transition:'.2s' }}/>
          </button>

          <div className="rp-vtoggle">
            <button className={`rp-vbtn ${viewMode==='grid'?'on':''}`} onClick={() => setViewMode('grid')} title="Grid"><LayoutGrid size={14}/></button>
            <button className={`rp-vbtn ${viewMode==='list'?'on':''}`} onClick={() => setViewMode('list')} title="List"><List size={14}/></button>
          </div>
        </div>

        {/* ══ FILTER PANEL ══ */}
        {showPanel && (
          <div className="rp-fpanel">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:14 }}>
              <div className="rp-fg">
                <label>Privacy</label>
                <select value={filterPrivacy} onChange={e => setFilterPrivacy(e.target.value)}>
                  <option value="all">All Rooms</option>
                  <option value="public">Public Only</option>
                  <option value="private">Private Only</option>
                </select>
              </div>
            </div>
            <div className="rp-sec-lbl" style={{ marginBottom:8 }}><Zap size={12}/> Must have equipment</div>
            <div className="rp-ewrap" style={{ marginBottom:14 }}>
              {EQUIPMENT_OPTIONS.map(t => (
                <button key={t}
                  className={`rp-echip ${filterEquip.includes(t)?'on':''}`}
                  onClick={() => setFilterEquip(p => p.includes(t) ? p.filter(e => e!==t) : [...p,t])}
                >{t}</button>
              ))}
            </div>
            {activeFilters > 0 && <button className="rp-clear" onClick={clearAll}>✕ Clear all filters</button>}
          </div>
        )}

        {/* ══ RESULTS BAR ══ */}
        <div className="rp-results">
          <p className="rp-rcount">
            Showing <strong>{filtered.length}</strong> of <strong>{rooms.length}</strong> rooms
            {query && <> for &ldquo;<strong>{query}</strong>&rdquo;</>}
          </p>
          {(activeFilters > 0 || query) && (
            <button className="rp-clear" onClick={clearAll}>✕ Clear</button>
          )}
        </div>

        {/* ══ ROOM DISPLAY ══ */}
        {filtered.length === 0 ? (
          <div className="rp-empty">
            <div className="rp-empty-ico"><Building2 size={26}/></div>
            <p style={{ fontWeight:700, color:'#1e293b', fontSize:15, marginBottom:6 }}>No rooms found</p>
            <p style={{ color:'#94a3b8', fontSize:13, marginBottom:14 }}>Try adjusting your search or filters</p>
            <button className="rp-clear" style={{ fontSize:13 }} onClick={clearAll}>Clear all filters</button>
          </div>
        ) : viewMode === 'grid' ? (

          /* ── GRID VIEW ── */
          <div className="rp-grid">
            {filtered.map(room => {
              const s = SC[room.status as keyof typeof SC] || SC.available;
              return (
                <div key={room._id}
                  className={`rp-card ${isAdmin ? 'clickable' : ''}`}
                  onClick={isAdmin ? () => openView(room) : undefined}
                >
                  {room.isPrivate && (
                    <div className="rp-lock"><Lock size={9}/> Private</div>
                  )}

                  {/* Status */}
                  <span className="rp-sbadge" style={{ background:s.bg, color:s.text, border:`1px solid ${s.border}` }}>
                    <span className="rp-sdot" style={{ background:s.dot }}/>
                    {s.lbl}
                  </span>

                  {/* Name + Code */}
                  <div>
                    <div className="rp-card-name">{room.name}</div>
                    <div className="rp-card-code">{room.code}</div>
                  </div>

                  {/* Floor + Capacity pills */}
                  <div className="rp-pills">
                    {room.floorLabel && (
                      <span className="rp-pill"><Building2 size={9}/> {FLOOR_LABELS[room.floorLabel]}</span>
                    )}
                    {room.capacity != null && (
                      <span className="rp-pill"><Users size={9}/> {room.capacity} people</span>
                    )}
                  </div>

                  {/* ── LOCATION — always visible ── */}
                  {room.direction && (
                    <div className="rp-loc">
                      <MapPin size={11} color="#16a34a" style={{ flexShrink:0, marginTop:1 }}/>
                      <span className="rp-loc-txt">{room.direction}</span>
                    </div>
                  )}

                  {/* Equipment tags */}
                  {room.equipment && room.equipment.length > 0 && (
                    <div className="rp-edots">
                      {room.equipment.slice(0, 3).map(e => (
                        <span key={e} className="rp-edot">{e}</span>
                      ))}
                      {room.equipment.length > 3 && (
                        <span className="rp-edot">+{room.equipment.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Admin actions */}
                  {isAdmin && (
                    <div className="rp-cactions" onClick={e => e.stopPropagation()}>
                      <button className="rp-abtn rp-edit" onClick={() => openEdit(room)}>
                        <Icons.Edit size={13}/> Edit
                      </button>
                      <button className="rp-abtn rp-del" onClick={() => handleDelete(room._id, room.name)}>
                        <Icons.Trash size={13}/> Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        ) : (

          /* ── LIST VIEW ── */
          <div className="rp-list">
            {filtered.map(room => {
              const s = SC[room.status as keyof typeof SC] || SC.available;
              return (
                <div key={room._id}
                  className={`rp-li ${isAdmin ? 'clickable' : ''}`}
                  onClick={isAdmin ? () => openView(room) : undefined}
                >
                  <div className="rp-li-ico"><Building2 size={20}/></div>
                  <div className="rp-li-main">
                    <div className="rp-li-name">
                      {room.name}
                      {room.isPrivate && <Lock size={11} color="#b91c1c" style={{ marginLeft:6, verticalAlign:'middle' }}/>}
                    </div>
                    <div className="rp-li-sub">
                      {room.code}
                      {room.floorLabel ? ` · ${FLOOR_LABELS[room.floorLabel]}` : ''}
                      {room.capacity != null ? ` · ${room.capacity} people` : ''}
                    </div>
                    {/* ── LOCATION — always visible in list ── */}
                    {room.direction && (
                      <div className="rp-li-loc">
                        <MapPin size={10} color="#16a34a" style={{ flexShrink:0, marginTop:1 }}/>
                        {room.direction}
                      </div>
                    )}
                  </div>
                  <div className="rp-li-right">
                    {room.equipment && room.equipment.length > 0 && (
                      <span style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:3 }}>
                        <Zap size={10}/> {room.equipment.length}
                      </span>
                    )}
                    <span className="rp-sbadge" style={{ background:s.bg, color:s.text, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
                      <span className="rp-sdot" style={{ background:s.dot }}/>
                      {s.lbl}
                    </span>
                  </div>
                  {isAdmin && (
                    <div className="rp-li-acts" onClick={e => e.stopPropagation()}>
                      <button className="rp-li-btn" style={{ background:'#eef2ff', color:'#6366f1' }} onClick={() => openEdit(room)}>
                        <Icons.Edit size={14}/>
                      </button>
                      <button className="rp-li-btn" style={{ background:'#fff1f2', color:'#e11d48' }} onClick={() => handleDelete(room._id, room.name)}>
                        <Icons.Trash size={14}/>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════ MODAL ════════════ */}
      {isAdmin && isModalOpen && (
        <div className="rp-overlay" onClick={closeModal}>
          <div className="rp-modal" onClick={e => e.stopPropagation()}>
            <h2>
              {editingRoom ? (isEditing ? '✏️ Edit Room' : '🏢 Room Details') : '➕ Add New Room'}
            </h2>

            <label className="rp-lbl">Room Name *
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. DataScience Hub" readOnly={!isEditing}/>
            </label>

            <label className="rp-lbl">Room Code *
              <input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="e.g. C-108" readOnly={!isEditing}/>
            </label>

            <label className="rp-lbl">Status
              <select value={newStatus} onChange={e => setNewStatus(e.target.value as Room['status'])} disabled={!isEditing}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="requested">Requested</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </label>

            <label className="rp-lbl">Floor
              <select value={newFloor} onChange={e => setNewFloor(e.target.value as Room['floorLabel'] | '')} disabled={!isEditing}>
                <option value="">Select floor</option>
                <option value="basement">Basement</option>
                <option value="ground">Ground Floor</option>
                <option value="first">First Floor</option>
                <option value="second">Second Floor</option>
              </select>
            </label>

            {/* ── LOCATION: editable input OR green display card ── */}
            {isEditing ? (
              <label className="rp-lbl">Location Description
                <input value={newLocation} onChange={e => setNewLocation(e.target.value)}
                  placeholder="e.g. South Wing – Ground Floor – Corner C, near stairwell"/>
              </label>
            ) : (
              <div style={{ marginBottom:16 }}>
                <div className="rp-sec-lbl" style={{ marginBottom:8 }}><MapPin size={12}/> Location</div>
                {newLocation ? (
                  <div className="rp-loccard">
                    <MapPin size={16} color="#16a34a" style={{ flexShrink:0, marginTop:2 }}/>
                    <div>
                      <div className="rp-loccard-lbl">Where to find this room</div>
                      <div className="rp-loccard-val">{newLocation}</div>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize:13, color:'#94a3b8', marginBottom:0 }}>No location set for this room.</p>
                )}
              </div>
            )}

            {/* Direction image */}
            <div style={{ marginBottom:18 }}>
              <div className="rp-sec-lbl"><Navigation size={12}/> Direction Route Image</div>
              {previewSrc ? (
                <div style={{ position:'relative' }}>
                  <img src={previewSrc} alt="Route"
                    onClick={() => setLightboxSrc(previewSrc)}
                    style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:12, border:'2px solid #e2e8f0', cursor:'zoom-in', display:'block' }}
                  />
                  {isEditing && (
                    <div style={{ display:'flex', gap:8, marginTop:8 }}>
                      <button onClick={e => { e.stopPropagation(); removeImg(); }}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1px solid #fecaca', background:'#fff1f2', color:'#e11d48', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        <X size={12}/> Remove
                      </button>
                      <button onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:8, border:'1px solid #e2e8f0', background:'#f8fafc', color:'#475569', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        <ImagePlus size={12}/> Change
                      </button>
                    </div>
                  )}
                </div>
              ) : isEditing ? (
                <div onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}
                  style={{ border:'2px dashed #e2e8f0', borderRadius:12, padding:'26px 20px', textAlign:'center', cursor:'pointer', background:'#f8fafc', transition:'all .2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#6366f1'; (e.currentTarget as HTMLDivElement).style.background='#eef2ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#e2e8f0'; (e.currentTarget as HTMLDivElement).style.background='#f8fafc'; }}
                >
                  <ImagePlus size={30} color="#6366f1" style={{ marginBottom:8 }}/>
                  <p style={{ margin:0, fontWeight:600, color:'#475569', fontSize:13 }}>Click to upload direction image</p>
                  <p style={{ margin:'4px 0 0', fontSize:11, color:'#94a3b8' }}>JPG · PNG · GIF · WEBP — max 10 MB</p>
                </div>
              ) : (
                <p style={{ fontSize:13, color:'#94a3b8', margin:0 }}>No direction image uploaded.</p>
              )}
            </div>

            <label className="rp-lbl">Room Coordinator
              <input value={newCoordinator} onChange={e => setNewCoordinator(e.target.value)} placeholder="e.g. Dr. Amina Hassan" readOnly={!isEditing}/>
            </label>

            <label className="rp-lbl">Capacity
              <select value={newCapacity}
                onChange={e => setNewCapacity(e.target.value === '' ? '' : Number(e.target.value))}
                disabled={!isEditing}>
                <option value="">Select capacity</option>
                {CAPACITY_OPTIONS.map(n => <option key={n} value={n}>{n} {n===1?'person':'people'}</option>)}
              </select>
            </label>

            {/* Equipment tags */}
            <div style={{ marginBottom:18 }}>
              <div className="rp-sec-lbl"><Zap size={12}/> Equipment / Facilities</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:11, border:'1.5px solid #e2e8f0', borderRadius:10, background: isEditing ? '#fff' : '#f8fafc' }}>
                {EQUIPMENT_OPTIONS.map(tag => {
                  const sel = newEquipment.includes(tag);
                  return (
                    <button key={tag} type="button"
                      onClick={e => { e.stopPropagation(); if (isEditing) toggleEquip(tag); }}
                      disabled={!isEditing}
                      style={{ padding:'4px 11px', borderRadius:20, fontSize:12, fontWeight:600, cursor: isEditing?'pointer':'default', border: sel?'2px solid #6366f1':'1.5px solid #e2e8f0', background: sel?'#eef2ff':'#f8fafc', color: sel?'#6366f1':'#64748b', transition:'all .15s', fontFamily:'inherit' }}
                    >
                      {sel && '✓ '}{tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility */}
            <label className="rp-lbl">Room Visibility
              <select value={newIsPrivate ? 'private' : 'public'}
                onChange={e => setNewIsPrivate(e.target.value === 'private')}
                disabled={!isEditing}>
                <option value="public">Public — anyone can request the key</option>
                <option value="private">Private — authorized members only</option>
              </select>
            </label>

            {!isEditing && editingRoom && (
              <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:8 }}>
                {editingRoom.isPrivate
                  ? <><Lock size={13} color="#b91c1c"/><span style={{ color:'#b91c1c', fontWeight:700 }}>Private Room</span></>
                  : <><Globe size={13} color="#16a34a"/><span style={{ color:'#16a34a', fontWeight:700 }}>Public Room</span></>
                }
              </div>
            )}

            <div className="rp-modal-btns">
              <button className="rp-cancel" onClick={closeModal} disabled={actionLoading}>Close</button>
              {isEditing
                ? <button className="rp-save" onClick={handleSave} disabled={actionLoading}>
                    {actionLoading ? 'Saving…' : 'Save Room'}
                  </button>
                : <button className="rp-save" onClick={() => setIsEditing(true)}>✏️ Edit</button>
              }
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="rp-lb" onClick={() => setLightboxSrc('')}>
          <button className="rp-lb-x" onClick={() => setLightboxSrc('')}>✕</button>
          <img src={lightboxSrc} alt="Direction route" onClick={e => e.stopPropagation()}/>
        </div>
      )}
    </>
  );
};

export default Rooms;