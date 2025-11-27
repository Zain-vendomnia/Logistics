// /shared/utils.ts
// Simplified utility functions for customer list

// ==========================================
// CONSTANTS
// ==========================================

const AVATAR_COLORS = [
  '#1976d2', '#388e3c', '#f57c00', '#7b1fa2',
  '#c2185b', '#00796b', '#5d4037', '#455a64'
];

// ==========================================
// AVATAR UTILITIES
// ==========================================

export const getInitials = (name: string): string => {
  if (!name || typeof name !== 'string') return '??';
  
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const getAvatarColor = (name: string): string => {
  if (!name || typeof name !== 'string' || name.length === 0) {
    return AVATAR_COLORS[0];
  }
  
  const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
  return AVATAR_COLORS[charCode % AVATAR_COLORS.length];
};

// ==========================================
// TIME FORMATTING
// ==========================================

export const formatTime = (timestamp?: string): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
};