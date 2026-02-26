// src/App.tsx
// ─────────────────────────────────────────────────────────────────────────────
// ROUTE FLOW
//
//  /          → Splash (auto-redirects to /home after animation)
//  /home      → Guest landing page  (browse rooms, no login required)
//  /login     → Login
//  /register  → Register
//  /reset-password → Reset password
//
//  All routes below require auth (ProtectedRoute) and are wrapped in
//  DashboardLayout which renders the Sidebar + Header.
//
//  ✅ ROOT CAUSE FIX:
//     /rooms was previously declared OUTSIDE ProtectedRoute and DashboardLayout,
//     which is why the sidebar never appeared.  It is now inside both, exactly
//     like /dashboard, /requests, etc.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// ── Public / guest pages ──────────────────────────────────────────────────────
import Login         from './pages/Login';
import Register      from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Splash        from './pages/Splash';
import Home          from './pages/Home';
import Clubs         from './pages/Clubs';
import Contact       from './pages/Contact';

// ── Protected pages ───────────────────────────────────────────────────────────
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard       from './pages/Dashboard';
import Rooms           from './pages/Rooms';          // ← now inside layout
import Requests        from './pages/Requests';
import Reports         from './pages/Reports';
import Settings        from './pages/Settings';
import HelpSupport     from './pages/HelpSupport';
import Members         from './pages/Members';
import PendingReturns  from './pages/PendingReturns';

import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>

        {/* ── Entry point — Splash screen, then redirects to /home ─────── */}
        <Route path="/" element={<Splash />} />

        {/* ── Guest landing page ──────────────────────────────────────────── */}
        <Route path="/home" element={<Home />} />

        {/* ── Clubs & Startups page (public) ──────────────────────────────── */}
        <Route path="/clubs" element={<Clubs />} />

        {/* ── Contact page (public) ───────────────────────────────────────── */}
        <Route path="/contact" element={<Contact />} />

        {/* ── Auth pages ──────────────────────────────────────────────────── */}
        <Route path="/login"          element={<Login />} />
        <Route path="/register"       element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ── Protected + DashboardLayout (sidebar + header) ──────────────── */}
        <Route element={<ProtectedRoute />}>

          <Route path="/dashboard"
            element={<DashboardLayout><Dashboard /></DashboardLayout>} />

          <Route path="/members"
            element={<DashboardLayout><Members /></DashboardLayout>} />

          {/* ✅ FIXED — /rooms now inside DashboardLayout → sidebar visible */}
          <Route path="/rooms"
            element={<DashboardLayout><Rooms /></DashboardLayout>} />

          <Route path="/requests"
            element={<DashboardLayout><Requests /></DashboardLayout>} />

          <Route path="/reports"
            element={<DashboardLayout><Reports /></DashboardLayout>} />

          <Route path="/pending-returns"
            element={<DashboardLayout><PendingReturns /></DashboardLayout>} />

          <Route path="/settings"
            element={<DashboardLayout><Settings /></DashboardLayout>} />

          <Route path="/help"
            element={<DashboardLayout><HelpSupport /></DashboardLayout>} />

        </Route>

        {/* ── Fallback ────────────────────────────────────────────────────── */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Router>
  );
};

export default App;