"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Warehouse, Plus, Loader2, MapPin, Phone, Edit, Trash2, Search, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchInventories, deleteInventory, type Inventory } from "@/lib/services/inventories";
import { getCurrentUser } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function InventoryPage() {
  const t = useTranslations('inventory');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  
  // Check if user has permission to access inventory page
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager']);

  // Inventories state
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryToDelete, setInventoryToDelete] = useState<Inventory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load inventories on mount
  useEffect(() => {
    const loadInventories = async () => {
      setIsLoading(true);
      try {
        const fetchedInventories = await fetchInventories();
        setInventories(fetchedInventories);
      } catch {
        toast.error(t('errorLoadingInventories'));
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadInventories();
    }
  }, [hasPermission, t]);

  // Filter inventories based on search query
  const filteredInventories = inventories.filter((inventory) => {
    const searchLower = searchQuery.toLowerCase();
    const nameEn = (inventory.name_en || '').toLowerCase();
    const nameAr = (inventory.name_ar || '').toLowerCase();
    const name = (inventory.name || '').toLowerCase();
    const address = (inventory.address || '').toLowerCase();
    const phone = (inventory.phone || '').toLowerCase();
    
    return (
      nameEn.includes(searchLower) ||
      nameAr.includes(searchLower) ||
      name.includes(searchLower) ||
      address.includes(searchLower) ||
      phone.includes(searchLower)
    );
  });

  const handleDelete = async () => {
    if (!inventoryToDelete) return;

    setIsDeleting(true);
    try {
      await deleteInventory(inventoryToDelete.id);
      
      // Refresh the inventory list from the server to ensure we have the actual state
      // This will reveal if the backend didn't actually delete the inventory
      const fetchedInventories = await fetchInventories();
      setInventories(fetchedInventories);
      
      setInventoryToDelete(null);
      toast.success(t('inventoryDeletedSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errorDeletingInventory');
      toast.error(t('deleteFailed'), { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentUser = getCurrentUser();
  const isSuperAdmin = currentUser?.roles?.includes('super-admin') || false;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        {isSuperAdmin && (
          <Button className="w-full sm:w-auto gap-2" onClick={() => router.push('/dashboard/inventory/new')}>
            <Plus className="h-4 w-4" />
            {t('createInventory')}
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('totalInventories')}</p>
            <p className="text-2xl font-bold">{isLoading ? '-' : inventories.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('activeInventories')}</p>
            <p className="text-2xl font-bold text-green-600">
              {isLoading ? '-' : inventories.filter(inv => inv.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('inactiveInventories')}</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {isLoading ? '-' : inventories.filter(inv => inv.status === 'inactive').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchInventories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-9"
          />
        </div>
      </div>

      {/* Inventories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredInventories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Warehouse className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t('noInventories')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t('noInventoriesDesc')}</p>
            {isSuperAdmin && (
              <Button onClick={() => router.push('/dashboard/inventory/new')} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('createInventory')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredInventories.map((inventory) => {
            const displayName = locale === 'ar' && inventory.name_ar 
              ? inventory.name_ar 
              : inventory.name_en || inventory.name || t('unnamedInventory');
            
            return (
              <div
                key={inventory.id}
                onClick={() => router.push(`/dashboard/inventory/${inventory.id}`)}
                className="group relative cursor-pointer"
              >
                {/* Card Container with glassmorphism */}
                <div className="relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden transition-all duration-500 ease-out group-hover:border-primary/30 group-hover:shadow-xl group-hover:shadow-primary/5 group-hover:-translate-y-1">

                  {/* Gradient Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Top Section - Icon & Name */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="relative flex-shrink-0">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-muted to-muted/50 overflow-hidden ring-1 ring-border/50 transition-transform duration-300 group-hover:scale-105">
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Warehouse className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                      </div>

                      {/* Name & Location */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors duration-300">
                          {displayName}
                        </h3>
                        {inventory.code && (
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                            {inventory.code}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {/* Status Badge */}
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            inventory.status === 'active' || inventory.is_active
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : 'bg-zinc-500/20 text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {inventory.status === 'active' || inventory.is_active ? t('active') : t('inactive')}
                          </div>
                          {inventory.city && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="text-xs truncate">
                                {locale === 'ar' ? inventory.city.name_ar : inventory.city.name_en}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-5 pb-3">
                    {inventory.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground/80 mb-2">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        <span dir="ltr" className="truncate text-xs">{inventory.phone}</span>
                      </div>
                    )}
                    {inventory.address && (
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                        {inventory.address}
                      </p>
                    )}
                  </div>

                  {/* Created Date Badge */}
                  {inventory.created_at && (
                    <div className="px-5 pb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/50 text-[11px] text-muted-foreground">
                        <span className="font-medium">{tCommon('createdOn')}</span>
                        <span>{new Date(inventory.created_at).toLocaleDateString(locale, { year: 'numeric', month: 'short' })}</span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Action Bar */}
                  <div className="px-5 pb-4 pt-2 border-t border-border/40 relative z-10">
                    <div className="flex items-center justify-between">
                      {/* Edit Button */}
                      {isSuperAdmin ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity relative z-20"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            router.push(`/dashboard/inventory/${inventory.id}/edit`);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5 me-1.5" />
                          {t('edit')}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/60 font-medium">
                          {t('viewDetails')}
                        </span>
                      )}
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:scale-110">
                        <ArrowUpRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!inventoryToDelete} onOpenChange={(open) => !open && setInventoryToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteInventory')}</DialogTitle>
            <DialogDescription>
              {t('deleteInventoryDesc', { 
                name: inventoryToDelete 
                  ? (locale === 'ar' && inventoryToDelete.name_ar 
                      ? inventoryToDelete.name_ar 
                      : inventoryToDelete.name_en || inventoryToDelete.name || t('unnamedInventory'))
                  : ''
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInventoryToDelete(null)}
              disabled={isDeleting}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t('delete')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
