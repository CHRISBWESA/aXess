// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icons } from '../icons';
import { performLogout } from '../../lib/auth';

interface SidebarProps {
  role?: string;
  isOpen?: boolean;       // mobile: controlled open state
  onClose?: () => void;   // mobile: close callback
}

const Sidebar: React.FC<SidebarProps> = ({ role = 'Admin', isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        const r = user.role || 'user';
        setIsAdmin(r === 'admin');
      } else {
        setIsAdmin(false);
      }
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to log out?')) return;
    try {
      await performLogout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      navigate('/login', { replace: true });
      window.location.reload();
    }
  };

  const handleNavClick = () => {
    // Close mobile sidebar when a nav item is clicked
    if (onClose) onClose();
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${isOpen ? 'sidebar-open' : ''}`}>

      {/* Mobile close button */}
      <button
        className="sidebar-mobile-close"
        onClick={onClose}
        aria-label="Close menu"
      >
        <Icons.X size={20} />
      </button>

      {/* Logo */}
      <div className="sidebar-logo">
        {collapsed ? 'aX' : 'aXess'}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink to="/dashboard" title="Dashboard" onClick={handleNavClick}>
              <Icons.Home className="sidebar-icon" />
              <span className="sidebar-label">Dashboard</span>
            </NavLink>
          </li>

          {isAdmin && (
            <>
              <li>
                <NavLink to="/members" title="Members" onClick={handleNavClick}>
                  <Icons.Users className="sidebar-icon" />
                  <span className="sidebar-label">Members</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/rooms" title="Rooms" onClick={handleNavClick}>
                  <Icons.Key className="sidebar-icon" />
                  <span className="sidebar-label">Rooms</span>
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink to="/requests" title="Requests" onClick={handleNavClick}>
              <Icons.FileText className="sidebar-icon" />
              <span className="sidebar-label">Requests</span>
            </NavLink>
          </li>

          {isAdmin && (
            <>
              <li>
                <NavLink to="/reports" title="Reports" onClick={handleNavClick}>
                  <Icons.BarChart className="sidebar-icon" />
                  <span className="sidebar-label">Reports</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/pending-returns" title="Pending Returns" onClick={handleNavClick}>
                  <Icons.Clock className="sidebar-icon" />
                  <span className="sidebar-label">Pending Returns</span>
                </NavLink>
              </li>
            </>
          )}

          <li>
            <NavLink to="/settings" title="Settings" onClick={handleNavClick}>
              <Icons.Settings className="sidebar-icon" />
              <span className="sidebar-label">Settings</span>
            </NavLink>
          </li>

          <li>
            <NavLink to="/help" title="Help & Support" onClick={handleNavClick}>
              <Icons.HelpCircle className="sidebar-icon" />
              <span className="sidebar-label">Help & Support</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Bottom area */}
      <div className={`sidebar-bottom ${collapsed ? 'sidebar-bottom-collapsed' : ''}`}>
        {/* Collapse toggle always on top in bottom area */}
        <button
          className="sidebar-toggle sidebar-toggle-desktop"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className={`toggle-icon ${collapsed ? 'rotated' : ''}`}>
            {collapsed ? '»»' : '««'}
          </span>
        </button>

        {/* Divider between collapse toggle and logout */}
        <hr style={{
          border: 'none',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          margin: '4px 8px',
          width: collapsed ? '80%' : 'calc(100% - 16px)',
        }} />

        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <Icons.LogOut className="sidebar-icon" />
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;