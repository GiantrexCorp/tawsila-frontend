"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { getCurrentUser } from "@/lib/auth";

export default function SettingsPage() {
  const t = useTranslations('settingsPage');
  const router = useRouter();

  // Redirect users without roles to profile page
  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.roles || currentUser.roles.length === 0) {
      router.push('/dashboard/profile');
    }
  }, [router]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-muted-foreground" />
            <div>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
