"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { BackendImage } from "@/components/ui/backend-image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle2,
  Plus,
  Eye,
  Building2,
  MapPin,
  User,
  Calendar,
  ArrowRight,
  Package,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { fetchCurrentVendor, Vendor } from "@/lib/services/vendors";

interface VendorDashboardProps {
  userName: string;
}

export function VendorDashboard({ userName }: VendorDashboardProps) {
  const t = useTranslations("vendorDashboard");
  const tOrders = useTranslations("orders");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const vendorData = await fetchCurrentVendor();
        setVendor(vendorData);
      } catch (error) {
        console.error("Failed to load vendor:", error);
        // Silently fail - vendor info is optional for dashboard display
      } finally {
        setIsLoading(false);
      }
    };

    loadVendor();
  }, []);

  const displayName = vendor
    ? locale === "ar"
      ? vendor.name_ar
      : vendor.name_en
    : userName;

  // Mock order stats - in production, fetch from API
  const orderStats = {
    total: 24,
    pending: 3,
    inTransit: 5,
    delivered: 16,
  };

  // Mock recent orders - in production, fetch from API
  const recentOrders = [
    {
      id: "ORD-2024-001",
      customer: "Ahmed Mohamed",
      status: "in_transit",
      amount: 450,
      date: new Date(),
    },
    {
      id: "ORD-2024-002",
      customer: "Sara Ibrahim",
      status: "pending",
      amount: 320,
      date: new Date(Date.now() - 86400000),
    },
    {
      id: "ORD-2024-003",
      customer: "Mohamed Ali",
      status: "delivered",
      amount: 780,
      date: new Date(Date.now() - 172800000),
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      in_transit: "default",
      pending: "secondary",
      delivered: "outline",
    };
    const colors: Record<string, string> = {
      in_transit: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
      pending: "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20",
      delivered: "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20",
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        {tOrders(status as "pending" | "in_transit" | "delivered")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-48 md:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-muted">
          {vendor?.cover_image ? (
            <BackendImage
              src={vendor.cover_image}
              alt=""
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>

        {/* Profile Content */}
        <div className="relative -mt-16 px-4 md:px-6">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start">
            {/* Logo */}
            <div className="relative shrink-0">
              <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-background shadow-xl ring-4 ring-background overflow-hidden flex items-center justify-center">
                {isLoading ? (
                  <Skeleton className="h-full w-full" />
                ) : vendor?.logo ? (
                  <BackendImage
                    src={vendor.logo}
                    alt={displayName}
                    width={112}
                    height={112}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-10 w-10 md:h-12 md:w-12 text-primary" />
                  </div>
                )}
              </div>
              {vendor?.status === "active" && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 ring-4 ring-background" />
              )}
            </div>

            {/* Welcome Text */}
            <div className="flex-1 pt-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t("welcome", { name: displayName })}
              </h1>
              <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
            </div>

            {/* Quick Action Button */}
            <div className="shrink-0 w-full md:w-auto">
              <Button asChild size="lg" className="w-full md:w-auto gap-2">
                <Link href="/dashboard/orders/new">
                  <Plus className="h-4 w-4" />
                  {t("createOrder")}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("thisMonthOrders")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("pendingOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-amber-600">{orderStats.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">{tOrders("pending")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("inTransitOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{orderStats.inTransit}</div>
            <p className="text-xs text-muted-foreground mt-1">{tOrders("inTransit")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("deliveredOrders")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-emerald-600">{orderStats.delivered}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("thisMonthOrders")}</p>
          </CardContent>
          <div className="absolute top-4 end-4">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("recentOrders")}</CardTitle>
                <CardDescription>{t("recentOrdersDesc")}</CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/orders" className="gap-2">
                  {t("viewAllOrders")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.customer}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {getStatusBadge(order.status)}
                      <div className="text-end">
                        <p className="font-medium">
                          {order.amount} {tCommon("egp")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.date.toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-medium">{t("noOrders")}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t("noOrdersDesc")}</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/orders/new">{t("createOrder")}</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions & Business Info */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("quickActions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Link href="/dashboard/orders/new">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Plus className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-start">
                    <p className="font-medium">{t("newOrder")}</p>
                    <p className="text-xs text-muted-foreground">{t("newOrderDesc")}</p>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Link href="/dashboard/orders">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-start">
                    <p className="font-medium">{t("trackOrders")}</p>
                    <p className="text-xs text-muted-foreground">{t("trackOrdersDesc")}</p>
                  </div>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 h-auto py-3">
                <Link href="/dashboard/my-vendor">
                  <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div className="text-start">
                    <p className="font-medium">{t("viewProfile")}</p>
                    <p className="text-xs text-muted-foreground">{t("viewProfileDesc")}</p>
                  </div>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Business Info */}
          {vendor && (
            <Card>
              <CardHeader>
                <CardTitle>{t("businessInfo")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("contactPerson")}</p>
                    <p className="font-medium">{vendor.contact_person}</p>
                  </div>
                </div>
                {vendor.city && vendor.governorate && (
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("location")}</p>
                      <p className="font-medium">
                        {locale === "ar" ? vendor.city.name_ar : vendor.city.name_en},{" "}
                        {locale === "ar" ? vendor.governorate.name_ar : vendor.governorate.name_en}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t("memberSince")}</p>
                    <p className="font-medium">
                      {new Date(vendor.created_at).toLocaleDateString(locale, {
                        year: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
