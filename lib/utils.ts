import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Professional gradient color pairs for user avatars
 * Each user gets a consistent gradient based on their ID
 */
const AVATAR_GRADIENTS = [
  { from: '#0EA5E9', to: '#0369A1' }, // Sky blue
  { from: '#8B5CF6', to: '#6D28D9' }, // Purple
  { from: '#6366F1', to: '#4338CA' }, // Indigo
  { from: '#14B8A6', to: '#0D9488' }, // Teal
  { from: '#0891B2', to: '#0E7490' }, // Cyan
  { from: '#059669', to: '#047857' }, // Emerald
  { from: '#DC2626', to: '#B91C1C' }, // Red
  { from: '#EA580C', to: '#C2410C' }, // Orange
  { from: '#D946EF', to: '#A21CAF' }, // Fuchsia
  { from: '#2563EB', to: '#1D4ED8' }, // Blue
];

/**
 * Get a consistent gradient for a user based on their ID
 */
export function getUserAvatarGradient(userId: number | string): { from: string; to: string } {
  const id = typeof userId === 'string' ? parseInt(userId, 10) || 0 : userId;
  return AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];
}
