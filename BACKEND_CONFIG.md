# Backend API Configuration

## 📍 Backend URL Location

The backend API URL is configured in:

**File**: `lib/api.ts` (line 5)

```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

```

## 🔧 How to Configure

### Option 1: Environment Variable (Recommended)

Create a `.env.local` file in the project root:

```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

**For Production:**
```bash
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

### Option 2: Direct Edit

Edit `lib/api.ts`:

```typescript
export const API_BASE_URL = 'http://your-backend-url.com/api';
```

## 🚀 Default Configuration

**Current default**: `http://127.0.0.1:8000/api`

This assumes:
- Laravel backend running on localhost
- Port 8000
- API routes prefixed with `/api`

## 📝 Environment Variables

Create `.env.local` in project root:

```bash
# Backend API URL
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api

# Optional: Other environment variables
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important**: 
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- Restart dev server after changing `.env.local`

## 🌐 Different Environments

### Development
```bash
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

### Staging
```bash
# .env.staging
NEXT_PUBLIC_API_BASE_URL=https://staging-api.yourdomain.com/api
```

### Production
```bash
# .env.production
NEXT_PUBLIC_API_BASE_URL=https://api.yourdomain.com/api
```

## 🔗 API Endpoints Used

The frontend makes requests to these endpoints:

### Authentication
- `POST /login` - User login
- `POST /logout` - User logout
- `GET /user` - Get current user

### Users
- `GET /users` - List users
- `POST /users` - Create user
- `PUT /users/{id}` - Update user
- `DELETE /users/{id}` - Delete user

### Product Requests
- `GET /product-requests` - List requests
- `POST /product-requests/{id}/approve` - Approve request
- `POST /product-requests/{id}/reject` - Reject request

### Orders
- `GET /orders` - List orders
- `POST /orders` - Create order
- `PUT /orders/{id}` - Update order

### Inventory
- `GET /products` - List products
- `PUT /products/{id}` - Update product

### Organizations
- `GET /organizations` - List organizations
- `POST /organizations` - Create organization
- `PUT /organizations/{id}` - Update organization

### Delivery Agents
- `GET /agents` - List agents
- `PUT /agents/{id}` - Update agent

## 🧪 Testing API Connection

After setting the backend URL, test the connection:

```bash
# Make sure backend is running
curl http://127.0.0.1:8000/api

# Should return API info or 404 (not connection refused)
```

## 📌 Quick Setup

1. **Create `.env.local`:**
```bash
echo "NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api" > .env.local
```

2. **Restart Next.js:**
```bash
npm run dev
```

3. **Verify:**
Open browser console and check network tab for API calls to correct URL.

## 🔐 Authentication Flow

The app uses:
- Bearer token authentication
- Token stored in localStorage (`access_token`)
- Auto-logout on 401 (unauthorized)
- Redirect to login on session expiry

## 📋 Notes

- `.env.local` is gitignored (not committed)
- Use `.env.example` as template
- Environment variables are read at build time for static generation
- Use `NEXT_PUBLIC_` prefix for client-side variables

---

**Current Backend URL**: `http://127.0.0.1:8000/api`

**To Change**: Create `.env.local` or edit `lib/api.ts`








