"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { BackendImage } from "@/components/ui/backend-image";
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
import { Building2, Edit, Eye, MapPin } from "lucide-react";
import type { Vendor } from "@/lib/services/vendors";

interface VendorTableProps {
  vendors: Vendor[];
  canUpdateVendor: boolean;
}

export function VendorTable({ vendors, canUpdateVendor }: VendorTableProps) {
  const t = useTranslations("organizations");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  return (
    <div className="rounded-lg border bg-card w-full overflow-hidden">
      <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[250px]">{t("nameEn")}</TableHead>
            <TableHead className="min-w-[150px]">{t("location")}</TableHead>
            <TableHead className="min-w-[120px]">{t("mobile")}</TableHead>
            <TableHead className="min-w-[100px]">{t("status")}</TableHead>
            <TableHead className="min-w-[120px]">{tCommon("createdOn")}</TableHead>
            <TableHead className="w-[100px]">{t("viewDetails")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {vendors.map((vendor) => (
            <TableRow
              key={vendor.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => router.push(`/dashboard/vendors/${vendor.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {vendor.logo ? (
                      <BackendImage
                        src={vendor.logo}
                        alt={locale === "ar" ? vendor.name_ar : vendor.name_en}
                        width={40}
                        height={40}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">
                      {locale === "ar" ? vendor.name_ar : vendor.name_en}
                    </p>
                    {vendor.contact_person && (
                      <p className="text-xs text-muted-foreground">{vendor.contact_person}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {vendor.city ? (
                  <div className="flex items-center gap-1.5 text-sm">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {locale === "ar" ? vendor.city.name_ar : vendor.city.name_en}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {vendor.mobile ? (
                  <span dir="ltr" className="text-sm">{vendor.mobile}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge
                  variant={vendor.status === "active" ? "default" : "secondary"}
                  className={
                    vendor.status === "active"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/30"
                      : ""
                  }
                >
                  {vendor.status === "active" ? t("activeOrgs") : t("inactiveOrgs")}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {vendor.created_at
                  ? new Date(vendor.created_at).toLocaleDateString(locale, {
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
                      router.push(`/dashboard/vendors/${vendor.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canUpdateVendor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/vendors/${vendor.id}/edit`);
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
    </div>
  );
}
