"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Key, Webhook, Copy, RefreshCw, Plus, MoreVertical, Loader2 } from "lucide-react";
import { organizations, productRequests } from "@/lib/mock-data";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { usePagePermission } from "@/hooks/use-page-permission";

export default function OrganizationsPage() {
  const t = useTranslations('organizations');
  const tCommon = useTranslations('common');
  
  // Check if user has permission to access vendors page
  const hasPermission = usePagePermission(['super-admin', 'admin', 'manager', 'inventory-manager']);

  // Don't render page if permission check hasn't completed or user lacks permission
  if (hasPermission === null || hasPermission === false) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key copied to clipboard!');
  };

  const getOrgRequestCount = (orgId: string) => {
    return productRequests.filter(req => req.organizationId === orgId).length;
  };

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
          <Plus className="h-4 w-4 mr-2" />
          {t('addOrganization')}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('totalOrganizations')}</p>
            <p className="text-2xl font-bold">{organizations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('activeOrgs')}</p>
            <p className="text-2xl font-bold text-green-600">
              {organizations.filter(o => o.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('inactiveOrgs')}</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {organizations.filter(o => o.status === 'inactive').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">{t('totalRequests')}</p>
            <p className="text-2xl font-bold">{productRequests.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Grid */}
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {organizations.map((org) => (
          <Card key={org.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{org.name}</CardTitle>
                    <Badge variant={org.status === 'active' ? 'outline' : 'secondary'} className="mt-1">
                      {org.status === 'active' ? t('activeOrgs') : t('inactiveOrgs')}
                    </Badge>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>{tCommon('edit')}</DropdownMenuItem>
                    <DropdownMenuItem>Toggle Status</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">{tCommon('delete')}</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{org.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{org.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{org.address}</span>
                </div>
              </div>

              {/* API Key */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('apiKey')}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={() => copyApiKey(org.apiKey)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="bg-muted/50 px-3 py-2 rounded-md">
                  <code className="text-xs font-mono">{org.apiKey}</code>
                </div>
              </div>

              {/* Webhook */}
              {org.webhookUrl && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Webhook className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{t('webhookUrl')}</span>
                  </div>
                  <div className="bg-muted/50 px-3 py-2 rounded-md">
                    <code className="text-xs font-mono truncate block">{org.webhookUrl}</code>
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t('totalRequests')}</p>
                  <p className="text-lg font-semibold">{getOrgRequestCount(org.id)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('createdOn')}</p>
                  <p className="text-sm font-medium">{org.createdAt.toLocaleDateString()}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  {t('regenerate')}
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Webhook className="h-4 w-4 mr-1" />
                  {t('configure')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
