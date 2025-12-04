"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Clock, MoreVertical, UserPlus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchUsers, deleteUser, updateUser, createUser, User, UserFilters } from "@/lib/services/users";
import { getCurrentUser } from "@/lib/auth";
import { toast } from "sonner";
import { FilterBar, FilterConfig } from "@/components/ui/filter-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UsersPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  
  // Get current user for permission checks
  const currentUser = getCurrentUser();
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<UserFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    mobile: '',
    role: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    role: '',
    status: 'active' as 'active' | 'inactive',
  });

  // Get display name based on locale
  const getDisplayName = (user: User) => {
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

  // Check if current user is super admin
  const isSuperAdmin = () => {
    return currentUser?.roles?.includes('super-admin');
  };

  // Filter configuration - show name filter based on locale
  const filterConfigs: FilterConfig[] = [
    {
      key: 'id',
      label: t('id'),
      type: 'tags',
      placeholder: t('enterIdPlaceholder'),
    },
    // Show name_en only in English, name_ar only in Arabic
    ...(locale === 'ar' 
      ? [{
          key: 'name_ar',
          label: t('name'),
          type: 'text' as const,
          placeholder: t('searchByNamePlaceholder'),
        }]
      : [{
          key: 'name_en',
          label: t('name'),
          type: 'text' as const,
          placeholder: t('searchByNamePlaceholder'),
        }]
    ),
    {
      key: 'email',
      label: t('email'),
      type: 'text',
      placeholder: t('searchByEmailPlaceholder'),
    },
    {
      key: 'mobile',
      label: t('mobile'),
      type: 'text',
      placeholder: t('searchByMobilePlaceholder'),
    },
    {
      key: 'createdAtBetween',
      label: t('createdDateRange'),
      type: 'daterange',
      placeholder: '',
    },
    {
      key: 'status',
      label: t('status'),
      type: 'select',
      options: [
        { label: t('active'), value: 'active' },
        { label: t('inactive'), value: 'inactive' },
      ],
      placeholder: t('allStatus'),
    },
  ];

  useEffect(() => {
    loadUsers(currentPage, appliedFilters);
  }, [currentPage, appliedFilters]);

  const loadUsers = async (page: number, currentFilters: UserFilters) => {
    setIsLoading(true);
    try {
      const response = await fetchUsers(page, 50, currentFilters);
      setUsers(response.data);
      setTotalPages(response.meta.last_page);
      setTotal(response.meta.total);
    } catch (error: any) {
      console.error("Failed to load users:", error);
      toast.error(t('failedToLoad'), {
        description: error.message || tCommon('noData'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };


  const handleClearFilters = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // ONLY reset the input fields (local state)
    // Do NOT reset appliedFilters (which would trigger a search)
    setFilters({});
  };

  const handleClearAllFilters = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Clear both input fields AND applied filters (triggers search)
    setFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
  };

  const handleApplyFilters = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    // Apply the filters and trigger search
    setAppliedFilters(filters);
    setCurrentPage(1);
  };

  const handleRemoveFilter = (key: string) => {
    // Remove from local state
    const newFilters = { ...filters };
    delete newFilters[key];
    setFilters(newFilters);
    
    // Remove from applied filters AND fetch data
    const newAppliedFilters = { ...appliedFilters };
    delete newAppliedFilters[key];
    setAppliedFilters(newAppliedFilters);
    setCurrentPage(1);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      
      // Remove user from local state (optimistic update)
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setTotal(prev => prev - 1);
      
      toast.success(t('deleteSuccess'));
      setUserToDelete(null);
      
      // Reload users if current page is now empty
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(t('deleteFailed'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEditDialog = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      name_en: user.name_en,
      name_ar: user.name_ar,
      email: user.email || '',
      mobile: user.mobile,
      role: user.roles[0] || '',
      status: user.status,
    });
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    
    const updateData = {
      name: editFormData.name_en, // Main name field (required by backend)
      name_en: editFormData.name_en,
      name_ar: editFormData.name_ar,
      email: editFormData.email,
      mobile: editFormData.mobile,
      status: editFormData.status,
      roles: editFormData.role ? [editFormData.role] : [],
    };
    
    console.log('Sending update request:', updateData);
    
    setIsUpdating(true);
    try {
      const updatedUser = await updateUser(userToEdit.id, updateData);
      
      console.log('Updated user from API:', updatedUser);
      
      toast.success(t('updateSuccess'));
      setUserToEdit(null);
      
      // Reload the page data to ensure everything is in sync
      await loadUsers(currentPage, appliedFilters);
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error?.message || error?.error || t('updateFailed');
      toast.error(t('updateFailed'), {
        description: errorMessage,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleOpenAddDialog = () => {
    // Reset form
    setAddFormData({
      name_en: '',
      name_ar: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
      role: '',
      status: 'active',
    });
    setShowAddDialog(true);
  };

  const handleCreateUser = async () => {
    // Debug: Log current form data
    console.log('Current form data:', addFormData);

    // Validation
    if (!addFormData.name_en || !addFormData.name_ar || !addFormData.email || 
        !addFormData.mobile || !addFormData.password || !addFormData.role) {
      toast.error(t('fillAllFields'));
      console.error('Validation failed - missing fields:', {
        name_en: !!addFormData.name_en,
        name_ar: !!addFormData.name_ar,
        email: !!addFormData.email,
        mobile: !!addFormData.mobile,
        password: !!addFormData.password,
        role: !!addFormData.role,
      });
      return;
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    const createData = {
      name: addFormData.name_en,
      name_en: addFormData.name_en,
      name_ar: addFormData.name_ar,
      email: addFormData.email,
      mobile: addFormData.mobile,
      password: addFormData.password,
      status: addFormData.status,
      roles: [addFormData.role],
    };

    console.log('Sending create request with data:', createData);
    console.log('Stringified:', JSON.stringify(createData));

    setIsCreating(true);
    try {
      await createUser(createData);
      
      toast.success(t('createSuccess'));
      setShowAddDialog(false);
      
      // Reload the page data
      await loadUsers(currentPage, appliedFilters);
    } catch (error: any) {
      console.error('Error creating user:', error);
      const errorMessage = error?.message || error?.error || t('createFailed');
      toast.error(t('createFailed'), {
        description: errorMessage,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleBadge = (roles: string[]) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">{t('noRole')}</Badge>;
    }
    
    const role = roles[0];
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      "super-admin": "default",
      admin: "default",
      manager: "secondary",
      viewer: "outline",
    };
    
    // Format role for display (e.g., "super-admin" -> "Super Admin")
    const formattedRole = role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return <Badge variant={variants[role] || "outline"}>{formattedRole}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
          {t(status)}
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
        {t(status)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">{t('loadingUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('totalUsers', { count: total })}
          </p>
        </div>
        {isSuperAdmin() && (
          <Button className="w-full sm:w-auto" onClick={handleOpenAddDialog}>
            <UserPlus className="h-4 w-4 me-2" />
            {t('addUser')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        filterConfigs={filterConfigs}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        onClearAllFilters={handleClearAllFilters}
        onApplyFilters={handleApplyFilters}
        onRemoveFilter={handleRemoveFilter}
        defaultFilters={[locale === 'ar' ? 'name_ar' : 'name_en']}
      />

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => {
          const displayName = getDisplayName(user);
          return (
          <Card key={user.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{displayName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {getRoleBadge(user.roles)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isSuperAdmin() && (
                      <DropdownMenuItem onClick={() => handleOpenEditDialog(user)}>
                        {tCommon('edit')}
                      </DropdownMenuItem>
                    )}
                    {isSuperAdmin() && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => setUserToDelete(user)}
                      >
                        {tCommon('delete')}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{user.email || t('noEmail')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{user.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t('lastActive')}: {user.last_active ? new Date(user.last_active).toLocaleString() : t('never')}
                </span>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t('page')} {currentPage} {t('of')} {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 me-1" />
              {t('previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {t('next')}
              <ChevronRight className="h-4 w-4 ms-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('totalUsersLabel')}</p>
            <p className="text-2xl font-bold">{total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('activeUsers')}</p>
            <p className="text-2xl font-bold">
              {users.filter(u => u.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('inactiveUsers')}</p>
            <p className="text-2xl font-bold">
              {users.filter(u => u.status === 'inactive').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteUser')}</AlertDialogTitle>
            <AlertDialogDescription>
              {userToDelete && t('deleteUserDesc', { name: getDisplayName(userToDelete) })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              {tCommon('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
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

      {/* Edit User Dialog */}
      <Dialog open={!!userToEdit} onOpenChange={() => setUserToEdit(null)}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
            <DialogDescription>{t('editUserDetails')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Name English */}
            <div className="grid gap-2">
              <Label htmlFor="name_en">{t('nameEnglish')}</Label>
              <Input
                id="name_en"
                value={editFormData.name_en}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name_en: e.target.value }))}
                disabled={isUpdating}
              />
            </div>

            {/* Name Arabic */}
            <div className="grid gap-2">
              <Label htmlFor="name_ar">{t('nameArabic')}</Label>
              <Input
                id="name_ar"
                value={editFormData.name_ar}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                disabled={isUpdating}
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isUpdating}
              />
            </div>

            {/* Mobile */}
            <div className="grid gap-2">
              <Label htmlFor="mobile">{t('mobile')}</Label>
              <Input
                id="mobile"
                value={editFormData.mobile}
                onChange={(e) => setEditFormData(prev => ({ ...prev, mobile: e.target.value }))}
                disabled={isUpdating}
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">{t('role')}</Label>
              <Select
                value={editFormData.role}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, role: value }))}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super-admin">{t('superAdmin')}</SelectItem>
                  <SelectItem value="admin">{t('admin')}</SelectItem>
                  <SelectItem value="manager">{t('manager')}</SelectItem>
                  <SelectItem value="viewer">{t('viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">{t('status')}</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value: 'active' | 'inactive') => setEditFormData(prev => ({ ...prev, status: value }))}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToEdit(null)}
              disabled={isUpdating}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleUpdateUser}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('updating')}
                </>
              ) : (
                tCommon('save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{t('addUserTitle')}</DialogTitle>
            <DialogDescription>{t('addUserDescription')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Name English */}
            <div className="grid gap-2">
              <Label htmlFor="add_name_en">{t('nameEnglish')} *</Label>
              <Input
                id="add_name_en"
                value={addFormData.name_en}
                onChange={(e) => setAddFormData(prev => ({ ...prev, name_en: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Name Arabic */}
            <div className="grid gap-2">
              <Label htmlFor="add_name_ar">{t('nameArabic')} *</Label>
              <Input
                id="add_name_ar"
                value={addFormData.name_ar}
                onChange={(e) => setAddFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="add_email">{t('email')} *</Label>
              <Input
                id="add_email"
                type="email"
                value={addFormData.email}
                onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Mobile */}
            <div className="grid gap-2">
              <Label htmlFor="add_mobile">{t('mobile')} *</Label>
              <Input
                id="add_mobile"
                value={addFormData.mobile}
                onChange={(e) => setAddFormData(prev => ({ ...prev, mobile: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="add_password">{t('password')} *</Label>
              <Input
                id="add_password"
                type="password"
                value={addFormData.password}
                onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="add_confirm_password">{t('confirmPassword')} *</Label>
              <Input
                id="add_confirm_password"
                type="password"
                value={addFormData.confirmPassword}
                onChange={(e) => setAddFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={isCreating}
                required
              />
            </div>

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="add_role">{t('role')} *</Label>
              <Select
                value={addFormData.role}
                onValueChange={(value) => setAddFormData(prev => ({ ...prev, role: value }))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super-admin">{t('superAdmin')}</SelectItem>
                  <SelectItem value="admin">{t('admin')}</SelectItem>
                  <SelectItem value="manager">{t('manager')}</SelectItem>
                  <SelectItem value="viewer">{t('viewer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="grid gap-2">
              <Label htmlFor="add_status">{t('status')}</Label>
              <Select
                value={addFormData.status}
                onValueChange={(value: 'active' | 'inactive') => setAddFormData(prev => ({ ...prev, status: value }))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isCreating}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleCreateUser}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('creating')}
                </>
              ) : (
                t('addUser')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

