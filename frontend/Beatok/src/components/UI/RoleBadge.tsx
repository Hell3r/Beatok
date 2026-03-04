import React from 'react';

interface RoleBadgeProps {
  role?: string;
  showLabel?: boolean;
  className?: string;
}

const roleConfig: Record<string, { color: string; bgColor: string; label: string;}> = {
  admin: {
    color: 'text-white',
    bgColor: 'bg-red-600',
    label: 'Админ',
  },
  moderator: {
    color: 'text-white',
    bgColor: 'bg-blue-600',
    label: 'Модератор',
  },
  'top-author': {
    color: 'text-white',
    bgColor: 'bg-green-600',
    label: 'Топ-битмейкер',
  }
};

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showLabel = true, className = '' }) => {
  if (!role || !roleConfig[role]) {
    return null;
  }

  const config = roleConfig[role];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.color} ${className}`}
      title={config.label}
    >
      {showLabel && <span className='select-none'>{config.label}</span>}
    </span>
  );
};

export default RoleBadge;
