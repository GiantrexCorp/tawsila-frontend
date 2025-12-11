"use client";

import { getUserAvatarGradient } from "@/lib/utils";
import {
  Truck,
  ShieldCheck,
  Package,
  UserCog,
  Building2,
  User,
  Users,
  Eye,
  ClipboardList,
} from "lucide-react";

interface UserAvatarProps {
  userId: number | string;
  name: string;
  role?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: { container: "h-8 w-8", icon: "h-4 w-4" },
  md: { container: "h-10 w-10", icon: "h-5 w-5" },
  lg: { container: "h-14 w-14", icon: "h-7 w-7" },
  xl: { container: "h-28 w-28", icon: "h-14 w-14" },
};

/**
 * Get the appropriate icon for a user's role
 */
function getRoleIcon(role?: string) {
  if (!role) return User;

  const roleIcons: Record<string, typeof User> = {
    'super-admin': ShieldCheck,
    'admin': UserCog,
    'manager': Users,
    'inventory-manager': Package,
    'shipping-agent': Truck,
    'order-preparer': ClipboardList,
    'vendor': Building2,
    'viewer': Eye,
  };

  return roleIcons[role.toLowerCase()] || User;
}

export function UserAvatar({ userId, name, role, size = "md", className = "" }: UserAvatarProps) {
  const gradient = getUserAvatarGradient(userId);
  const IconComponent = getRoleIcon(role);
  const sizes = sizeClasses[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white ${sizes.container} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      }}
      title={name}
    >
      <IconComponent className={sizes.icon} strokeWidth={2} />
    </div>
  );
}
