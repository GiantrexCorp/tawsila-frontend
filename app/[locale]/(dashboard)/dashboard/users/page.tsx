"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Phone, Clock, MoreVertical, UserPlus, ChevronLeft, ChevronRight, Loader2, Eye, Calendar, Shield } from "lucide-react";
import { fetchUsers, updateUser, createUser, changeUserPassword, assignUserRole, User, UserFilters } from "@/lib/services/users";
import { fetchRoles, Role } from "@/lib/services/roles";
import { usePagePermission } from "@/hooks/use-page-permission";
import { getCurrentUser, logout } from "@/lib/auth";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { FilterBar, FilterConfig } from "@/components/ui/filter-bar";
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
  const router = useRouter();
  
  // Get current user for permission checks
  const currentUser = getCurrentUser();
  
  // Check if user has permission to access users page
  const hasPermission = usePagePermission(['super-admin', 'admin', 'inventory-manager']);
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<UserFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<UserFilters>({});
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    mobile: '',
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
    roleId: null as number | null,
    status: 'active' as 'active' | 'inactive',
  });
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordFormData, setPasswordFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [userToView, setUserToView] = useState<User | null>(null);
  const [userToAssignRole, setUserToAssignRole] = useState<User | null>(null);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  // Get display name based on locale
  const getDisplayName = (user: User) => {
    return locale === 'ar' ? user.name_ar : user.name_en;
  };

  // Check if current user is super admin
  const isSuperAdmin = () => {
    const isSuper = currentUser?.roles?.includes('super-admin');
    console.log('isSuperAdmin check:', { 
      currentUser: currentUser?.name, 
      roles: currentUser?.roles, 
      isSuperAdmin: isSuper 
    });
    return isSuper;
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
    if (hasPermission) {
      loadUsers(currentPage, appliedFilters);
      loadRoles();
    }
  }, [currentPage, appliedFilters, hasPermission]);

  const loadRoles = async () => {
    try {
      const response = await fetchRoles();
      console.log('Loaded roles:', response.data);
      console.log('First role permissions type:', typeof response.data[0]?.permissions);
      console.log('First role permissions:', response.data[0]?.permissions);
      setAvailableRoles(response.data);
    } catch (error: any) {
      console.error("Failed to load roles:", error);
    }
  };

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

  const handleOpenEditDialog = (user: User) => {
    setUserToEdit(user);
    setEditFormData({
      name_en: user.name_en,
      name_ar: user.name_ar,
      email: user.email || '',
      mobile: user.mobile,
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

  const handleOpenAssignRoleDialog = (user: User) => {
    setUserToAssignRole(user);
    setSelectedRoleId(user.roles && user.roles.length > 0 ? 
      availableRoles.find(r => r.name === user.roles[0])?.id || null : null
    );
  };

  const handleAssignRole = async () => {
    if (!userToAssignRole || !selectedRoleId) return;

    console.log('Assigning role:', {
      userId: userToAssignRole.id,
      roleId: selectedRoleId,
      userName: userToAssignRole.name,
      selectedRole: availableRoles.find(r => r.id === selectedRoleId)
    });

    setIsAssigningRole(true);
    try {
      await assignUserRole(userToAssignRole.id, selectedRoleId);
      toast.success(t('assignRoleSuccess'));
      setUserToAssignRole(null);
      setSelectedRoleId(null);
      
      // Reload users to reflect role changes
      await loadUsers(currentPage, appliedFilters);
    } catch (error: any) {
      console.error('Error assigning role:', error);
      console.error('Full error details:', JSON.stringify(error, null, 2));
      toast.error(t('assignRoleFailed'), {
        description: error.message || tCommon('tryAgain'),
      });
    } finally {
      setIsAssigningRole(false);
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
      roleId: null,
      status: 'active',
    });
    setShowAddDialog(true);
  };

  const handleCreateUser = async () => {
    // Debug: Log current form data
    console.log('Current form data:', addFormData);

    // Validation
    if (!addFormData.name_en || !addFormData.name_ar || !addFormData.email || 
        !addFormData.mobile || !addFormData.password || !addFormData.roleId) {
      toast.error(t('fillAllFields'));
      console.error('Validation failed - missing fields:', {
        name_en: !!addFormData.name_en,
        name_ar: !!addFormData.name_ar,
        email: !!addFormData.email,
        mobile: !!addFormData.mobile,
        password: !!addFormData.password,
        roleId: !!addFormData.roleId,
      });
      return;
    }

    if (addFormData.password !== addFormData.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    // Create user first
    const createData = {
      name: addFormData.name_en,
      name_en: addFormData.name_en,
      name_ar: addFormData.name_ar,
      email: addFormData.email,
      mobile: addFormData.mobile,
      password: addFormData.password,
      status: addFormData.status,
    };

    console.log('Sending create request with data:', createData);
    console.log('Stringified:', JSON.stringify(createData));

    setIsCreating(true);
    try {
      const newUser = await createUser(createData);
      
      // Assign role to the newly created user
      if (addFormData.roleId) {
        console.log('Assigning role to new user:', {
          userId: newUser.id,
          roleId: addFormData.roleId,
        });
        await assignUserRole(newUser.id, addFormData.roleId);
      }
      
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

  const handleOpenChangePasswordDialog = (user: User) => {
    setUserToChangePassword(user);
    setPasswordFormData({
      password: '',
      confirmPassword: '',
    });
  };

  const handleChangePassword = async () => {
    if (!userToChangePassword) return;

    // Validation
    if (!passwordFormData.password) {
      toast.error(t('passwordRequired'));
      return;
    }

    if (passwordFormData.password !== passwordFormData.confirmPassword) {
      toast.error(t('passwordMismatch'));
      return;
    }

    if (passwordFormData.password.length < 6) {
      toast.error(t('passwordTooShort'));
      return;
    }

    const isOwnPassword = userToChangePassword.id === currentUser?.id;

    setIsChangingPassword(true);
    try {
      await changeUserPassword(
        userToChangePassword.id,
        passwordFormData.password,
        passwordFormData.confirmPassword
      );

      toast.success(t('passwordChangeSuccess'));
      setUserToChangePassword(null);
      setPasswordFormData({ password: '', confirmPassword: '' });

      // If changing own password, logout immediately
      if (isOwnPassword) {
        toast.info(t('ownPasswordChanged'), {
          description: t('pleaseLoginAgain'),
        });
        
        // Small delay to show the toast before logout
        setTimeout(() => {
          logout();
          router.push('/login');
        }, 1500);
      } else {
        // For other users, they will be logged out on their next request
        toast.info(t('userWillBeLoggedOut', { name: getDisplayName(userToChangePassword) }));
      }
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle validation errors
      if (error.errors) {
        const errorMessages = Object.values(error.errors).flat().join(', ');
        toast.error(t('passwordChangeFailed'), {
          description: errorMessages,
        });
      } else {
        const errorMessage = error?.message || error?.error || t('passwordChangeFailed');
        toast.error(t('passwordChangeFailed'), {
          description: errorMessage,
        });
      }
      setIsChangingPassword(false);
    }
    // Note: Don't set isChangingPassword to false if it's own password (logout will happen)
  };

  const getRoleDisplayName = (roleName: string, roleData?: Role) => {
    // Try to get localized slug from API first
    if (roleData) {
      const slug = locale === 'ar' ? roleData.slug_ar : roleData.slug_en;
      if (slug) {
        return slug;
      }
    }
    
    // Fallback to translation keys
    const roleTranslationMap: Record<string, string> = {
      'super-admin': 'superAdmin',
      'admin': 'admin',
      'manager': 'manager',
      'viewer': 'viewer',
      'inventory-manager': 'inventoryManager',
      'order-preparer': 'orderPreparer',
      'shipping-agent': 'shippingAgent',
    };
    
    const translationKey = roleTranslationMap[roleName];
    if (translationKey) {
      return t(translationKey);
    }
    
    // Last fallback: format the role name
    return roleName.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getRoleBadge = (roles: string[]) => {
    if (!roles || roles.length === 0) {
      return <Badge variant="outline">{t('noRole')}</Badge>;
    }
    
    const roleName = roles[0];
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      admin: "default",
      manager: "secondary",
      viewer: "outline",
    };
    
    // Find role in available roles to get slug
    const roleData = availableRoles.find(r => r.name === roleName);
    const displayName = getRoleDisplayName(roleName, roleData);
    
    return <Badge variant={variants[roleName] || "outline"}>{displayName}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant={status === 'active' ? 'outline' : 'secondary'}>
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

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            {t('subtitle')}
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('addUser')}
        </Button>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card key={user.id}>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-semibold truncate">{displayName}</CardTitle>
                      {currentUser?.id === user.id && (
                        <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex-shrink-0">
                          {t('me')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {getRoleBadge(user.roles)}
                      {getStatusBadge(user.status)}
                    </div>
                  </div>
                </div>
                {isSuperAdmin() && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleOpenAssignRoleDialog(user)}>
                        {t('assignRole')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenChangePasswordDialog(user)}>
                        {t('changePassword')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pb-4">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{user.email || t('noEmail')}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{user.mobile}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {t('lastActive')}: {user.last_active ? new Date(user.last_active).toLocaleDateString() : t('never')}
                </span>
              </div>
            </CardContent>
            <div className="border-t px-6 py-4">
              <div className="flex items-center justify-around gap-2">
                <Button
                  variant="ghost"
                  className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                  onClick={() => setUserToView(user)}
                >
                  <Eye className="h-5 w-5" />
                  <span className="text-sm">{t('view')}</span>
                </Button>
                {isSuperAdmin() && (
                  <>
                    <div className="h-12 w-px bg-border" />
                    <Button
                      variant="ghost"
                      className="flex-1 flex flex-col items-center gap-1 h-auto py-2"
                      onClick={() => handleOpenEditDialog(user)}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <span className="text-sm">{tCommon('edit')}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs md:text-sm text-muted-foreground">{t('admin')}</p>
            <p className="text-xl md:text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs md:text-sm text-muted-foreground">{t('manager')}</p>
            <p className="text-xl md:text-2xl font-bold">
              {users.filter(u => u.role === 'manager').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs md:text-sm text-muted-foreground">{t('viewer')}</p>
            <p className="text-xl md:text-2xl font-bold">
              {users.filter(u => u.role === 'viewer').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs md:text-sm text-muted-foreground">{t('active')}</p>
            <p className="text-xl md:text-2xl font-bold">
              {users.filter(u => u.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

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
                value={addFormData.roleId?.toString() || ''}
                onValueChange={(value) => setAddFormData(prev => ({ ...prev, roleId: Number(value) }))}
                disabled={isCreating}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {getRoleDisplayName(role.name, role)}
                    </SelectItem>
                  ))}
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

      {/* Change Password Dialog */}
      <Dialog open={!!userToChangePassword} onOpenChange={() => setUserToChangePassword(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('changePassword')}</DialogTitle>
            <DialogDescription>
              {userToChangePassword && t('changePasswordDesc', { name: getDisplayName(userToChangePassword) })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* New Password */}
            <div className="grid gap-2">
              <Label htmlFor="new_password">{t('newPassword')} *</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordFormData.password}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, password: e.target.value }))}
                disabled={isChangingPassword}
                placeholder={t('enterNewPassword')}
                required
              />
            </div>

            {/* Confirm Password */}
            <div className="grid gap-2">
              <Label htmlFor="confirm_new_password">{t('confirmPassword')} *</Label>
              <Input
                id="confirm_new_password"
                type="password"
                value={passwordFormData.confirmPassword}
                onChange={(e) => setPasswordFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                disabled={isChangingPassword}
                placeholder={t('confirmNewPassword')}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToChangePassword(null)}
              disabled={isChangingPassword}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleChangePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('changingPassword')}
                </>
              ) : (
                t('changePassword')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={!!userToView} onOpenChange={() => setUserToView(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{t('viewUser')}</DialogTitle>
            <DialogDescription>{t('viewUserDetails')}</DialogDescription>
          </DialogHeader>
          
          {userToView && (
            <div className="space-y-6">
              {/* User Profile Header */}
              <div className="flex items-center gap-4 pb-4 border-b">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {getDisplayName(userToView).split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{getDisplayName(userToView)}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getRoleBadge(userToView.roles)}
                    {getStatusBadge(userToView.status)}
                  </div>
                </div>
              </div>

              {/* User Details Grid */}
              <div className="grid gap-4">
                {/* Name English */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('nameEnglish')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <span>{userToView.name_en}</span>
                  </div>
                </div>

                {/* Name Arabic */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('nameArabic')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <span>{userToView.name_ar}</span>
                  </div>
                </div>

                {/* Email */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('email')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{userToView.email || t('noEmail')}</span>
                  </div>
                </div>

                {/* Mobile */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('mobile')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{userToView.mobile}</span>
                  </div>
                </div>

                {/* Role */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('role')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {userToView.roles && userToView.roles.length > 0
                        ? getRoleDisplayName(userToView.roles[0], availableRoles.find(r => r.name === userToView.roles[0]))
                        : t('noRole')}
                    </span>
                  </div>
                </div>

                {/* Permissions */}
                {availableRoles.length > 0 && userToView.roles && userToView.roles.length > 0 && (() => {
                  const userRole = availableRoles.find(r => r.name === userToView.roles[0]);
                  const permissions = userRole?.permissions || [];
                  
                  if (permissions.length === 0) return null;
                  
                  return (
                    <div className="grid gap-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">{t('permissions')}</Label>
                      <div className="p-2.5 rounded-md bg-muted/50">
                        <div className="flex flex-wrap gap-1.5">
                          {permissions.map((permission, index) => {
                            // Handle both string and object formats
                            const permissionName = typeof permission === 'string' 
                              ? permission 
                              : (permission as any)?.name || 'unknown';
                            
                            return (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {permissionName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Last Active */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('lastActive')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{userToView.last_active ? new Date(userToView.last_active).toLocaleString() : t('never')}</span>
                  </div>
                </div>

                {/* Created At */}
                <div className="grid gap-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">{t('createdAt')}</Label>
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(userToView.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setUserToView(null)}>
              {tCommon('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={!!userToAssignRole} onOpenChange={() => setUserToAssignRole(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('assignRole')}</DialogTitle>
            <DialogDescription>
              {userToAssignRole && t('assignRoleDesc', { name: getDisplayName(userToAssignRole) })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">{t('role')} *</Label>
              <Select
                value={selectedRoleId?.toString() || ''}
                onValueChange={(value) => setSelectedRoleId(Number(value))}
                disabled={isAssigningRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tCommon('select')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {getRoleDisplayName(role.name, role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setUserToAssignRole(null)}
              disabled={isAssigningRole}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleAssignRole}
              disabled={isAssigningRole || !selectedRoleId}
            >
              {isAssigningRole ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {t('assigning')}
                </>
              ) : (
                t('assignRole')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
