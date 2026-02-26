// src/pages/Home.tsx
// Beautiful guest landing page for aXess
// ─ Shows all rooms from /api/rooms (view-only for guests)
// ─ Location always visible on each card
// ─ Search + filter by status, floor, privacy
// ─ Room detail modal with location + equipment
// ─ Splash → Home flow (App.tsx handles this)

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiLogIn, FiSearch, FiArrowRight, FiLock,
  FiMapPin, FiX, FiAlertCircle, FiGrid,
  FiUsers, FiCheckCircle, FiFilter, FiChevronDown,
  FiZap, FiInfo, FiHome, FiMail, FiStar, FiChevronRight,
} from 'react-icons/fi';
import { HiOutlineAcademicCap } from 'react-icons/hi';
import { MdMeetingRoom } from 'react-icons/md';
import { TbBuildingEstate } from 'react-icons/tb';

// ─── types ───────────────────────────────────────────────────────────────────
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

const FLOOR_LABEL: Record<string, string> = {
  basement: 'Basement',
  ground:   'Ground Floor',
  first:    'First Floor',
  second:   'Second Floor',
};

const SC: Record<string, { bg: string; color: string; dot: string; border: string }> = {
  available:   { bg: '#dcfce7', color: '#15803d', dot: '#22c55e', border: '#bbf7d0' },
  occupied:    { bg: '#fee2e2', color: '#b91c1c', dot: '#ef4444', border: '#fecaca' },
  requested:   { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', border: '#fde68a' },
  maintenance: { bg: '#f3f4f6', color: '#6b7280', dot: '#9ca3af', border: '#e5e7eb' },
};

// ─── Streaming text hook ─────────────────────────────────────────────────────
function useStreamingText(fullText: string, speed = 140, pauseAfterDone = 2200) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const charIdx = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    charIdx.current = 0;
    setDisplayed('');
    setDone(false);

    const tick = () => {
      charIdx.current += 1;
      const next = fullText.slice(0, charIdx.current);
      setDisplayed(next);

      if (charIdx.current < fullText.length) {
        // Natural jitter: spaces get a tiny pause, random ±40ms variation
        const char = fullText[charIdx.current - 1];
        const jitter = Math.random() * 80 - 40;          // –40ms to +40ms
        const spaceDelay = char === ' ' ? 60 : 0;        // extra pause on spaces
        const next_delay = Math.max(60, speed + jitter + spaceDelay);
        timerRef.current = setTimeout(tick, next_delay);
      } else {
        setDone(true);
        timerRef.current = setTimeout(() => {
          charIdx.current = 0;
          setDisplayed('');
          setDone(false);
          timerRef.current = setTimeout(tick, speed);
        }, pauseAfterDone);
      }
    };

    timerRef.current = setTimeout(tick, speed);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [fullText, speed, pauseAfterDone]);

  return { displayed, done };
}

// ─── Feature step data ────────────────────────────────────────────────────────
interface FeatureStep {
  id: number;
  title: string;
  shortDesc: string;
  color: string;
  bgClass: string;
  icon: React.ReactNode;
  steps: { heading: string; points: string[] }[];
}

const FEATURE_STEPS: FeatureStep[] = [
  {
    id: 1,
    title: 'Browse Rooms',
    shortDesc: 'View all campus rooms with real-time status, location, equipment, and floor details.',
    color: '#2563eb',
    bgClass: 'blue',
    icon: null,
    steps: [
      {
        heading: 'Discover and plan — no login needed',
        points: [
          'Open the aXess website or app — no account required for this step.',
          'See the complete list of campus rooms: lecture halls, computer labs, innovation spaces, staff offices, study rooms, meeting rooms, and more.',
          'For every room you get: real-time availability (Available / Occupied / Requested / Under Maintenance), room name and unique code, exact floor and building location.',
          'Direction guide + route map image — click "Press to view the direction" to see the exact path to any room.',
          'Full list of equipment & facilities: projector, whiteboard, air conditioning, seating capacity, Wi-Fi, power sockets, etc.',
          'Short description of what the room is mainly used for.',
        ],
      },
    ],
  },
  {
    id: 2,
    title: 'Request Access',
    shortDesc: 'Log in and submit a key request for any available room in just a few clicks.',
    color: '#7c3aed',
    bgClass: 'violet',
    icon: null,
    steps: [
      {
        heading: 'Ask for the key — only takes seconds (members & approved users only)',
        points: [
          'Log in to your aXess account.',
          'Choose any room that shows as Available.',
          'Click the "Request Key" button.',
          'Fill in two short fields: Carried items (list what you\'re bringing, e.g. laptop, notebook, water bottle) and your Phone number so admin can reach you if needed.',
          'Submit your request — it immediately changes to Pending.',
          'An administrator or room coordinator reviews it (usually very quickly).',
          'You will be notified when it is Approved or Rejected with a reason.',
          'Once approved → go collect the key from the office/security point.',
        ],
      },
    ],
  },
  {
    id: 3,
    title: 'Sign Out When Done',
    shortDesc: 'Return the key through the system — the room is immediately available for others.',
    color: '#16a34a',
    bgClass: 'green',
    icon: null,
    steps: [
      {
        heading: 'Return the key responsibly — help others use the room',
        points: [
          'Open aXess and go to your Request History.',
          'Find the approved request you are currently using.',
          'Click "Request Return" or "Sign Out" and submit the return request.',
          'The return request goes to Pending Approval.',
          'Admin or coordinator checks (physically or through the system) that the room is left in good condition and the key is returned.',
          'After approval: the room status changes back to Available immediately, the key is marked as returned, and your request history is updated with return time & status.',
          'This final step ensures rooms are not blocked forever and the next person can use them without delay.',
        ],
      },
    ],
  },
];


