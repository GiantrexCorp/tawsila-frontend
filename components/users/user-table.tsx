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
import { UserAvatar } from "@/components/ui/user-avatar";
import { Edit, Eye, Mail, Phone, Shield } from "lucide-react";
import { User, getRoleDisplayName } from "@/lib/services/users";
import { getCurrentUser } from "@/lib/auth";

interface UserTableProps {
  users: User[];
  canUpdateUser: boolean;
}

export function UserTable({ users, canUpdateUser }: UserTableProps) {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const currentUser = getCurrentUser();

  const getDisplayName = (user: User) => {
    return locale === "ar" ? user.name_ar : user.name_en;
  };

  const getLocalizedRoleDisplay = (user: User) => {
    if (!user.roles || user.roles.length === 0) return t("noRole");
    return getRoleDisplayName(user.roles[0], locale);
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[250px]">{t("name")}</TableHead>
            <TableHead className="min-w-[200px]">{t("email")}</TableHead>
            <TableHead className="min-w-[140px]">{t("mobile")}</TableHead>
            <TableHead className="min-w-[150px]">{t("role")}</TableHead>
            <TableHead className="min-w-[100px]">{t("status")}</TableHead>
            <TableHead className="min-w-[120px]">{tCommon("createdOn")}</TableHead>
            <TableHead className="w-[100px]">{t("view")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/dashboard/users/${user.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    userId={user.id}
                    name={getDisplayName(user)}
                    role={user.roles?.[0]?.name}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getDisplayName(user)}</p>
                      {currentUser?.id === user.id && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                        >
                          {t("me")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="truncate">{user.email || t("noEmail")}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  <span dir="ltr">{user.mobile}</span>
                </div>
              </TableCell>
              <TableCell>
                {user.roles && user.roles.length > 0 ? (
                  <Badge variant="secondary" className="gap-1">
                    <Shield className="h-3 w-3" />
                    {getLocalizedRoleDisplay(user)}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t("noRole")}</Badge>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={user.status === "active" ? "default" : "secondary"}
                  className={
                    user.status === "active"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
                      : ""
                  }
                >
                  {user.status === "active" ? t("active") : t("inactive")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString(locale, {
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
                      router.push(`/dashboard/users/${user.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canUpdateUser && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/users/${user.id}/edit`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
