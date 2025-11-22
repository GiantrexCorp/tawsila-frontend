"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, AlertCircle } from "lucide-react";
import { products } from "@/lib/mock-data";

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStockStatus = (product: typeof products[0]) => {
    if (product.quantity === 0) {
      return { label: t('outOfStock'), variant: "destructive" as const, color: "text-red-600" };
    } else if (product.quantity < product.minStock) {
      return { label: t('lowStock'), variant: "secondary" as const, color: "text-orange-600" };
    }
    return { label: t('inStock'), variant: "outline" as const, color: "text-green-600" };
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
        <p className="text-xs md:text-sm text-muted-foreground mt-1 italic">
          💡 {t('note')}
        </p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchProducts')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Products Grid - No Images */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((product) => {
          const stockStatus = getStockStatus(product);
          return (
            <Card key={product.id} className="flex flex-col h-[240px]">
              <CardContent className="p-4 flex flex-col h-full">
                <div className="space-y-2 flex-1">
                  <div className="flex items-start justify-between min-h-[48px]">
                    <CardTitle className="text-base leading-tight">{product.name}</CardTitle>
                    {product.quantity < product.minStock && (
                      <AlertCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('sku')}: {product.sku}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                    <span className={`text-sm font-medium ${stockStatus.color}`}>
                      {product.quantity} {t('units')}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 mt-auto pt-4">
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-xs sm:text-sm text-muted-foreground">{t('price')}</span>
                    <span className="text-xs sm:text-sm font-semibold">{product.price} {tCommon('egp')}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm h-8">
                      {t('edit')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs sm:text-sm h-8">
                      {t('restock')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