const Home: React.FC = () => {
  const navigate = useNavigate();

  const [scrolled, setScrolled]         = useState(false);
  const [rooms, setRooms]               = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [previewRoom, setPreviewRoom]   = useState<Room | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMenu = () => setMobileMenuOpen(false);
  const [showImageModal, setShowImageModal] = useState(false); // NEW: For viewing direction image
  const [activeFeature, setActiveFeature] = useState<FeatureStep | null>(null);

  // Streaming text for welcome heading
  const { displayed: heroText, done: heroDone } = useStreamingText('Welcome to Campus aXessHub', 140, 2200);

  // Search + filter
  const [query, setQuery]             = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFloor, setFilterFloor]   = useState('all');
  const [showFilters, setShowFilters]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    fetch('/api/rooms')
      .then(r => r.json())
      .then(d => setRooms(Array.isArray(d) ? d : []))
      .catch(() => setRooms([]))
      .finally(() => setLoadingRooms(false));
  }, []);

  // ── filtered rooms ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    
    // Define floor order for sorting
    const floorOrder: Record<string, number> = {
      'basement': 1,
      'ground': 2,
      'first': 3,
      'second': 4,
    };
    
    return rooms
      .filter(r => {
        if (q && !r.name.toLowerCase().includes(q) &&
                 !r.code.toLowerCase().includes(q) &&
                 !(r.direction?.toLowerCase().includes(q))) return false;
        if (filterStatus !== 'all' && r.status !== filterStatus) return false;
        if (filterFloor  !== 'all' && r.floorLabel !== filterFloor) return false;
        return true;
      })
      .sort((a, b) => {
        // Sort by floor: basement → ground → first → second
        const floorA = floorOrder[a.floorLabel || ''] || 999;
        const floorB = floorOrder[b.floorLabel || ''] || 999;
        if (floorA !== floorB) return floorA - floorB;
        
        // Then sort by name alphabetically
        return a.name.localeCompare(b.name);
      });
  }, [rooms, query, filterStatus, filterFloor]);

  const stats = useMemo(() => ({
    available:   rooms.filter(r => r.status === 'available').length,
    occupied:    rooms.filter(r => r.status === 'occupied').length,
    total:       rooms.length,
    private:     rooms.filter(r => r.isPrivate).length,
  }), [rooms]);

  const activeFilters = [filterStatus !== 'all', filterFloor !== 'all', !!query].filter(Boolean).length;

  const goLogin  = () => { setPreviewRoom(null); navigate('/login'); };
  const clearAll = () => { setQuery(''); setFilterStatus('all'); setFilterFloor('all'); };

  return (
    <>
      {/* ══════════════════════ STYLES ══════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { font-family: 'DM Sans', sans-serif; background: #f8faff; color: #0f172a; overflow-x: hidden; }

        /* ── GUEST BANNER ── */
        .hm-gb {
          position: fixed; top: 0; left: 0; right: 0; z-index: 500;
          background: linear-gradient(90deg, #4338ca, #6366f1, #818cf8);
          color: #fff; font-size: 12.5px; font-weight: 600;
          padding: 7px 16px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .hm-gb a {
          color: #c7d2fe; text-decoration: underline; cursor: pointer;
          transition: color .15s; margin-left: 2px;
        }
        .hm-gb a:hover { color: #fff; }

        /* ── NAVBAR ── */
        .hm-nav {
          position: fixed; top: 33px; left: 0; right: 0; z-index: 400;
          padding: 10px 20px; display: flex; justify-content: center;
        }
        .hm-nav-in {
          width: 100%; max-width: 1100px;
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(226,232,240,.8);
          border-radius: 60px;
          padding: 8px 8px 8px 22px;
          display: flex; align-items: center; gap: 4px;
          box-shadow: 0 4px 28px rgba(99,102,241,.1);
          backdrop-filter: blur(12px);
          transition: box-shadow .3s, border-color .3s;
        }
        .hm-nav-in.sc { box-shadow: 0 8px 40px rgba(99,102,241,.18); border-color: rgba(165,180,252,.4); }
        .hm-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; flex-shrink: 0; }
        .hm-logo-ico {
          width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 16px; box-shadow: 0 2px 8px rgba(99,102,241,.35);
        }
        .hm-logo-txt {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px; font-weight: 800; color: #0f172a;
        }
        .hm-logo-txt span { color: #6366f1; }
        .hm-links {
          display: flex; align-items: center; gap: 1px; list-style: none; margin-left: auto;
        }
        .hm-links a {
          display: flex; align-items: center; gap: 5px; text-decoration: none;
          color: #475569; font-size: 13.5px; font-weight: 600;
          padding: 7px 13px; border-radius: 50px; transition: all .18s;
        }
        .hm-links a:hover { background: #f1f5f9; color: #6366f1; }
        .hm-links a.act  { background: #eef2ff; color: #6366f1; }
        .hm-login-btn {
          display: flex; align-items: center; gap: 7px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          color: #fff; border: none; padding: 9px 20px; border-radius: 50px;
          font-size: 13.5px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(99,102,241,.35);
          transition: all .2s; white-space: nowrap;
        }
        .hm-login-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.45); }

        /* ── HERO ── */
        .hm-hero {
          min-height: 100vh; padding: 158px 20px 80px;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,.08) 0%, transparent 70%),
                      linear-gradient(180deg, #f8faff 0%, #eef2ff 100%);
          position: relative; overflow: hidden;
        }
        .hm-hero::before {
          content: '';
          position: absolute; top: -100px; right: -200px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(99,102,241,.08), transparent 70%);
          pointer-events: none;
        }
        .hm-hero::after {
          content: '';
          position: absolute; bottom: -80px; left: -150px;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,.06), transparent 70%);
          pointer-events: none;
        }
        .hm-hero-in {
          width: 100%; max-width: 1100px;
          display: flex; align-items: center; gap: 64px; position: relative; z-index: 1;
        }
        .hm-hero-l { flex: 1; animation: hfl .6s ease both; }
        .hm-hero-r { flex: 1; display: flex; justify-content: center; animation: hfr .6s .12s ease both; }
        @keyframes hfl { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes hfr { from{opacity:0;transform:translateX(24px)}  to{opacity:1;transform:translateX(0)} }

        .hm-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(99,102,241,.1); color: #6366f1;
          border: 1px solid rgba(99,102,241,.2);
          padding: 6px 14px; border-radius: 50px;
          font-size: 12px; font-weight: 700;
          margin-bottom: 20px; letter-spacing: .02em;
        }
        .hm-h1 {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(36px, 5vw, 58px);
          font-weight: 800; line-height: 1.08; color: #0f172a;
          margin-bottom: 10px; letter-spacing: -.03em;
        }
        .hm-h1 .acc { color: #6366f1; }
        .hm-tagline { font-size: 17px; font-weight: 700; color: #334155; margin-bottom: 14px; }
        .hm-desc {
          font-size: 15px; color: #64748b; line-height: 1.75;
          max-width: 440px; margin-bottom: 32px;
        }
        .hm-cta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .hm-btn-p {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          color: #fff; border: none; padding: 14px 28px; border-radius: 50px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 28px rgba(99,102,241,.4); transition: all .22s;
        }
        .hm-btn-p:hover { transform: translateY(-2px); box-shadow: 0 14px 36px rgba(99,102,241,.5); }
        .hm-btn-o {
          display: flex; align-items: center; gap: 8px;
          background: #fff; color: #6366f1;
          border: 2px solid rgba(99,102,241,.3); padding: 12px 24px; border-radius: 50px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all .18s;
          box-shadow: 0 2px 8px rgba(99,102,241,.08);
        }
        .hm-btn-o:hover { border-color: #6366f1; background: #f5f3ff; }

        /* ── HERO CARD (right side) ── */
        .hm-hcard {
          width: 100%; max-width: 430px;
          background: #fff; border-radius: 24px; padding: 22px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 20px 64px rgba(99,102,241,.12);
        }
        .hm-hcard-hdr { display: flex; align-items: center; gap: 11px; margin-bottom: 16px; }
        .hm-hcard-ico {
          width: 40px; height: 40px; border-radius: 11px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 19px;
        }
        .hm-hcard-ttl { font-family: 'Bricolage Grotesque', sans-serif; font-size: 14px; font-weight: 700; color: #0f172a; }
        .hm-hcard-sub { font-size: 11.5px; color: #94a3b8; margin-top: 1px; }

        .hm-rmini {
          display: flex; align-items: center; gap: 10px;
          background: #f8fafc; border-radius: 12px; padding: 10px 12px;
          border: 1px solid #e2e8f0; margin-bottom: 7px;
          cursor: pointer; transition: all .18s;
        }
        .hm-rmini:last-of-type { margin-bottom: 0; }
        .hm-rmini:hover { background: #eef2ff; border-color: #a5b4fc; transform: translateX(3px); }
        .hm-rdot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .hm-rname { font-size: 13px; font-weight: 700; color: #0f172a; flex: 1; }
        .hm-rcode { font-family: 'DM Mono', monospace; font-size: 10.5px; color: #94a3b8; margin-top: 1px; }
        .hm-rloc {
          font-size: 10.5px; color: #64748b; margin-top: 2px;
          display: flex; align-items: center; gap: 3px;
        }
        .hm-rbadge {
          padding: 3px 9px; border-radius: 50px;
          font-size: 10.5px; font-weight: 700; white-space: nowrap;
        }

        .hm-hcard-ftr {
          margin-top: 14px; padding-top: 12px; border-top: 1px solid #f1f5f9;
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: #64748b; font-weight: 600;
        }
        .hm-hcard-more {
          margin-left: auto; display: flex; align-items: center; gap: 4px;
          background: #eef2ff; color: #6366f1; border: none; border-radius: 50px;
          padding: 5px 11px; font-size: 11.5px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: background .18s;
        }
        .hm-hcard-more:hover { background: #e0e7ff; }

        /* ── SECTION WRAPPER ── */
        .hm-sec { padding: 76px 20px; }
        .hm-sec.white { background: #fff; }
        .hm-sec.soft  { background: #f8faff; }
        .hm-sec.indigo { background: linear-gradient(135deg, #eef2ff, #f5f3ff); }
        .hm-sec-in  { max-width: 1100px; margin: 0 auto; }
        .hm-sec-ttl {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: clamp(22px, 3vw, 30px); font-weight: 800; color: #0f172a;
          text-align: center; margin-bottom: 9px; letter-spacing: -.02em;
        }
        .hm-sec-sub { text-align: center; color: #64748b; font-size: 14.5px; margin-bottom: 44px; }

        /* ── FEATURE CARDS ── */
        .hm-feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); gap: 16px; }
        .hm-feat {
          border-radius: 20px; padding: 28px 22px; text-align: center;
          border: 1px solid transparent; transition: transform .22s, box-shadow .22s;
        }
        .hm-feat:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,.08); }
        .hm-feat.blue   { background: linear-gradient(145deg, #eff6ff, #dbeafe); border-color: #bfdbfe; }
        .hm-feat.violet { background: linear-gradient(145deg, #f5f3ff, #ede9fe); border-color: #ddd6fe; }
        .hm-feat.green  { background: linear-gradient(145deg, #f0fdf4, #dcfce7); border-color: #bbf7d0; }
        .hm-feat-ico {
          width: 52px; height: 52px; border-radius: 15px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px; font-size: 24px;
        }
        .hm-feat.blue   .hm-feat-ico { background: #dbeafe; color: #2563eb; }
        .hm-feat.violet .hm-feat-ico { background: #ede9fe; color: #7c3aed; }
        .hm-feat.green  .hm-feat-ico { background: #dcfce7; color: #16a34a; }
        .hm-feat-ttl { font-family: 'Bricolage Grotesque', sans-serif; font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
        .hm-feat-desc { color: #64748b; font-size: 13px; line-height: 1.7; }

        /* ── BROWSE ROOMS SECTION ── */
        .hm-rooms-toolbar {
          display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
          background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;
          padding: 12px 14px; margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,.04);
        }
        .hm-search-wrap { flex: 1; min-width: 200px; position: relative; }
        .hm-search-ico { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: #94a3b8; pointer-events: none; }
        .hm-search {
          width: 100%; padding: 9px 12px 9px 35px;
          border: 1.5px solid #e2e8f0; border-radius: 10px;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          background: #f8fafc; outline: none; color: #0f172a; transition: all .2s;
          box-sizing: border-box;
        }
        .hm-search:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 3px rgba(99,102,241,.08); }
        .hm-search::placeholder { color: #94a3b8; }
        .hm-sel {
          padding: 9px 12px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; font-size: 13px; font-weight: 600; color: #475569;
          font-family: 'DM Sans', sans-serif; cursor: pointer; outline: none; transition: all .2s;
        }
        .hm-sel:focus { border-color: #6366f1; background: #fff; }
        .hm-filter-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 9px 13px; border-radius: 10px; border: 1.5px solid #e2e8f0;
          background: #f8fafc; font-size: 13px; font-weight: 600; color: #475569;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .2s;
        }
        .hm-filter-btn:hover, .hm-filter-btn.on { border-color: #6366f1; background: #eef2ff; color: #6366f1; }
        .hm-fbadge {
          background: #6366f1; color: #fff; border-radius: 10px;
          width: 16px; height: 16px; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
        }

        /* filter dropdown */
        .hm-filter-panel {
          background: #fff; border: 1px solid #e2e8f0; border-radius: 14px;
          padding: 16px; margin-bottom: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,.06);
          animation: hmfd .18s ease;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 12px; align-items: end;
        }
        @keyframes hmfd { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
        .hm-fg label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: #94a3b8; margin-bottom: 5px; }
        .hm-fg select {
          width: 100%; padding: 8px 10px; border-radius: 8px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 13px; font-family: 'DM Sans', sans-serif; color: #1e293b; outline: none; cursor: pointer;
        }
        .hm-fg select:focus { border-color: #6366f1; }
        .hm-clear-btn {
          display: flex; align-items: center; justify-content: center;
          padding: 8px 14px; border-radius: 8px; border: none;
          background: #fff1f2; color: #e11d48;
          font-size: 12px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background .15s;
        }
        .hm-clear-btn:hover { background: #ffe4e6; }

        /* results count */
        .hm-results-bar {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .hm-rcount { font-size: 13px; font-weight: 600; color: #64748b; }
        .hm-rcount strong { color: #0f172a; }

        /* ── ROOM GRID ── */
        .hm-rooms-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 13px;
        }
        /* ── ROOM CARD ── */
        .hm-rcard {
          background: #fff; border-radius: 18px; padding: 18px 15px 15px;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 2px 10px rgba(0,0,0,.04);
          cursor: pointer; transition: all .22s cubic-bezier(.34,1.56,.64,1);
          position: relative; overflow: hidden;
          display: flex; flex-direction: column; gap: 8px;
        }
        .hm-rcard::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6); opacity: 0; transition: opacity .2s;
        }
        .hm-rcard:hover { transform: translateY(-4px); box-shadow: 0 14px 36px rgba(99,102,241,.16); border-color: #a5b4fc; }
        .hm-rcard:hover::before { opacity: 1; }
        .hm-rcard-name { font-size: 14px; font-weight: 800; color: #0f172a; line-height: 1.3; }
        .hm-rcard-code { font-family: 'DM Mono', monospace; font-size: 10.5px; color: #94a3b8; letter-spacing: .04em; }
        .hm-rcard-lock { position: absolute; top: 10px; right: 10px; display: flex; align-items: center; gap: 3px; background: #fee2e2; color: #b91c1c; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 700; }

        /* LOCATION — always shown prominently */
        .hm-rcard-loc {
          display: flex; align-items: flex-start; gap: 5px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
          padding: 6px 9px; margin-top: 2px;
        }
        .hm-rcard-loc-txt { font-size: 11px; color: #166534; font-weight: 500; line-height: 1.4; }

        /* floor + capacity pills */
        .hm-rcard-pills { display: flex; gap: 5px; flex-wrap: wrap; }
        .hm-rpill { display: inline-flex; align-items: center; gap: 3px; background: #f1f5f9; color: #475569; border-radius: 6px; padding: 2px 8px; font-size: 10px; font-weight: 600; }

        /* equipment */
        .hm-rcard-equip { display: flex; flex-wrap: wrap; gap: 4px; }
        .hm-reqtag { padding: 2px 7px; border-radius: 5px; font-size: 10px; font-weight: 600; background: #f1f5f9; color: #64748b; }

        /* view more */
        .hm-view-more {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin: 28px auto 0; background: #fff; color: #6366f1;
          border: 2px solid rgba(99,102,241,.3); border-radius: 50px;
          padding: 12px 28px; font-size: 13.5px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif;
          transition: all .18s; width: fit-content;
          box-shadow: 0 2px 8px rgba(99,102,241,.08);
        }
        .hm-view-more:hover { background: #eef2ff; border-color: #6366f1; transform: translateY(-1px); }

        /* empty state */
        .hm-empty {
          text-align: center; padding: 48px 20px;
          background: #fff; border-radius: 16px; border: 2px dashed #e2e8f0;
        }

        /* ── STATS ── */
        .hm-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px,1fr)); gap: 16px; margin-top: 36px; }
        .hm-stat {
          background: linear-gradient(145deg, #f8fafc, #f1f5f9);
          border-radius: 18px; padding: 24px 14px; text-align: center;
          border: 1px solid #e2e8f0; transition: transform .2s;
        }
        .hm-stat:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(99,102,241,.1); }
        .hm-stat-n {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 30px; font-weight: 800; color: #6366f1; margin-bottom: 3px;
        }
        .hm-stat-l { font-size: 12px; color: #64748b; font-weight: 600; }

        /* ── CTA BOX ── */
        .hm-cta-box {
          max-width: 680px; margin: 0 auto;
          background: linear-gradient(135deg, #6366f1, #4338ca, #7c3aed);
          border-radius: 28px; padding: 56px 40px; text-align: center;
          color: #fff; box-shadow: 0 24px 64px rgba(99,102,241,.3);
        }
        .hm-cta-ttl { font-family: 'Bricolage Grotesque', sans-serif; font-size: 28px; font-weight: 800; margin-bottom: 12px; letter-spacing: -.02em; }
        .hm-cta-sub { font-size: 14.5px; opacity: .88; margin-bottom: 30px; line-height: 1.65; }
        .hm-cta-btns { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .hm-cta-w {
          background: #fff; color: #4338ca; border: none;
          padding: 13px 28px; border-radius: 50px;
          font-size: 14px; font-weight: 800; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all .18s;
        }
        .hm-cta-w:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.15); }
        .hm-cta-o {
          background: transparent; color: #fff;
          border: 2px solid rgba(255,255,255,.5);
          padding: 11px 28px; border-radius: 50px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: all .18s;
        }
        .hm-cta-o:hover { border-color: #fff; background: rgba(255,255,255,.1); }

        /* ── FOOTER ── */
        .hm-footer { background: #0f172a; padding: 36px 20px; text-align: center; color: #64748b; font-size: 13px; }
        .hm-footer-brand { font-family: 'Bricolage Grotesque', sans-serif; font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 6px; }
        .hm-footer-brand span { color: #6366f1; }
        .hm-footer-links { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin: 12px 0; list-style: none; }
        .hm-footer-links a { color: #64748b; text-decoration: none; transition: color .18s; }
        .hm-footer-links a:hover { color: #818cf8; }
        .hm-footer-tag { font-size: 11px; opacity: .4; margin-top: 6px; }

        /* ── MODAL ── */
        .hm-overlay {
          position: fixed; inset: 0; z-index: 600;
          background: rgba(15,23,42,.6); backdrop-filter: blur(6px);
          display: flex; align-items: center; justify-content: center; padding: 18px;
          animation: hmoin .18s ease;
        }
        @keyframes hmoin { from{opacity:0} to{opacity:1} }
        .hm-modal {
          background: #fff; border-radius: 24px; padding: 28px;
          width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
          box-shadow: 0 32px 80px rgba(0,0,0,.18);
          animation: hmmin .22s cubic-bezier(.34,1.56,.64,1);
        }
        @keyframes hmmin { from{opacity:0;transform:scale(.95) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .hm-mod-hdr { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 18px; }
        .hm-mod-name { font-family: 'Bricolage Grotesque', sans-serif; font-size: 20px; font-weight: 800; color: #0f172a; }
        .hm-mod-code { font-family: 'DM Mono', monospace; font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .hm-mod-close {
          width: 32px; height: 32px; border-radius: 50%;
          background: #f1f5f9; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: #64748b;
          flex-shrink: 0; transition: all .18s;
        }
        .hm-mod-close:hover { background: #fee2e2; color: #ef4444; }
        .hm-mod-status {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 13px; border-radius: 50px;
          font-size: 12px; font-weight: 700; margin-bottom: 14px;
        }

        /* Location in modal — big and clear */
        .hm-mod-loc {
          display: flex; align-items: flex-start; gap: 10px;
          background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #22c55e;
          border-radius: 12px; padding: 13px 16px; margin-bottom: 16px;
        }
        .hm-mod-loc-lbl { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #16a34a; margin-bottom: 4px; }
        .hm-mod-loc-val { font-size: 14px; color: #166534; font-weight: 600; line-height: 1.45; }

        .hm-det-row {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 9px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px;
        }
        .hm-det-row:last-of-type { border-bottom: none; }
        .hm-det-ic { color: #6366f1; flex-shrink: 0; margin-top: 2px; }
        .hm-det-lbl { font-weight: 700; color: #374151; width: 90px; flex-shrink: 0; }
        .hm-det-val { color: #64748b; flex: 1; }

        .hm-equip-wrap { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .hm-equip-tag {
          padding: 4px 10px; border-radius: 50px;
          background: rgba(99,102,241,.08); color: #6366f1;
          border: 1px solid rgba(99,102,241,.18);
          font-size: 11px; font-weight: 700;
        }
        .hm-auth-notice {
          display: flex; align-items: center; gap: 9px;
          background: #fef3c7; border: 1px solid #fde68a; color: #92400e;
          border-radius: 11px; padding: 12px 14px; margin: 16px 0;
          font-size: 13px; font-weight: 600;
        }
        .hm-mod-btns { display: flex; gap: 9px; margin-top: 18px; }
        .hm-mod-close-btn {
          padding: 12px 18px; border-radius: 11px;
          background: #f1f5f9; color: #64748b; border: none;
          font-size: 13.5px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif; transition: background .18s;
        }
        .hm-mod-close-btn:hover { background: #e2e8f0; }
        .hm-mod-login-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
          background: linear-gradient(135deg, #6366f1, #4338ca); color: #fff; border: none;
          padding: 12px 18px; border-radius: 11px; font-size: 13.5px; font-weight: 700;
          cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all .18s;
          box-shadow: 0 4px 14px rgba(99,102,241,.35);
        }
        .hm-mod-login-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.45); }

        /* ── HAMBURGER BUTTON ── */
        .hm-hamburger {
          display: none;
          align-items: center; justify-content: center;
          width: 38px; height: 38px; border-radius: 10px;
          background: #f1f5f9; border: 1.5px solid #e2e8f0;
          color: #0f172a; cursor: pointer;
          margin-left: 8px; flex-shrink: 0;
          transition: background .18s;
        }
        .hm-hamburger:hover { background: #eef2ff; color: #6366f1; border-color: #a5b4fc; }

        /* ── MOBILE DROPDOWN MENU ── */
        .hm-mobile-menu {
          position: absolute; top: calc(100% + 6px); left: 12px; right: 12px;
          background: #fff; border-radius: 18px;
          border: 1px solid rgba(226,232,240,.9);
          box-shadow: 0 16px 48px rgba(15,23,42,.14);
          padding: 10px;
          display: flex; flex-direction: column; gap: 3px;
          animation: mobMenuIn .2s cubic-bezier(.34,1.56,.64,1);
          z-index: 399;
        }
        @keyframes mobMenuIn { from{opacity:0;transform:translateY(-10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        .hm-mob-link {
          display: flex; align-items: center; gap: 10px;
          padding: 13px 16px; border-radius: 12px;
          font-size: 15px; font-weight: 600; color: #334155;
          text-decoration: none; transition: all .15s;
        }
        .hm-mob-link:hover { background: #eef2ff; color: #6366f1; }
        .hm-mob-login {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 6px; padding: 14px 20px;
          background: linear-gradient(135deg, #6366f1, #4338ca);
          color: #fff; border: none; border-radius: 12px;
          font-size: 15px; font-weight: 700; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 4px 14px rgba(99,102,241,.35);
          transition: all .18s; width: 100%;
        }
        .hm-mob-login:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,102,241,.45); }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .hm-links { display: none !important; }
          .hm-login-btn { display: none !important; }
          .hm-hamburger { display: flex !important; }
          .hm-nav-in { padding: 8px 12px; }
          .hm-nav { position: relative; }
        }
        @media (max-width: 768px) {
          .hm-hero-in { flex-direction: column; gap: 28px; }
          .hm-hero-r  { order: -1; max-width: 100%; width: 100%; }
          .hm-hero    { padding-top: 110px; padding-bottom: 48px; }
          .hm-h1      { font-size: clamp(28px, 7vw, 44px); }
          .hm-desc    { font-size: 14px; }
          .hm-feat-grid { grid-template-columns: 1fr; gap: 12px; }
          .hm-rooms-grid { grid-template-columns: repeat(2, 1fr); }
          .hm-sec { padding: 48px 16px; }
          .hm-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .hm-cta-box { padding: 36px 22px; }
          .hm-gb { font-size: 11px; padding: 6px 12px; text-align: center; flex-wrap: wrap; gap: 4px; }
        }
        @media (max-width: 480px) {
          .hm-hero { padding-top: 100px; padding-left: 14px; padding-right: 14px; }
          .hm-h1 { font-size: clamp(24px, 8vw, 38px); }
          .hm-rooms-grid { grid-template-columns: 1fr; }
          .hm-hcard { max-width: 100%; }
          .hm-cta-box { padding: 28px 16px; border-radius: 20px; }
          .hm-cta-ttl { font-size: 22px; }
          .hm-hcard-hdr { flex-direction: row; }
          .hm-stats-grid { grid-template-columns: repeat(2, 1fr); }
          .hm-sec-ttl { font-size: 22px; }
          .hm-filter-panel { grid-template-columns: 1fr; }
          .hm-rooms-toolbar { flex-wrap: wrap; gap: 8px; }
          .hm-search-wrap { min-width: 100%; }
          .hm-gb { font-size: 10.5px; }
          .hm-logo-txt { font-size: 15px; }
        }
      `}</style>

      {/* ── GUEST BANNER ── */}
      <div className="hm-gb">
        <FiLock size={12} />
        Browsing as guest — view rooms freely, <a onClick={goLogin}>log in</a> to request a key
      </div>

      {/* ── NAVBAR ── */}
      <nav className="hm-nav">
        <div className={`hm-nav-in${scrolled ? ' sc' : ''}`}>
          <Link to="/" className="hm-logo">
            <div className="hm-logo-ico"><HiOutlineAcademicCap /></div>
            <span className="hm-logo-txt">a<span>X</span>ess</span>
          </Link>
          {/* Desktop links */}
          <ul className="hm-links">
            <li><a href="#" className="act"><FiHome size={12}/> Home</a></li>
            <li><a href="#rooms"><MdMeetingRoom size={13}/> Rooms</a></li>
            <li><Link to="/clubs"><FiUsers size={12}/> Clubs & Startups</Link></li>
            <li><a href="#how-it-works"><FiStar size={12}/> Features</a></li>
            <li><Link to="/contact"><FiMail size={12}/> Contact</Link></li>
          </ul>
          <button className="hm-login-btn" style={{ marginLeft: 'auto' }} onClick={goLogin}>
            <FiLogIn size={14}/> Log In
          </button>
          {/* Hamburger button — mobile only */}
          <button
            className="hm-hamburger"
            onClick={() => setMobileMenuOpen(p => !p)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen
              ? <FiX size={22} />
              : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>
        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="hm-mobile-menu">
            <a href="#" className="hm-mob-link" onClick={closeMenu}><FiHome size={15}/> Home</a>
            <a href="#rooms" className="hm-mob-link" onClick={closeMenu}><MdMeetingRoom size={15}/> Rooms</a>
            <Link to="/clubs" className="hm-mob-link" onClick={closeMenu}><FiUsers size={15}/> Clubs & Startups</Link>
            <a href="#how-it-works" className="hm-mob-link" onClick={closeMenu}><FiStar size={15}/> Features</a>
            <Link to="/contact" className="hm-mob-link" onClick={closeMenu}><FiMail size={15}/> Contact</Link>
            <button className="hm-mob-login" onClick={() => { closeMenu(); goLogin(); }}>
              <FiLogIn size={15}/> Log In to aXess
            </button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="hm-hero">
        <div className="hm-hero-in">
          <div className="hm-hero-l">
            <div className="hm-eyebrow"><FiStar size={11}/> Smart Campus Access System</div>
            <h1 className="hm-h1">
              {/* Icon badge that appears once "Welcome" is typed */}
              {heroText.length >= 7 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 44, height: 44, borderRadius: 12,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: 'white', marginRight: 10, verticalAlign: 'middle',
                  boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                  animation: 'iconPop 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  flexShrink: 0,
                }}>
                  <HiOutlineAcademicCap size={24} />
                </span>
              )}
              {/* Render typed text — color "aXess" blue when reached */}
              {(() => {
                const full = 'Welcome to Campus aXessHub';
                const aXessStart = full.indexOf('aXess'); // 17
                if (heroText.length === 0) return <span style={{ opacity: 0 }}>{full}</span>;
                if (heroText.length <= aXessStart) {
                  // haven't reached "aXess" yet — plain text
                  return <span>{heroText}</span>;
                }
                // Split into: before "aXess", the "aXess" part (or partial), after
                const before = heroText.slice(0, aXessStart);
                const axessPart = heroText.slice(aXessStart); // could be partial
                const fullAxess = 'aXessHub';
                const isInAxess = axessPart.length <= fullAxess.length;
                if (isInAxess) {
                  return (
                    <>
                      <span>{before}</span>
                      <span style={{ color: '#6366f1' }}>{axessPart}</span>
                    </>
                  );
                }
                // past "aXessHub" — split precisely
                const afterAxess = heroText.slice(aXessStart + fullAxess.length);
                return (
                  <>
                    <span>{before}</span>
                    <span style={{ color: '#6366f1' }}>{fullAxess}</span>
                    <span>{afterAxess}</span>
                  </>
                );
              })()}
              {/* Bouncing dots while typing */}
              {!heroDone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6, verticalAlign: 'middle' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'dotBounce 1s ease-in-out infinite', animationDelay: '0ms' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'dotBounce 1s ease-in-out infinite', animationDelay: '180ms' }} />
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', display: 'inline-block', animation: 'dotBounce 1s ease-in-out infinite', animationDelay: '360ms' }} />
                </span>
              )}
            </h1>
            <p className="hm-tagline">Book · Access · Track — Seamlessly</p>
            <p className="hm-desc">
              Browse all campus rooms, check real-time availability, and request
              key access in seconds. Built for students, clubs, and staff at MUST.
            </p>
            <div className="hm-cta">
              <button className="hm-btn-p" onClick={() => navigate('/register')}>
                Get Started <FiArrowRight size={14}/>
              </button>
              <button className="hm-btn-o"
                onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}>
                <MdMeetingRoom size={14}/> Browse Rooms
              </button>
            </div>
          </div>

          {/* Live rooms preview card */}
          <div className="hm-hero-r">
            <div className="hm-hcard">
              <div className="hm-hcard-hdr">
                <div className="hm-hcard-ico"><MdMeetingRoom/></div>
                <div>
                  <div className="hm-hcard-ttl">Live Room Status</div>
                  <div className="hm-hcard-sub">Click any room to view details</div>
                </div>
              </div>

              {loadingRooms
                ? [1,2,3,4].map(i => (
                    <div key={i} style={{ height:48, borderRadius:12, background:'#f1f5f9', marginBottom:7,
                      animation:'pulse 1.5s ease infinite' }}/>
                  ))
                : rooms.filter(r => r.status === 'available').slice(0,4).map(room => {
                    const s = SC[room.status] || SC.maintenance;
                    return (
                      <div key={room._id} className="hm-rmini" onClick={() => setPreviewRoom(room)}>
                        <span className="hm-rdot" style={{ background: s.dot }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="hm-rname">{room.name}</div>
                          <div className="hm-rcode">{room.code}</div>
                          {/* Location shown in mini card */}
                          {room.direction && (
                            <div className="hm-rloc">
                              <FiMapPin size={9}/>
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:140 }}>
                                {room.direction}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="hm-rbadge" style={{ background: s.bg, color: s.color }}>
                          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                        </span>
                      </div>
                    );
                  })}

              <div className="hm-hcard-ftr">
                <FiInfo size={12}/>
                <strong style={{ color:'#22c55e' }}>{stats.available}</strong>&nbsp;rooms available now
                <button className="hm-hcard-more"
                  onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}>
                  View all <FiArrowRight size={10}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="hm-sec white" id="how-it-works">
        <div className="hm-sec-in">
          <h2 className="hm-sec-ttl">How aXess Works</h2>
          <p className="hm-sec-sub">Three simple steps to access any room on campus · <em>Click any step to learn more</em></p>
          <div className="hm-feat-grid">
            {FEATURE_STEPS.map((step, i) => (
              <div
                key={step.id}
                className={`hm-feat ${step.bgClass}`}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => setActiveFeature(step)}
              >
                {/* Step number badge */}
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 26, height: 26, borderRadius: '50%',
                  background: step.color, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                }}>
                  {step.id}
                </div>
                <div className="hm-feat-ico">
                  {i === 0 ? <MdMeetingRoom /> : i === 1 ? <FiLogIn /> : <FiCheckCircle />}
                </div>
                <h3 className="hm-feat-ttl">{step.title}</h3>
                <p className="hm-feat-desc">{step.shortDesc}</p>
                <div style={{
                  marginTop: 14,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  color: step.color, fontWeight: 700, fontSize: 12,
                }}>
                  <FiChevronRight size={13} /> View full details
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURE DETAIL MODAL ── */}
      {activeFeature && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 8000,
            background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18,
            animation: 'hmoin .18s ease',
          }}
          onClick={() => setActiveFeature(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 24, padding: 0,
              width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 32px 80px rgba(0,0,0,.22)',
              animation: 'hmmin .22s cubic-bezier(.34,1.56,.64,1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${activeFeature.color}cc, ${activeFeature.color})`,
              borderRadius: '24px 24px 0 0',
              padding: '28px 28px 22px',
              color: 'white',
              position: 'relative',
            }}>
              <button
                onClick={() => setActiveFeature(null)}
                style={{
                  position: 'absolute', top: 14, right: 14,
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.25)', border: 'none',
                  color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background .18s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
              >
                <FiX size={15} />
              </button>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(255,255,255,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, marginBottom: 12,
              }}>
                {activeFeature.id === 1 ? <MdMeetingRoom /> : activeFeature.id === 2 ? <FiLogIn /> : <FiCheckCircle />}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{
                  background: 'rgba(255,255,255,0.25)', borderRadius: 20,
                  padding: '3px 12px', fontSize: 12, fontWeight: 700,
                }}>
                  Step {activeFeature.id} of 3
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{activeFeature.title}</h2>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 28 }}>
              {activeFeature.steps.map((section, si) => (
                <div key={si}>
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    background: '#f0fdf4', border: '1px solid #bbf7d0',
                    borderLeft: `4px solid ${activeFeature.color}`,
                    borderRadius: 12, padding: '10px 14px', marginBottom: 18,
                  }}>
                    <FiInfo size={15} style={{ flexShrink: 0, marginTop: 2, color: activeFeature.color }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1f2937', lineHeight: 1.5, margin: 0 }}>
                      {section.heading}
                    </p>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {section.points.map((point, pi) => (
                      <li key={pi} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        background: '#f8fafc', borderRadius: 10,
                        padding: '10px 14px', border: '1px solid #e2e8f0',
                      }}>
                        <span style={{
                          flexShrink: 0, width: 22, height: 22, borderRadius: '50%',
                          background: activeFeature.color + '18',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: activeFeature.color, fontSize: 10, fontWeight: 800,
                        }}>
                          {pi + 1}
                        </span>
                        <span style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.65 }}>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Navigation between steps */}
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                {activeFeature.id > 1 && (
                  <button
                    onClick={() => setActiveFeature(FEATURE_STEPS[activeFeature.id - 2])}
                    style={{
                      flex: 1, padding: '11px 16px', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', transition: 'background .18s',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                  >
                    ← Step {activeFeature.id - 1}
                  </button>
                )}
                <button
                  onClick={() => setActiveFeature(null)}
                  style={{
                    flex: 1, padding: '11px 16px', background: '#f1f5f9', color: '#64748b',
                    border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13,
                    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  Close
                </button>
                {activeFeature.id < 3 && (
                  <button
                    onClick={() => setActiveFeature(FEATURE_STEPS[activeFeature.id])}
                    style={{
                      flex: 1, padding: '11px 16px',
                      background: `linear-gradient(135deg, ${activeFeature.color}cc, ${activeFeature.color})`,
                      color: 'white', border: 'none', borderRadius: 10, fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', transition: 'opacity .18s',
                      fontFamily: 'DM Sans, sans-serif',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.opacity = '0.88'; }}
                    onMouseOut={(e) => { e.currentTarget.style.opacity = '1'; }}
                  >
                    Step {activeFeature.id + 1} →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ════════════════ BROWSE ROOMS SECTION ════════════════ */}
      <section className="hm-sec indigo" id="rooms">
        <div className="hm-sec-in">
          <h2 className="hm-sec-ttl">Browse Campus Rooms</h2>
          <p className="hm-sec-sub">
            Click any room to view location, equipment, and details — log in to request a key.
          </p>

          {/* ── Quick-action banner ── */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 14,
            background: 'white',
            border: '1.5px solid rgba(99,102,241,.15)',
            borderRadius: 18,
            padding: '18px 22px',
            marginBottom: 24,
            boxShadow: '0 4px 20px rgba(99,102,241,.08)',
          }}>
            {/* Left — info chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#dcfce7', color: '#15803d',
                border: '1px solid #bbf7d0', borderRadius: 50,
                padding: '5px 13px', fontSize: 12, fontWeight: 700,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                {stats.available} Available Now
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#f1f5f9', color: '#475569',
                border: '1px solid #e2e8f0', borderRadius: 50,
                padding: '5px 13px', fontSize: 12, fontWeight: 700,
              }}>
                <MdMeetingRoom size={13} />
                {rooms.length} Total Rooms
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#eff6ff', color: '#1d4ed8',
                border: '1px solid #bfdbfe', borderRadius: 50,
                padding: '5px 13px', fontSize: 12, fontWeight: 700,
              }}>
                <FiGrid size={11} />
                All Floors
              </span>
            </div>

            {/* Right — CTA buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                onClick={() => document.getElementById('rooms')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: 'white', border: 'none',
                  padding: '10px 20px', borderRadius: 50,
                  fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  boxShadow: '0 4px 14px rgba(99,102,241,.35)',
                  transition: 'all .2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,.45)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,.35)'; }}
              >
                <MdMeetingRoom size={15} /> View All Rooms
                <FiArrowRight size={13} />
              </button>
              <button
                onClick={goLogin}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  background: 'white', color: '#6366f1',
                  border: '2px solid rgba(99,102,241,.3)',
                  padding: '8px 18px', borderRadius: 50,
                  fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  transition: 'all .18s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.background = '#eef2ff'; }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(99,102,241,.3)'; e.currentTarget.style.background = 'white'; }}
              >
                <FiLogIn size={13} /> Log In to Request
              </button>
            </div>
          </div>

          {/* ── Toolbar ── */}
          <div className="hm-rooms-toolbar">
            <div className="hm-search-wrap">
              <FiSearch size={14} className="hm-search-ico"/>
              <input
                className="hm-search"
                placeholder="Search by name, code, or location…"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <select className="hm-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="requested">Requested</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <button
              className={`hm-filter-btn ${showFilters || activeFilters > 0 ? 'on' : ''}`}
              onClick={() => setShowFilters(p => !p)}
            >
              <FiFilter size={13}/>
              Filter
              {activeFilters > 0 && <span className="hm-fbadge">{activeFilters}</span>}
              <FiChevronDown size={12} style={{ transform: showFilters ? 'rotate(180deg)' : 'none', transition: '.2s' }}/>
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div className="hm-filter-panel">
              <div className="hm-fg">
                <label>Floor</label>
                <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)}>
                  <option value="all">All Floors</option>
                  <option value="basement">Basement</option>
                  <option value="ground">Ground Floor</option>
                  <option value="first">First Floor</option>
                  <option value="second">Second Floor</option>
                </select>
              </div>
              {(query || activeFilters > 0) && (
                <button className="hm-clear-btn" onClick={clearAll}>✕ Clear filters</button>
              )}
            </div>
          )}

          {/* Results bar */}
          <div className="hm-results-bar">
            <p className="hm-rcount">
              Showing <strong>{filtered.length}</strong> of <strong>{rooms.length}</strong> rooms
              {query && <> matching &ldquo;<strong>{query}</strong>&rdquo;</>}
            </p>
            {(activeFilters > 0) && (
              <button style={{ fontSize:12, fontWeight:600, color:'#6366f1', background:'#eef2ff', border:'none', borderRadius:8, padding:'4px 10px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }} onClick={clearAll}>
                ✕ Clear
              </button>
            )}
          </div>

          {/* Room Grid */}
          {loadingRooms ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:13 }}>
              {Array.from({length:8}).map((_,i) => (
                <div key={i} style={{ background:'#fff', borderRadius:18, padding:18, border:'1.5px solid #e2e8f0', height:160 }}/>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="hm-empty">
              <TbBuildingEstate size={36} color="#94a3b8" style={{ marginBottom:12 }}/>
              <p style={{ fontWeight:700, color:'#1e293b', marginBottom:6 }}>No rooms found</p>
              <p style={{ color:'#94a3b8', fontSize:13, marginBottom:14 }}>Try adjusting your search or filters</p>
              <button style={{ fontSize:12, fontWeight:600, color:'#6366f1', background:'#eef2ff', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontFamily:'DM Sans, sans-serif' }} onClick={clearAll}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className="hm-rooms-grid">
              {filtered.map(room => {
                const s = SC[room.status] || SC.maintenance;
                return (
                  <div key={room._id} className="hm-rcard" onClick={() => setPreviewRoom(room)}>
                    {/* Private badge */}
                    {room.isPrivate && (
                      <div className="hm-rcard-lock"><FiLock size={9}/> Private</div>
                    )}

                    {/* Status badge */}
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      padding:'4px 10px', borderRadius:8,
                      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
                      fontSize:11, fontWeight:700, width:'fit-content',
                    }}>
                      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }}/>
                      {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                    </span>

                    {/* Name + code */}
                    <div>
                      <div className="hm-rcard-name">{room.name}</div>
                      <div className="hm-rcard-code">{room.code}</div>
                    </div>

                    {/* ── LOCATION — always shown prominently ── */}
                    {room.direction && (
                      <div className="hm-rcard-loc">
                        <FiMapPin size={11} color="#16a34a" style={{ flexShrink:0, marginTop:1 }}/>
                        <span className="hm-rcard-loc-txt">{room.direction}</span>
                      </div>
                    )}

                    {/* Floor + capacity pills */}
                    <div className="hm-rcard-pills">
                      {room.floorLabel && (
                        <span className="hm-rpill">
                          <TbBuildingEstate size={9}/> {FLOOR_LABEL[room.floorLabel]}
                        </span>
                      )}
                      {room.capacity && (
                        <span className="hm-rpill">
                          <FiUsers size={9}/> {room.capacity}
                        </span>
                      )}
                    </div>

                    {/* Equipment dots */}
                    {room.equipment && room.equipment.length > 0 && (
                      <div className="hm-rcard-equip">
                        {room.equipment.slice(0,3).map(e => <span key={e} className="hm-reqtag">{e}</span>)}
                        {room.equipment.length > 3 && (
                          <span className="hm-reqtag">+{room.equipment.length-3}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Login CTA */}
          <button className="hm-view-more" onClick={goLogin}>
            <FiLogIn size={14}/> Log In to Request a Key
          </button>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="hm-sec white">
        <div className="hm-sec-in">
          <h2 className="hm-sec-ttl">aXess by the Numbers</h2>
          <p className="hm-sec-sub">Trusted by students, staff, and clubs across MUST campus.</p>
          <div className="hm-stats-grid">
            {[
              { n: '1,200+',         l: 'Active Students' },
              { n: `${rooms.length || '48'}`, l: 'Campus Rooms' },
              { n: `${stats.available}`, l: 'Available Now' },
              { n: '99%',           l: 'Satisfaction Rate' },
            ].map(s => (
              <div key={s.l} className="hm-stat">
                <div className="hm-stat-n">{s.n}</div>
                <div className="hm-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="hm-sec soft" id="contact">
        <div className="hm-cta-box">
          <h2 className="hm-cta-ttl">Ready to Get Access?</h2>
          <p className="hm-cta-sub">Join thousands of students already using aXess to book campus rooms instantly.</p>
          <div className="hm-cta-btns">
            <button className="hm-cta-w" onClick={() => navigate('/register')}>Create Account</button>
            <button className="hm-cta-o" onClick={goLogin}>Log In</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="hm-footer">
        <div className="hm-footer-brand">a<span>X</span>ess</div>
        <ul className="hm-footer-links">
          <li><Link to="/">Home</Link></li>
          <li><a href="#rooms">Rooms</a></li>
          <li><a href="#how-it-works">Features</a></li>
          <li><Link to="/login">Login</Link></li>
          <li><Link to="/register">Register</Link></li>
        </ul>
        <p>© {new Date().getFullYear()} aXess · University Room Booking System</p>
        <p className="hm-footer-tag">Powered by BLECAxmartlabs · MUST</p>
      </footer>

      {/* ════════════ ROOM DETAIL MODAL ════════════ */}
      {previewRoom && (() => {
        const s = SC[previewRoom.status] || SC.maintenance;
        return (
          <div className="hm-overlay" onClick={() => setPreviewRoom(null)}>
            <div className="hm-modal" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="hm-mod-hdr">
                <div>
                  <div className="hm-mod-name">{previewRoom.name}</div>
                  <div className="hm-mod-code">{previewRoom.code}</div>
                </div>
                <button className="hm-mod-close" onClick={() => setPreviewRoom(null)}>
                  <FiX size={14}/>
                </button>
              </div>

              {/* Status badge */}
              <span className="hm-mod-status" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:s.dot, display:'inline-block' }}/>
                {previewRoom.status.charAt(0).toUpperCase() + previewRoom.status.slice(1)}
              </span>

              {/* Private warning */}
              {previewRoom.isPrivate && (
                <div style={{ display:'flex', alignItems:'center', gap:8, background:'#fee2e2', color:'#b91c1c', padding:'10px 13px', borderRadius:10, marginBottom:14, fontSize:13, fontWeight:600 }}>
                  <FiLock size={13}/> Private room — authorized members only
                </div>
              )}

              {/* ── LOCATION — prominent display with clickable button ── */}
              {previewRoom.direction ? (
                <div style={{ marginBottom: 14 }}>
                  <div className="hm-mod-loc">
                    <FiMapPin size={18} color="#16a34a" style={{ flexShrink:0, marginTop:2 }}/>
                    <div style={{ flex: 1 }}>
                      <div className="hm-mod-loc-lbl">📍 LOCATION</div>
                      <div className="hm-mod-loc-val">{previewRoom.direction}</div>
                    </div>
                  </div>
                  
                  {/* View Map Button - only show if directionImage exists */}
                  {previewRoom.directionImage && (
                    <button
                      onClick={() => setShowImageModal(true)}
                      style={{
                        marginTop: 10,
                        width: '100%',
                        padding: '12px 16px',
                        background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontWeight: 600,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.4)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.3)';
                      }}
                    >
                      <FiMapPin size={16} />
                      View Location Map / Route
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, padding:'10px 13px', marginBottom:14, fontSize:13, color:'#94a3b8' }}>
                  📍 No location description added for this room yet.
                </div>
              )}

              {/* Details */}
              <div>
                {previewRoom.floorLabel && (
                  <div className="hm-det-row">
                    <FiGrid size={14} className="hm-det-ic"/>
                    <span className="hm-det-lbl">Floor</span>
                    <span className="hm-det-val">{FLOOR_LABEL[previewRoom.floorLabel]}</span>
                  </div>
                )}
                {previewRoom.coordinator && (
                  <div className="hm-det-row">
                    <FiUsers size={14} className="hm-det-ic"/>
                    <span className="hm-det-lbl">Coordinator</span>
                    <span className="hm-det-val">{previewRoom.coordinator}</span>
                  </div>
                )}
                {previewRoom.capacity != null && (
                  <div className="hm-det-row">
                    <FiCheckCircle size={14} className="hm-det-ic"/>
                    <span className="hm-det-lbl">Capacity</span>
                    <span className="hm-det-val">{previewRoom.capacity} people</span>
                  </div>
                )}
              </div>

              {/* Equipment */}
              {previewRoom.equipment && previewRoom.equipment.length > 0 && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                    <FiZap size={12} color="#6366f1"/> Equipment / Facilities
                  </div>
                  <div className="hm-equip-wrap">
                    {previewRoom.equipment.map(t => <span key={t} className="hm-equip-tag">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Auth notice */}
              <div className="hm-auth-notice">
                <FiAlertCircle size={15} style={{ flexShrink:0 }}/>
                You need to be logged in to request the key for this room.
              </div>

              <div className="hm-mod-btns">
                <button className="hm-mod-close-btn" onClick={() => setPreviewRoom(null)}>Close</button>
                <button className="hm-mod-login-btn" onClick={goLogin}>
                  <FiLogIn size={14}/> Log In to Request Key
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════
          IMAGE MODAL - View Direction/Route Map
      ══════════════════════════════════════════════════════════════ */}
      {showImageModal && previewRoom?.directionImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20,
          }}
          onClick={() => setShowImageModal(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowImageModal(false)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'white',
              border: 'none',
              borderRadius: '50%',
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              zIndex: 10001,
            }}
          >
            <FiX size={24} color="#1f2937" />
          </button>

          {/* Image Title */}
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: 20,
              background: 'rgba(255, 255, 255, 0.95)',
              padding: '12px 20px',
              borderRadius: 10,
              fontWeight: 600,
              color: '#1f2937',
              fontSize: 16,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <FiMapPin size={18} color="#16a34a" />
            <span>Location Map: {previewRoom.name}</span>
          </div>

          {/* Image */}
          <img
            src={`http://localhost:5000${previewRoom.directionImage}`}
            alt={`${previewRoom.name} location map`}
            style={{
              maxWidth: '90vw',
              maxHeight: '85vh',
              objectFit: 'contain',
              borderRadius: 12,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Download Button */}
          <a
            href={`http://localhost:5000${previewRoom.directionImage}`}
            download
            style={{
              position: 'absolute',
              bottom: 30,
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '14px 28px',
              background: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 600,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(22, 163, 74, 0.4)',
              cursor: 'pointer',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <FiMapPin size={16} />
            Download Map
          </a>
        </div>
      )}

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}} @keyframes dotBounce{0%,80%,100%{transform:translateY(0);opacity:0.6}40%{transform:translateY(-8px);opacity:1}} @keyframes iconPop{from{transform:scale(0) rotate(-15deg);opacity:0}to{transform:scale(1) rotate(0deg);opacity:1}}`}</style>
    </>
  );
};

export default Home;