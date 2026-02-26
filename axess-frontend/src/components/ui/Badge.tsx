// src/components/ui/Badge.tsx
import React from 'react';

// Export the type so other files can use it
export type BadgeVariant =
  | 'available'
  | 'taken'
  | 'returned'
  | 'restricted'
  | 'occupied'
  | 'requested'
  | 'maintenance'
  | 'pending'
  | 'approved';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
}

const Badge: React.FC<BadgeProps> = ({ children, variant }) => {
  const base = "status-badge";
  const variants: Record<BadgeVariant, string> = {
    available: `${base} available`,
    taken: `${base} taken`,
    returned: `${base} returned`,
    restricted: `${base} restricted`,
    occupied: `${base} occupied`,
    requested: `${base} requested`,
    maintenance: `${base} maintenance`,
    pending: `${base} pending`,
    approved: `${base} approved`,
  };

  return <span className={variants[variant]}>{children}</span>;
};

export default Badge;