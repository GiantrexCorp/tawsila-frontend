"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Mail,
  Phone,
  Shield
} from "lucide-react";
import { usePagePermission } from "@/hooks/use-page-permission";
import { fetchUser, updateUser, User as UserType } from "@/lib/services/users";
import { toast } from "sonner";

export default function EditUserPage() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);

  const hasPermission = usePagePermission(['super-admin']);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    email: '',
    mobile: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    const loadUser = async () => {
      if (!userId || isNaN(userId)) {
        toast.error(t('failedToLoad'), {
          description: tCommon('invalidOrderId'),
        });
        router.push('/dashboard/users');
        return;
      }

      setIsLoading(true);
      try {
        const fetchedUser = await fetchUser(userId);
        setUser(fetchedUser);
        setFormData({
          name_en: fetchedUser.name_en || '',
          name_ar: fetchedUser.name_ar || '',
          email: fetchedUser.email || '',
          mobile: fetchedUser.mobile || '',
          status: fetchedUser.status,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : tCommon('tryAgain');
        toast.error(t('failedToLoad'), { description: message });
        router.push('/dashboard/users');
      } finally {
        setIsLoading(false);
      }
    };

    if (hasPermission) {
      loadUser();
    }
  }, [userId, hasPermission, t, tCommon, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name_en || !formData.name_ar || !formData.email || !formData.mobile) {
      toast.error(t('fillAllFields'));
      return;
    }

    setIsSaving(true);
    try {
      await updateUser(userId, {
        name: formData.name_en,
        name_en: formData.name_en,
        name_ar: formData.name_ar,
        email: formData.email,
        mobile: formData.mobile,
        status: formData.status,
      });
      toast.success(t('updateSuccess'));
      router.push(`/dashboard/users/${userId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('updateFailed');
      toast.error(t('updateFailed'), { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  if (hasPermission === null || hasPermission === false || isLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = locale === 'ar' ? user.name_ar : user.name_en;

  return (
    <div className="space-y-6 pb-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(`/dashboard/users/${userId}`)}
        className="gap-2 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('backToUser')}
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t('editUser')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('editingUser', { name: displayName })}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('basicInformation')}</CardTitle>
                <CardDescription>{t('basicInformationDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name_en">{t('nameEnglish')} *</Label>
              <Input
                id="name_en"
                value={formData.name_en}
                onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))}
                placeholder={t('nameEnglishPlaceholder')}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name_ar">{t('nameArabic')} *</Label>
              <Input
                id="name_ar"
                value={formData.name_ar}
                onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                placeholder={t('nameArabicPlaceholder')}
                disabled={isSaving}
                dir="rtl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Mail className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('contactInfo')}</CardTitle>
                <CardDescription>{t('contactInfoDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')} *</Label>
              <div className="relative">
                <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t('emailPlaceholder')}
                  disabled={isSaving}
                  className="ps-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">{t('mobile')} *</Label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder={t('mobilePlaceholder')}
                  disabled={isSaving}
                  className="ps-10"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <CardTitle className="text-lg">{t('accountStatus')}</CardTitle>
                <CardDescription>{t('accountStatusDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="status">{t('status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
                disabled={isSaving}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('active')}</SelectItem>
                  <SelectItem value="inactive">{t('inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/dashboard/users/${userId}`)}
            disabled={isSaving}
          >
            {tCommon('cancel')}
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('updating')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {tCommon('save')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
