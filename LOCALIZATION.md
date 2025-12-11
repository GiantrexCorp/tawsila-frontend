# Tawsila - Localization & RTL Guide

## ✅ What's Been Fixed

The localization system has been completely refactored to use the latest `next-intl` best practices with proper routing, RTL support, and language switching.

### Key Improvements

1. ✅ **Proper i18n Structure** - Moved from deprecated setup to recommended structure
2. ✅ **Type-safe Routing** - Using `next-intl/navigation` for internationalized routing
3. ✅ **Language Switcher** - Properly switches routes while maintaining current page
4. ✅ **RTL Support** - Full RTL layout for Arabic with CSS adjustments
5. ✅ **No Deprecation Warnings** - Using the latest next-intl APIs

## 🌍 Supported Languages

- **English (en)** - LTR (Left-to-Right)
- **Arabic (ar)** - RTL (Right-to-Left)

## 📁 New Structure

```
/i18n/
  ├── routing.ts          # Routing configuration & navigation exports
  └── request.ts          # Request configuration for next-intl

/messages/
  ├── en.json             # English translations
  └── ar.json             # Arabic translations

middleware.ts             # Route matching and locale detection
next.config.ts            # Next.js config with next-intl plugin
```

## 🚀 How It Works

### 1. Routing Configuration (`i18n/routing.ts`)

This file defines:
- Available locales (`['en', 'ar']`)
- Default locale (`'en'`)
- Locale prefix strategy (`'always'` - always show locale in URL)
- Exports navigation utilities (`Link`, `useRouter`, `usePathname`, etc.)

```typescript
export const routing = defineRouting({
  locales: ['en', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always'
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
```

### 2. Request Configuration (`i18n/request.ts`)

Handles:
- Loading the correct translation messages
- Validating incoming locales
- Falling back to default locale if invalid

### 3. Middleware (`middleware.ts`)

