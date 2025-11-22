"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, TrendingUp, Package, DollarSign, Star, Trophy } from "lucide-react";
import { agents, orders, products } from "@/lib/mock-data";

export default function AnalyticsPage() {
  const t = useTranslations('analyticsPage');
  const tCommon = useTranslations('common');

  // Calculate metrics
  const completedOrders = orders.filter(o => o.status === 'delivered').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const avgDeliveryTime = 45; // Mock average in minutes
  const successRate = ((completedOrders / orders.length) * 100).toFixed(1);

  // Top agents by deliveries
  const topAgents = [...agents]
    .sort((a, b) => b.totalDeliveries - a.totalDeliveries)
    .slice(0, 5);

  // Top products (mock sales data)
  const topProducts = [
    { product: products[2], sold: 67, revenue: 80400 },
    { product: products[1], sold: 32, revenue: 304000 },
    { product: products[0], sold: 45, revenue: 112500 },
    { product: products[6], sold: 28, revenue: 117600 },
    { product: products[5], sold: 24, revenue: 20400 },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('avgDeliveryTime')}
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryTime}</div>
            <p className="text-xs text-muted-foreground">{t('minutes')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('successRate')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {completedOrders}/{orders.length} {t('deliveries')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalRevenue')}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('ordersCompleted')}
            </CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">{t('thisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="agents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="agents">{t('agentPerformance')}</TabsTrigger>
          <TabsTrigger value="products">{t('topSellingProducts')}</TabsTrigger>
          <TabsTrigger value="delivery">{t('deliveryPerformance')}</TabsTrigger>
        </TabsList>

        {/* Top Agents */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>{t('topPerformingAgents')}</CardTitle>
              <CardDescription>
                Based on total deliveries completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.map((agent, index) => (
                  <div
                    key={agent.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${
                          index === 0
                            ? "bg-yellow-500 text-white"
                            : index === 1
                            ? "bg-gray-400 text-white"
                            : index === 2
                            ? "bg-orange-600 text-white"
                            : "bg-secondary"
                        }`}
                      >
                        {index === 0 ? <Trophy className="h-5 w-5" /> : index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm text-muted-foreground">{agent.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{agent.totalDeliveries}</p>
                      <p className="text-xs text-muted-foreground">{t('deliveries')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Products */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>{t('topSellingProducts')}</CardTitle>
              <CardDescription>
                Best performing products this month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((item, index) => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.sold} units sold
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{item.revenue.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{tCommon('egp')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Performance */}
        <TabsContent value="delivery">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('deliveryPerformance')}</CardTitle>
                <CardDescription>
                  Current month statistics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('today')}</span>
                    <span className="text-lg font-semibold">12 {t('deliveries')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('thisWeek')}</span>
                    <span className="text-lg font-semibold">87 {t('deliveries')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('thisMonth')}</span>
                    <span className="text-lg font-semibold">248 {t('deliveries')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('revenueOverview')}</CardTitle>
                <CardDescription>
                  Revenue breakdown
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('today')}</span>
                    <span className="text-lg font-semibold">6,200 {tCommon('egp')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('thisWeek')}</span>
                    <span className="text-lg font-semibold">45,800 {tCommon('egp')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('thisMonth')}</span>
                    <span className="text-lg font-semibold">{totalRevenue.toLocaleString()} {tCommon('egp')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
