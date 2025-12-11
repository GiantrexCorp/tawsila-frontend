"use client";

import { getUserAvatarGradient } from "@/lib/utils";
import {
  ShieldCheck,
  UserCog,
  Users,
  Package,
  Truck,
  ClipboardList,
  Building2,
  Eye,
  Shield,
} from "lucide-react";

interface RoleAvatarProps {
  roleId: number | string;
  roleName: string;
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
 * Get the appropriate icon for a role
 */
function getRoleIcon(roleName: string) {
  const roleIcons: Record<string, typeof Shield> = {
    'super-admin': ShieldCheck,
    'admin': UserCog,
    'manager': Users,
    'inventory-manager': Package,
    'shipping-agent': Truck,
    'order-preparer': ClipboardList,
    'vendor': Building2,
    'viewer': Eye,
  };

  return roleIcons[roleName.toLowerCase()] || Shield;
}

export function RoleAvatar({ roleId, roleName, size = "md", className = "" }: RoleAvatarProps) {
  const gradient = getUserAvatarGradient(roleId);
  const IconComponent = getRoleIcon(roleName);
  const sizes = sizeClasses[size];

  return (
    <div
      className={`rounded-full flex items-center justify-center text-white ${sizes.container} ${className}`}
      style={{
        background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
      }}
      title={roleName}
    >
      <IconComponent className={sizes.icon} strokeWidth={2} />
    </div>
  );
}
