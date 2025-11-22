"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Building2,
  BarChart3,
  Settings,
  FileText,
  ChevronDown,
  Truck,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TawsilaLogo } from "@/components/branding/tawsila-logo";

export function AppSidebar() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const navigation = [
    {
      title: t('overview'),
      items: [
        {
          title: t('dashboard'),
          href: "/dashboard",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: t('management'),
      items: [
        {
          title: t('inventory'),
          href: "/dashboard/inventory",
          icon: Package,
        },
        {
          title: t('requests'),
          href: "/dashboard/requests",
          icon: FileText,
        },
        {
          title: t('orders'),
          href: "/dashboard/orders",
          icon: ShoppingCart,
        },
        {
          title: t('agents'),
          href: "/dashboard/agents",
          icon: Truck,
        },
        {
          title: t('organizations'),
          href: "/dashboard/organizations",
          icon: Building2,
        },
      ],
    },
    {
      title: t('analyticsSection'),
      items: [
        {
          title: t('analytics'),
          href: "/dashboard/analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      title: t('system'),
      items: [
        {
          title: t('users'),
          href: "/dashboard/users",
          icon: Users,
        },
        {
          title: t('settings'),
          href: "/dashboard/settings",
          icon: Settings,
        },
      ],
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <TawsilaLogo />
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link href={item.href} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-sidebar-accent"
              suppressHydrationWarning
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/avatar.png" alt="User" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left text-sm">
                <p className="font-medium">Admin User</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
