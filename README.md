# Rahwan Frontend

Admin dashboard and customer portal for the Rahwan delivery and inventory management system. Built with Next.js 15 and React 19.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui (Radix UI primitives)
- **State Management:** Zustand, React Query
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts
- **Maps:** Leaflet + React Leaflet
- **i18n:** next-intl (English/Arabic with RTL)
- **Animations:** Framer Motion

## Prerequisites

- Node.js 18+
- npm, pnpm, or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend-inventory-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```

4. Update `.env` with your backend URL:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_TRACKING_API_KEY=your_tracking_key
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── [locale]/                    # Internationalized routes
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── analytics/       # Analytics dashboard
│   │       ├── finance/         # Financial management
│   │       ├── inventory/       # Inventory management
│   │       ├── orders/          # Order management
│   │       ├── organizations/   # Organization management
│   │       ├── performance/     # Performance metrics
│   │       ├── reports/         # Reports and exports
│   │       ├── roles/           # Role management
│   │       ├── transactions/    # Transaction history
│   │       ├── users/           # User management
│   │       ├── vendors/         # Vendor management
│   │       ├── wallet/          # Wallet management
│   │       └── wallets/         # Multi-wallet view
│   ├── login/                   # Authentication
│   ├── set-password/            # Password setup
│   └── track/                   # Public order tracking
├── globals.css
└── layout.tsx

components/
├── ui/                          # shadcn/ui components
├── layout/                      # Layout components
└── providers/                   # React context providers

lib/
├── api/                         # API client functions
├── hooks/                       # Custom React hooks
└── utils/                       # Utility functions

messages/
├── en.json                      # English translations
└── ar.json                      # Arabic translations
```

## Key Features

### Dashboard Modules

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/dashboard` | Overview with KPIs and metrics |
| Orders | `/dashboard/orders` | Order management and tracking |
| Inventory | `/dashboard/inventory` | Product and stock management |
| Vendors | `/dashboard/vendors` | Vendor directory and management |
| Users | `/dashboard/users` | User and agent management |
| Finance | `/dashboard/finance` | Financial overview |
| Transactions | `/dashboard/transactions` | Transaction history |
| Wallets | `/dashboard/wallets` | Wallet management |
| Reports | `/dashboard/reports` | Vendor profits and analytics |
| Roles | `/dashboard/roles` | Role and permission management |

### Public Pages

| Page | Path | Description |
|------|------|-------------|
| Landing | `/` | Public landing page |
| Order Tracking | `/track/[orderId]` | Customer order tracking |
| Login | `/login` | Authentication |

### Internationalization

The app supports English and Arabic with automatic RTL switching:

- English: `/en/...`
- Arabic: `/ar/...`

Language can be switched via the header dropdown.

### Theming

- Light and dark mode support
- System preference detection
- Persistent theme preference
- Toggle via header button

## Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_TRACKING_API_KEY` | API key for public tracking | No |
| `NEXT_PUBLIC_SHOW_ORDER_QR_CARD` | Show QR code on order detail | No |

## Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
npm run build
npm run start
```

### Static Export

```bash
npm run build
# Output in .next/
```

## API Integration

The frontend communicates with the Rahwan Backend API. Ensure the backend is running and the `NEXT_PUBLIC_API_BASE_URL` is correctly configured.

Authentication uses bearer tokens stored in cookies, managed by the auth provider.

## License

Proprietary - All rights reserved.
