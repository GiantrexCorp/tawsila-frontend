"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleAvatar } from "@/components/ui/role-avatar";
import { Edit, Eye, Key, Users } from "lucide-react";

interface Role {
  id: number;
  name: string;
  guard_name: string;
  slug_en: string | null;
  slug_ar: string | null;
  permissions?: { id: number; name: string }[];
  users_count?: number;
  created_at: string;
}

interface RoleTableProps {
  roles: Role[];
  canUpdateRole: boolean;
}

export function RoleTable({ roles, canUpdateRole }: RoleTableProps) {
  const t = useTranslations("roles");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  const getRoleDisplayName = (role: Role) => {
    const slug = locale === "ar" ? role.slug_ar : role.slug_en;
    if (slug) return slug;
    if (!role.name) return "";
    return role.name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">{t("roleName")}</TableHead>
            <TableHead className="min-w-[100px]">{t("guardName")}</TableHead>
            <TableHead className="min-w-[150px]">{t("permissions")}</TableHead>
            <TableHead className="min-w-[120px]">{t("usersSection")}</TableHead>
            <TableHead className="min-w-[120px]">{tCommon("createdOn")}</TableHead>
            <TableHead className="w-[100px]">{t("view")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => {
            const displayName = getRoleDisplayName(role);
            const permissionCount = role.permissions?.length || 0;
            const usersCount = role.users_count || 0;

            return (
              <TableRow
                key={role.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/dashboard/roles/${role.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <RoleAvatar roleId={role.id} roleName={role.name} size="sm" />
                    <p className="font-medium">{displayName}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {role.guard_name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("permissionCount", { count: permissionCount })}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-sm">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{t("usersWithRole", { count: usersCount })}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {role.created_at
                    ? new Date(role.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/roles/${role.id}`);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canUpdateRole && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/roles/${role.id}/edit`);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