Automatically:
- Detects user's locale preference
- Redirects `/` to `/en` (or user's preferred locale)
- Ensures all routes have a locale prefix

## 🔗 Using Localized Navigation

### ✅ DO: Use `Link` from `@/i18n/routing`

```tsx
import { Link } from "@/i18n/routing";

<Link href="/dashboard">Dashboard</Link>
// Automatically becomes /en/dashboard or /ar/dashboard
```

### ❌ DON'T: Use `Link` from `next/link`

```tsx
// ❌ Wrong - doesn't handle locales
import Link from "next/link";

<Link href="/dashboard">Dashboard</Link>
```

### ✅ DO: Use `useRouter` from `@/i18n/routing`

```tsx
import { useRouter } from "@/i18n/routing";

const router = useRouter();
router.push('/dashboard');  // Maintains current locale
```

### ❌ DON'T: Use `useRouter` from `next/navigation`

```tsx
// ❌ Wrong - doesn't handle locales
import { useRouter } from "next/navigation";
```

## 🌐 Language Switching

The `LanguageSwitcher` component now properly:
1. Uses `useRouter` from `@/i18n/routing`
2. Calls `router.replace(pathname, { locale: newLocale })`
3. Maintains the current page while switching language

```tsx
// components/language-switcher.tsx
const switchLocale = (newLocale: string) => {
  router.replace(pathname, { locale: newLocale });
};
```

### Testing Language Switch

1. Go to `/en/dashboard` 
2. Click language switcher → Select Arabic
3. You'll be at `/ar/dashboard` (same page, different language)

## 🎨 RTL Support

### Automatic Direction

The HTML `dir` attribute is automatically set based on locale:

```tsx
// app/[locale]/layout.tsx
<html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
```

### CSS Adjustments

Enhanced RTL support in `globals.css`:

```css
/* Basic RTL direction */
[dir="rtl"] {
  direction: rtl;
}

/* RTL-specific utilities */
[dir="rtl"] .rtl\:rotate-180 {
  transform: rotate(180deg);
}

/* Sidebar border adjustment */
[dir="rtl"] [data-slot="sidebar"] {
  border-left: 1px solid var(--sidebar-border);
  border-right: none;
}

/* Dropdown positioning */
[dir="rtl"] [data-side="right"] {
  left: auto;
  right: 0;
}
```

### Components That Handle RTL

All Shadcn/ui components automatically support RTL through:
- Tailwind's RTL plugin (built-in)
- Custom CSS adjustments
- Proper flexbox/grid usage

## 📝 Adding Translations

### 1. Add to English (`messages/en.json`)

```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "This is my feature"
  }
}
```

### 2. Add to Arabic (`messages/ar.json`)

```json
{
  "myFeature": {
    "title": "ميزتي",
    "description": "هذه هي ميزتي"
  }
}
```

### 3. Use in Component

```tsx
import { useTranslations } from 'next-intl';

export function MyComponent() {
  const t = useTranslations('myFeature');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

## 🧪 Testing Localization

### Test English Version

```bash
npm run dev
# Visit http://localhost:3000/en
```

### Test Arabic Version

```bash
npm run dev
# Visit http://localhost:3000/ar
```

### Test Language Switching

1. Start on `/en/dashboard`
2. Click language switcher (Languages icon)
3. Select "العربية"
4. You should now be at `/ar/dashboard`
5. Notice:
   - Text is in Arabic
   - Layout is RTL (sidebar on right)
   - All navigation links work

### Test RTL Layout

Things to verify in Arabic mode:
- ✅ Sidebar appears on the right
- ✅ Text aligns to the right
- ✅ Icons and chevrons point correctly
- ✅ Dropdowns open in correct direction
- ✅ All text is in Arabic

## 🔧 Troubleshooting

### Issue: Language switcher doesn't work

**Solution:** Make sure you're using `Link` and `useRouter` from `@/i18n/routing`, not from Next.js directly.

### Issue: RTL not working

**Solution:** Check that:
1. `<html dir={locale === 'ar' ? 'rtl' : 'ltr'}>` is set in `app/[locale]/layout.tsx`
2. Your CSS includes RTL adjustments from `globals.css`
3. You're actually visiting `/ar/*` routes

### Issue: Translations not showing

**Solution:** 
1. Check that the translation key exists in both `en.json` and `ar.json`
2. Verify the namespace matches: `useTranslations('yourNamespace')`
3. Rebuild the app: `npm run build`

### Issue: Routes not working

**Solution:**
1. Make sure all `Link` components use `@/i18n/routing`
2. Check middleware matcher in `middleware.ts`
3. Verify locale is in the URL path

## 📊 Current Translation Coverage

### Namespaces Available

- `app` - Application name and tagline
- `nav` - Navigation menu items
- `dashboard` - Dashboard metrics and labels
- `inventory` - Inventory management
- `orders` - Order management  
- `agents` - Delivery agents
- `tracking` - Order tracking portal
- `common` - Common UI elements

### Translation Stats

- ✅ **40+ translation keys**
- ✅ **100% coverage** for both languages
- ✅ All UI text translatable
- ✅ Both Latin and Arabic numerals supported

## 🎯 Best Practices

### DO ✅

1. **Always use the navigation from `@/i18n/routing`**
   ```tsx
   import { Link, useRouter } from "@/i18n/routing";
   ```

2. **Use relative paths in Link href**
   ```tsx
   <Link href="/dashboard">Dashboard</Link>
   // Not: href="/en/dashboard"
   ```

3. **Wrap all user-facing text in translations**
   ```tsx
   const t = useTranslations('namespace');
   <h1>{t('title')}</h1>
   ```

4. **Test both LTR and RTL layouts**
   - Visit both `/en/*` and `/ar/*` routes
   - Check alignment, spacing, and flow

### DON'T ❌

1. **Don't use next/link directly**
   ```tsx
   // ❌ Wrong
   import Link from "next/link";
   ```

2. **Don't hardcode locale in URLs**
   ```tsx
   // ❌ Wrong
   <Link href="/en/dashboard">
   
   // ✅ Correct  
   <Link href="/dashboard">
   ```

3. **Don't use window.location for navigation**
   ```tsx
   // ❌ Wrong
   window.location.href = '/en/dashboard';
   
   // ✅ Correct
   router.push('/dashboard');
   ```

## 🚀 Adding a New Language

To add a new language (e.g., French):

1. **Add to routing config** (`i18n/routing.ts`)
   ```typescript
   locales: ['en', 'ar', 'fr']
   ```

2. **Create translation file** (`messages/fr.json`)
   ```json
   {
     "app": {
       "name": "Tawsila",
       "tagline": "Gestion Intelligente des Stocks et Livraisons"
     },
     ...
   }
   ```

3. **Update middleware** (if needed)
   ```typescript
   matcher: ['/', '/(ar|en|fr)/:path*']
   ```

4. **Add to language switcher**
   ```tsx
   <DropdownMenuItem onClick={() => switchLocale('fr')}>
     Français
   </DropdownMenuItem>
   ```

## 📚 Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Next.js i18n Routing](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Tailwind RTL Plugin](https://tailwindcss.com/docs/plugins#rtl-support)

---

**Status:** ✅ Fully functional with proper localization, routing, and RTL support!


