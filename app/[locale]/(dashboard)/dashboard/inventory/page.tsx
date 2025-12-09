"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Warehouse, Plus, Loader2, MapPin, Phone, Edit, Trash2, Search } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

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
      } catch (error) {
        console.error('Failed to load inventories:', error);
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
      toast.success(t('inventoryDeletedSuccess'));
      setInventories(inventories.filter(inv => inv.id !== inventoryToDelete.id));
      setInventoryToDelete(null);
    } catch (error) {
      console.error('Failed to delete inventory:', error);
      const errorMessage = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : t('errorDeletingInventory');
      toast.error(t('deleteFailed'), {
        description: errorMessage,
      });
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
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('searchInventories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInventories.map((inventory) => {
            const displayName = locale === 'ar' && inventory.name_ar 
              ? inventory.name_ar 
              : inventory.name_en || inventory.name || t('unnamedInventory');
            
            return (
              <Card key={inventory.id} className="flex flex-col">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Warehouse className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                        <Badge 
                          variant={inventory.status === 'active' ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {inventory.status === 'active' ? t('active') : t('inactive')}
                        </Badge>
                      </div>
                    </div>
                    {isSuperAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/inventory/${inventory.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setInventoryToDelete(inventory)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="space-y-3 flex-1">
                    {inventory.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 flex-shrink-0" />
                        <span dir="ltr" className="truncate">{inventory.phone}</span>
                      </div>
                    )}
                    {inventory.address && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{inventory.address}</span>
                      </div>
                    )}
                    {(inventory.latitude != null && inventory.longitude != null && 
                      typeof inventory.latitude === 'number' && typeof inventory.longitude === 'number') && (
                      <div className="text-xs text-muted-foreground">
                        {t('coordinates')}: {inventory.latitude.toFixed(4)}, {inventory.longitude.toFixed(4)}
                      </div>
                    )}
                  </div>

                  {isSuperAdmin && (
                    <div className="mt-4 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => router.push(`/dashboard/inventory/${inventory.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                        {t('edit')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
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
