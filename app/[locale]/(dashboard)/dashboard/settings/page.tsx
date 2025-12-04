"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Plus, Loader2, MoreVertical } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth";
import { fetchRoles, createRole, updateRole, deleteRole, Role } from "@/lib/services/roles";
import { fetchPermissions, Permission } from "@/lib/services/permissions";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  
  const currentUser = getCurrentUser();
  const isSuperAdmin = () => currentUser?.roles?.includes('super-admin');

  // Check if user has permission to access settings page
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'viewer', 'inventory-manager', 'order-preparer']);

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  
  // Add/Edit Role Dialog
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleFormData, setRoleFormData] = useState({
    name: '',
    slug_en: '',
    slug_ar: '',
    permissions: [] as number[], // Permission IDs
  });
  const [roleFormErrors, setRoleFormErrors] = useState<Record<string, string>>({});
  
  // Delete Role Dialog
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (hasPermission) {
      loadRoles();
      loadPermissions();
    }
  }, [hasPermission]);

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const response = await fetchRoles();
      setRoles(response.data);
    } catch (error: any) {
      console.error("Failed to load roles:", error);
      toast.error(t('failedToLoadRoles'), {
        description: error.message || tCommon('tryAgain'),
      });
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const loadPermissions = async () => {
    setIsLoadingPermissions(true);
    try {
      const response = await fetchPermissions();
      setPermissions(response.data);
    } catch (error: any) {
      console.error("Failed to load permissions:", error);
      toast.error(t('failedToLoadPermissions'), {
        description: error.message || tCommon('tryAgain'),
      });
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const handleOpenAddRoleDialog = () => {
    setEditingRole(null);
    setRoleFormData({
      name: '',
      slug_en: '',
      slug_ar: '',
      permissions: [],
    });
    setRoleFormErrors({});
    setShowRoleDialog(true);
  };

  const handleOpenEditRoleDialog = (role: Role) => {
    setEditingRole(role);
    // Convert permission names to IDs
    const permissionIds = (role.permissions || [])
      .map(permName => permissions.find(p => p.name === permName)?.id)
      .filter((id): id is number => id !== undefined);
    
    setRoleFormData({
      name: role.name,
      slug_en: role.slug_en || '',
      slug_ar: role.slug_ar || '',
      permissions: permissionIds,
    });
    setRoleFormErrors({});
    setShowRoleDialog(true);
  };

  const handleSaveRole = async () => {
    const errors: Record<string, string> = {};
    if (!roleFormData.name) errors.name = t('nameRequired');
    if (!roleFormData.slug_en) errors.slug_en = t('slugEnRequired');
    if (!roleFormData.slug_ar) errors.slug_ar = t('slugArRequired');

    if (Object.keys(errors).length > 0) {
      setRoleFormErrors(errors);
      return;
    }

    setIsSavingRole(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, roleFormData);
        toast.success(t('roleUpdateSuccess'));
      } else {
        await createRole(roleFormData);
        toast.success(t('roleCreateSuccess'));
      }
      setShowRoleDialog(false);
      loadRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      if (error.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(error.errors).forEach(([key, messages]) => {
          backendErrors[key] = (messages as string[])[0];
        });
        setRoleFormErrors(backendErrors);
      }
      toast.error(editingRole ? t('roleUpdateFailed') : t('roleCreateFailed'), {
        description: error.message || tCommon('tryAgain'),
      });
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!roleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      toast.success(t('roleDeleteSuccess'));
      setRoleToDelete(null);
      loadRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      toast.error(t('roleDeleteFailed'), {
        description: error.message || tCommon('tryAgain'),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setRoleFormData(prev => {
      const permissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId];
      return { ...prev, permissions };
    });
  };

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <Tabs defaultValue="roles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="roles">{t('rolesTab')}</TabsTrigger>
          <TabsTrigger value="permissions">{t('permissionsTab')}</TabsTrigger>
        </TabsList>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t('rolesTitle')}</CardTitle>
                  <CardDescription>{t('rolesDescription')}</CardDescription>
                </div>
                {isSuperAdmin() && (
                  <Button onClick={handleOpenAddRoleDialog}>
                    <Plus className="h-4 w-4 me-2" />
                    {t('addRole')}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRoles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('id')}</TableHead>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('slug')}</TableHead>
                        <TableHead>{t('permissions')}</TableHead>
                        <TableHead>{t('createdAt')}</TableHead>
                        {isSuperAdmin() && (
                          <TableHead className="text-end">{t('actions')}</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {t('noRoles')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium">{role.id}</TableCell>
                            <TableCell>{role.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {(locale === 'ar' ? role.slug_ar : role.slug_en) || '-'}
                            </TableCell>
                            <TableCell>{role.permissions?.length || 0}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(role.created_at).toLocaleDateString()}
                            </TableCell>
                            {isSuperAdmin() && (
                              <TableCell className="text-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenEditRoleDialog(role)}>
                                      {tCommon('edit')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-red-600"
                                      onClick={() => setRoleToDelete(role)}
                                    >
                                      {tCommon('delete')}
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('permissionsTitle')}</CardTitle>
              <CardDescription>{t('permissionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('id')}</TableHead>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead>{t('guardName')}</TableHead>
                        <TableHead>{t('createdAt')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {permissions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            {t('noPermissions')}
                          </TableCell>
                        </TableRow>
                      ) : (
                        permissions.map((permission) => (
                          <TableRow key={permission.id}>
                            <TableCell className="font-medium">{permission.id}</TableCell>
                            <TableCell>{permission.name}</TableCell>
                            <TableCell className="text-muted-foreground">{permission.guard_name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(permission.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingRole ? t('editRole') : t('addRole')}</DialogTitle>
            <DialogDescription>
              {editingRole ? t('editRoleDesc') : t('addRoleDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="name">{t('name')} *</Label>
              <Input
                id="name"
                value={roleFormData.name}
                onChange={(e) => {
                  setRoleFormData(prev => ({ ...prev, name: e.target.value }));
                  setRoleFormErrors(prev => ({ ...prev, name: '' }));
                }}
                disabled={isSavingRole}
                className={roleFormErrors.name ? "border-red-500" : ""}
              />
              {roleFormErrors.name && (
                <p className="text-sm text-red-500">{roleFormErrors.name}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug_en">{t('slugEnglish')} *</Label>
              <Input
                id="slug_en"
                value={roleFormData.slug_en}
                onChange={(e) => {
                  setRoleFormData(prev => ({ ...prev, slug_en: e.target.value }));
                  setRoleFormErrors(prev => ({ ...prev, slug_en: '' }));
                }}
                disabled={isSavingRole}
                placeholder="agent"
                className={roleFormErrors.slug_en ? "border-red-500" : ""}
              />
              {roleFormErrors.slug_en && (
                <p className="text-sm text-red-500">{roleFormErrors.slug_en}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="slug_ar">{t('slugArabic')} *</Label>
              <Input
                id="slug_ar"
                value={roleFormData.slug_ar}
                onChange={(e) => {
                  setRoleFormData(prev => ({ ...prev, slug_ar: e.target.value }));
                  setRoleFormErrors(prev => ({ ...prev, slug_ar: '' }));
                }}
                disabled={isSavingRole}
                placeholder="وكيل"
                className={roleFormErrors.slug_ar ? "border-red-500" : ""}
              />
              {roleFormErrors.slug_ar && (
                <p className="text-sm text-red-500">{roleFormErrors.slug_ar}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>{t('permissionsLabel')}</Label>
              <div className="text-sm text-muted-foreground mb-2">
                {t('permissionsNote')}
              </div>
              <div className="grid gap-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                {permissions.map(permission => (
                  <label key={permission.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={roleFormData.permissions.includes(permission.id)}
                      onChange={() => handlePermissionToggle(permission.id)}
                      disabled={isSavingRole}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{permission.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              disabled={isSavingRole}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveRole}
              disabled={isSavingRole}
            >
              {isSavingRole ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('saving')}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role Confirmation */}
      <AlertDialog open={!!roleToDelete} onOpenChange={() => setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteRole')}</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToDelete && t('deleteRoleDesc', { name: roleToDelete.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRole}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                tCommon('delete')
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
