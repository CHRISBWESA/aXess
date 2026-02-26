// src/components/layout/DashboardLayout.tsx
import React, { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface DashboardLayoutProps {
  children: ReactNode;
  role?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, role: roleProp }) => {
  const [role, setRole] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const u = JSON.parse(stored);
        setRole(u.role || roleProp || 'user');
        return;
      }
    } catch {}
    setRole(roleProp || 'user');
  }, [roleProp]);

  // Close sidebar when clicking overlay
  const handleOverlayClick = () => setSidebarOpen(false);

  // Close sidebar on route change (resize to desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (role === null) return null;

  return (
    <div className="app">
      <Header role={role} onMenuClick={() => setSidebarOpen(prev => !prev)} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay visible"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      <div className="main-layout">
        <Sidebar role={role} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;