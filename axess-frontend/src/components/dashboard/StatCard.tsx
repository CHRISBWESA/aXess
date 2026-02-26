// src/components/dashboard/StatCard.tsx
import React from 'react';
import { Icons } from '../icons';

type StatType = 'users' | 'rooms' | 'requests' | 'reports';

interface StatCardProps {
  type: StatType;
  value: string | number;
  label: string;
  color: 'blue' | 'green' | 'orange' | 'gray';
  notifications?: number;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  type,
  value,
  label,
  color,
  notifications = 0,
  onClick,
}) => {
  const icons = {
    users: <Icons.Users />,
    rooms: <Icons.Lock />,
    requests: <Icons.FileText />,
    reports: <Icons.BarChart />,
  };

  const clickable = !!onClick;
  const hasNotifications = notifications > 0;

  return (
    <div
      className={`stat-card ${color} ${clickable ? 'clickable relative' : 'relative'}`}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.();
      } : undefined}
      aria-pressed={clickable ? false : undefined}
    >
      <div className="stat-card-icon">{icons[type]}</div>

      <div className="stat-card-value">
        <span>{value}</span>
      </div>

      {hasNotifications && (
        <div className="notification-bell-container">
          <Icons.Bell className="notification-bell" size={14} />
          <span className="notification-number">
            {notifications > 99 ? '99+' : notifications}
          </span>
        </div>
      )}

      <div className="stat-card-label">{label}</div>
    </div>
  );
};

export default StatCard;