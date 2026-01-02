"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function ComingSoonPage() {
  const t = useTranslations('comingSoon');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">501</CardTitle>
            <CardDescription className="text-lg mt-2">
              {t('title')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {t('description')}
          </p>
          <Button asChild className="w-full">
            <Link href="/dashboard">
              <Home className="h-4 w-4 me-2" />
              {t('home')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

