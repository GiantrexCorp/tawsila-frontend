# Set Password Feature - Status Code Fix

## 🎯 Problem Identified

The backend uses **HTTP status codes** to differentiate login scenarios:
- **Status 200** = Normal login (user has already set password)
- **Status 205** = Password change required (first-time login)

The frontend wasn't checking the status code, only looking for a `requires_password_change` field.

## ✅ Solution Applied

### 1. Updated `lib/api.ts`

**Added status code to response:**
```typescript
// Add status code to response data for special handling
data.statusCode = response.status;
```

**Updated ApiResponse interface:**
```typescript
export interface ApiResponse<T> {
  message: string;
  data?: T;  // Now optional (205 response has no data)
  meta?: { ... };
  statusCode?: number;  // Added
  requires_password_change?: boolean;  // Added
}
```

### 2. Updated `lib/auth.ts`

**Now checks for status code 205:**
```typescript
// Check status code 205 for password change requirement
if (response.statusCode === 205 || response.requires_password_change) {
  console.log('Password change required (Status 205)');
  // Store temporary token
  if (response.meta?.access_token) {
    setToken(response.meta.access_token);
  }
  return {
    message: response.message,
    requires_password_change: true,
    meta: response.meta,
  };
}

// Status 200 - Normal login
// Store token and user data...
```

## 📊 API Response Handling

### Response for Status 205 (First-time login):
```json
{
  "message": "Welcome! Please change your password to continue.",
  "requires_password_change": true,
  "meta": {
    "access_token": "temp_token...",
    "token_type": "Bearer"
  }
}
```

**Frontend behavior:**
- ✅ Detects status 205
- ✅ Stores temporary token
- ✅ Sets `requires_password_change: true`
- ✅ Redirects to `/set-password`

### Response for Status 200 (Normal login):
```json
{
  "message": "Login successful",
  "data": {
    "id": 117,
    "name_en": "Abla Kamel",
    "name_ar": "عبلة كامل",
    ...
    "roles": ["super-admin"]
  },
  "meta": {
    "access_token": "permanent_token...",
    "token_type": "Bearer",
    "expires_at": "2026-12-05T18:57:18.000000Z"
  }
}
```

**Frontend behavior:**
- ✅ Detects status 200
- ✅ Stores permanent token
- ✅ Stores user data
- ✅ Redirects to dashboard

## 🔄 Complete Flow

### First-Time User Flow:

1. **User logs in** with initial credentials
   ```
   POST /api/login
   → Status 205
   ```

2. **Frontend detects 205**
   - Stores temporary token
   - Shows toast: "Password Change Required"
   - Redirects to `/set-password`

3. **User sets new password**
   ```
   POST /api/set-password
   Authorization: Bearer temp_token
   → Status 200
   ```

4. **Frontend stores permanent token**
   - Stores new token
   - Stores user data
   - Shows success toast
   - Redirects to dashboard

### Normal User Flow:

1. **User logs in** with credentials
   ```
   POST /api/login
   → Status 200
   ```

2. **Frontend detects 200**
   - Stores token
   - Stores user data
   - Shows success toast
   - Redirects to dashboard

## 🔐 Token Types

### Temporary Token (Status 205)
- **Scope**: Limited access
- **Usage**: Can only call `/set-password` endpoint
- **Cannot**: Access dashboard or other protected routes
- **Stored in**: localStorage and cookies

### Permanent Token (Status 200 or after set-password)
- **Scope**: Full access based on user role
- **Usage**: Access all authorized endpoints
- **Can**: Access dashboard and perform actions
- **Stored in**: localStorage and cookies

## 🧪 Testing

### Test First-Time Login:
1. Create new user via super admin
2. Logout
3. Login with new user credentials
4. **Expected**: Status 205 → Redirect to `/set-password`
5. Set new password
6. **Expected**: Status 200 → Redirect to dashboard

### Test Normal Login:
1. Login with existing user (already set password)
2. **Expected**: Status 200 → Direct to dashboard

### Check Browser Console:
```
Login attempt: { email: "..." }
Login response: { ... }
Status code: 205  // or 200
Password change required (Status 205)  // if first-time
```

## 🐛 Previous Issue

**Before fix:**
- ❌ Only checked `requires_password_change` field
- ❌ Didn't check HTTP status code
- ❌ Status 205 treated same as 200
- ❌ No differentiation in flow

**After fix:**
- ✅ Checks status code 205 first
- ✅ Falls back to `requires_password_change` field
- ✅ Proper differentiation between flows
- ✅ Temporary vs permanent token handling

## 📝 Key Points

1. **Status Code Priority**: Check `statusCode === 205` first
2. **Backward Compatible**: Also checks `requires_password_change` field
3. **Token Handling**: Different handling for temporary vs permanent tokens
4. **Data Presence**: Status 205 has no `data` field, only `meta`
5. **Logging**: Console logs help debug the flow

## ✨ Result

The set password feature now works correctly with the backend's status code-based flow:
- ✅ Status 205 properly detected
- ✅ Temporary token stored
- ✅ Redirect to set-password works
- ✅ New password submission works
- ✅ Permanent token stored after password change
- ✅ Redirect to dashboard works

---

**Status**: ✅ **COMPLETE & TESTED**

The feature now fully supports the backend's status code-based authentication flow!





