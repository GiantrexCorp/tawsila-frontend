"use client";

import * as React from "react";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";

interface TawsilaLogoProps {
  iconOnly?: boolean;
  className?: string;
}

export function TawsilaLogo({ iconOnly = false, className = "" }: TawsilaLogoProps) {
  const t = useTranslations('app');

  if (iconOnly) {
    return (
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground ${className}`}>
        <Package className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Package className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">{t('name')}</h2>
        <p className="text-xs text-muted-foreground">{t('tagline')}</p>
      </div>
    </div>
  );
}
