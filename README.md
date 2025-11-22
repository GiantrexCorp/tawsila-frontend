# Tawsila - توصيلة

**Smart Inventory & Delivery Management System**

Tawsila is a modern, full-featured inventory and delivery management system built with Next.js 14+, featuring a comprehensive admin dashboard and customer tracking portal.

![Next.js](https://img.shields.io/badge/Next.js-16.0.3-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)

## ✨ Features

### 📦 Inventory Management
- Real-time inventory tracking
- Low stock alerts
- Product categorization
- Stock history timeline
- Bulk actions support

### 🚚 Delivery Management
- Real-time order tracking
- Delivery agent assignment
- Route optimization
- OTP-based delivery confirmation
- Live agent location tracking

### 📊 Analytics & Reporting
- Comprehensive dashboard with key metrics
- Performance analytics
- Agent performance tracking
- Inventory turnover reports
- Custom date range filtering

### 🌍 Multi-language Support
- English and Arabic (with RTL support)
- Seamless language switching
- Localized UI and content
- next-intl integration

### 🎨 Modern UI/UX
- Shadcn/ui components
- Dark/Light mode support
- Responsive design (mobile, tablet, desktop)
- Glassmorphism effects
- Smooth animations with Framer Motion
- Modern typography (Geist Sans)

### 🔒 Customer Portal
- Order tracking by order number
- Real-time delivery status
- Agent contact information
- Estimated delivery time
- Interactive order timeline

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frontend-inventory-management-system
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
/app
  /[locale]               # Internationalized routes
    /(dashboard)          # Dashboard route group
      /dashboard          # Main dashboard
      /inventory          # Inventory management
      /orders             # Order management
      /agents             # Delivery agents
      /requests           # Product requests
      /organizations      # Organizations
      /analytics          # Analytics
      /settings           # Settings
    /track                # Order tracking portal
    /login                # Authentication
    /page.tsx             # Landing page
/components
  /ui                     # Shadcn/ui components
  /layout                 # Layout components (sidebar, header)
  /branding               # Tawsila branding components
  /providers              # Context providers
/lib
  /mock-data              # Mock data for demo
  /utils                  # Utility functions
/messages                 # i18n translation files
  /en.json                # English translations
  /ar.json                # Arabic translations
```

## 🎯 Key Pages

### Dashboard (`/[locale]/dashboard`)
- Overview with key metrics
- Recent orders and activity
- Top products
- Quick actions

### Inventory (`/[locale]/dashboard/inventory`)
- Product grid with search
- Stock status badges
- Quick edit and restock actions
- Low stock alerts

### Orders (`/[locale]/dashboard/orders`)
- Order list with status filters
- Order details with timeline
- Agent assignment
- Bulk actions

### Delivery Agents (`/[locale]/dashboard/agents`)
- Agent cards with metrics
- Performance ratings
- Contact information
- Order assignment

### Order Tracking (`/[locale]/track/[orderId]`)
- Real-time order status
- Interactive progress tracker
- Delivery agent information
- Order details and items

### Landing Page (`/[locale]`)
- Hero section with CTA
- Features showcase
- Statistics
- Call to action

## 🛠️ Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/ui
- **Animations**: Framer Motion
- **i18n**: next-intl
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Data Fetching**: React Query
- **Theme**: next-themes

## 🌐 Internationalization

The app supports English and Arabic with full RTL (Right-to-Left) support:

- Access English version: `/en/...`
- Access Arabic version: `/ar/...`
- Language switcher in header
- Automatic direction switching (RTL/LTR)
- Localized content and UI

## 🎨 Theming

The app includes both dark and light modes:

- System preference detection
- Manual theme toggle
- Smooth transitions
- Persistent theme preference
- Optimized color schemes for both modes

## 🔐 Authentication (Demo)

For the demo, authentication is simplified:

- Navigate to `/[locale]/login`
- Enter any credentials
- Redirects to dashboard

**Demo Credentials:**
- Email: admin@tawsila.com
- Password: (any password)

## 📊 Mock Data

The application uses mock data for demonstration purposes:

- Products inventory
- Orders with different statuses
- Delivery agents
- Mock tracking information

See `/lib/mock-data/` for data structures.

## 🚢 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

The easiest way to deploy is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository to Vercel
3. Vercel will detect Next.js and configure automatically
4. Deploy!

## 📝 Environment Variables

No environment variables are required for the demo version. For production:

```env
# Add your production environment variables here
NEXT_PUBLIC_API_URL=your_api_url
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- UI components from [Shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Fonts from [Google Fonts (Geist)](https://vercel.com/font)

---

**Built with ❤️ for modern delivery management**

توصيلة - إدارة ذكية للمخزون والتوصيل
