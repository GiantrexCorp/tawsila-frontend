# Tawsila - Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### 3. Build for Production

```bash
npm run build
npm run start
```

## Available Routes

### Landing & Auth
- `/` - Redirects to `/en` (English landing page)
- `/en` or `/ar` - Landing page (English/Arabic)
- `/en/login` or `/ar/login` - Login page

### Dashboard (Admin)
- `/en/dashboard` - Main dashboard
- `/en/dashboard/inventory` - Inventory management
- `/en/dashboard/orders` - Order management
- `/en/dashboard/agents` - Delivery agents
- `/en/dashboard/requests` - Product requests (placeholder)
- `/en/dashboard/organizations` - Organizations (placeholder)
- `/en/dashboard/analytics` - Analytics (placeholder)
- `/en/dashboard/settings` - Settings (placeholder)

*(Replace `/en/` with `/ar/` for Arabic version)*

### Customer Portal
- `/en/track` - Order tracking search
- `/en/track/ORD-2024-001` - Track specific order (example)

## Demo Data

The application includes mock data for demonstration:

### Sample Orders
- `ORD-2024-001` - In Transit
- `ORD-2024-002` - Pending
- `ORD-2024-003` - Confirmed
- `ORD-2024-004` - Delivered
- `ORD-2024-005` - Picked Up

### Demo Login
- Email: `admin@tawsila.com`
- Password: (any password works in demo mode)

## Features

✅ **Implemented:**
- 📦 Inventory Management page with product grid
- 🚚 Orders Management with status filtering
- 👥 Delivery Agents management
- 📊 Dashboard with metrics and analytics
- 🔍 Customer order tracking portal
- 🌍 English/Arabic with RTL support
- 🌗 Dark/Light mode
- 📱 Fully responsive design

📝 **Placeholder Pages:**
- Product Requests
- Organizations
- Advanced Analytics
- Settings

## Project Structure

```
/app/[locale]           # Internationalized routes
  /(dashboard)          # Dashboard pages (admin)
  /track                # Customer tracking portal
  /login                # Authentication
  /page.tsx             # Landing page

/components
  /ui                   # Shadcn/ui components
  /layout               # Layout components
  /branding             # Tawsila logo and branding

/lib/mock-data          # Mock data for demo
/messages               # i18n translations (en.json, ar.json)
```

## Customization

### Adding New Dashboard Pages

1. Create a new folder in `/app/[locale]/(dashboard)/dashboard/`
2. Add a `page.tsx` file
3. Add navigation link in `/components/layout/app-sidebar.tsx`
4. Add translations in `/messages/en.json` and `/messages/ar.json`

### Modifying Mock Data

Edit files in `/lib/mock-data/`:
- `products.ts` - Product inventory
- `orders.ts` - Orders
- `agents.ts` - Delivery agents

### Changing Branding

Edit `/components/branding/tawsila-logo.tsx` to customize the logo and branding.

### Updating Translations

Edit translation files:
- `/messages/en.json` - English
- `/messages/ar.json` - Arabic

## Troubleshooting

### Build Errors

If you encounter build errors, try:

```bash
rm -rf .next node_modules
npm install
npm run build
```

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

## Next Steps

To connect to a real backend:

1. Replace mock data imports with API calls
2. Implement authentication with a real auth service
3. Add real-time updates using WebSockets
4. Integrate with a mapping service for delivery tracking
5. Implement actual image uploads for products

## Tech Stack

- Next.js 15.1.0
- TypeScript
- Tailwind CSS 4
- Shadcn/ui
- next-intl (i18n)
- next-themes (dark mode)
- Framer Motion (animations)
- Lucide React (icons)

## Support

For issues or questions, please refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Shadcn/ui Documentation](https://ui.shadcn.com)
- [next-intl Documentation](https://next-intl-docs.vercel.app)




