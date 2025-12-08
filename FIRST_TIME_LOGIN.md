# First-Time Login & Set Password Feature

## Overview
This feature handles the first-time login flow for new users, requiring them to set a new password before accessing the dashboard.

## Flow Description

### 1. User Creation
A super admin creates a new user with initial credentials via the "Add User" dialog in `/dashboard/users`.

### 2. First Login Attempt
When a first-time user tries to login with their initial credentials:

**Request:**
```http
POST /api/login
Content-Type: application/json

{
  "email": "first@gmail.com",
  "password": "initialPassword"
}
```

**Response (First-Time Login):**
```json
{
  "message": "Welcome! Please change your password to continue.",
  "requires_password_change": true,
  "meta": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "token_type": "Bearer"
  }
}
```

### 3. Redirect to Set Password
The system detects `requires_password_change: true` and:
- Stores the temporary access token
- Shows an info toast: "Password Change Required"
- Redirects to `/set-password`

### 4. Set New Password
User sets a new password on the `/set-password` page.

**Request:**
```http
POST /api/set-password
Authorization: Bearer {temporary_token}
Content-Type: application/json

{
  "new_password": "newSecurePassword123",
  "new_password_confirmation": "newSecurePassword123"
}
```

**Response:**
```json
{
  "message": "Password changed successfully.",
  "data": {
    "id": 115,
    "name_en": "FirstTimeLogin",
    "name_ar": "تيست",
    "mobile": "0123456789",
    "email": "first@gmail.com",
    "status": "active",
    "last_active": "2025-12-05 18:06:07",
    "created_at": "2025-12-05 17:57:54",
    "updated_at": "2025-12-05 18:06:07",
    "roles": ["super-admin"]
  },
  "meta": {
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "token_type": "Bearer",
    "expires_at": "2026-12-05T18:06:07.000000Z"
  }
}
```

### 5. Redirect to Dashboard
After successful password change:
- The new access token is stored
- User data is stored in localStorage
- Success toast is shown: "Password Changed Successfully!"
- User is redirected to their appropriate dashboard based on role

## Implementation Details

### Files Modified

#### 1. `lib/auth.ts`
- **Updated `LoginResponse` interface** to include `requires_password_change` flag
- **Added `SetPasswordRequest` and `SetPasswordResponse` interfaces**
- **Modified `login()` function** to handle password change requirement
- **Added `setPassword()` function** for the set-password API endpoint
- **Exported `getToken()`** for public use

#### 2. `app/[locale]/login/page.tsx`
- **Updated all login handlers** to check for `requires_password_change`
- **Added redirect logic** to `/set-password` when password change is required
- **Updated toast notifications** for password change requirement
- Handles response correctly with optional `data` field

#### 3. `app/[locale]/set-password/page.tsx` (New)
- **Complete set password page** with form validation
- **Security check**: Ensures user has a valid token before allowing password change
- **Form validation**: 
  - Password required
  - Minimum 6 characters
  - Passwords must match
- **Error handling**: Displays server validation errors
- **Success flow**: Stores new token and redirects to dashboard

#### 4. `messages/en.json` & `messages/ar.json`
- Added translations for set password feature
- Added password change required messages in login section

### API Endpoints

#### Login Endpoint
- **URL**: `/api/login`
- **Method**: `POST`
- **Returns**: `LoginResponse` with optional `requires_password_change` flag

#### Set Password Endpoint
- **URL**: `/api/set-password`
- **Method**: `POST`
- **Auth**: Requires Bearer token from initial login
- **Body**:
  ```json
  {
    "new_password": "string",
    "new_password_confirmation": "string"
  }
  ```

### Security Features

1. **Token Required**: Set password page checks for valid token on mount
2. **Temporary Token**: Initial login provides temporary token for set-password only
3. **New Token Issued**: After password change, a new permanent token is issued
4. **Validation**: Server-side validation for password requirements
5. **Auto-redirect**: Prevents access to set-password without valid token

### User Experience

#### English Messages
- **Title**: "Set Your Password"
- **Subtitle**: "Welcome! Please set a new password for your account."
- **Password Hint**: "Your password must be at least 6 characters long."
- **Success**: "Password Changed Successfully!"
- **Welcome**: "Welcome to Tawsila, {name}!"

#### Arabic Messages
- **Title**: "تعيين كلمة المرور"
- **Subtitle**: "مرحباً! يرجى تعيين كلمة مرور جديدة لحسابك."
- **Password Hint**: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل."
- **Success**: "تم تغيير كلمة المرور بنجاح!"
- **Welcome**: "مرحباً بك في توصيلة، {name}!"

### Validation Rules

1. **Password Requirements**:
   - Minimum 6 characters
   - Required field
   - Must match confirmation

2. **Server Validation**:
   - Handled by backend
   - Errors displayed in form
   - Field-specific error messages

### Error Handling

1. **No Token**: Redirects to login with error toast
2. **Validation Errors**: Displayed under respective fields
3. **API Errors**: Shows error toast with server message
4. **Network Errors**: Generic error message

### Testing the Flow

1. **Create a Test User**:
   - Login as super admin
   - Go to Users page
   - Click "Add User"
   - Create user with initial password

2. **Test First Login**:
   - Logout from admin account
   - Login with new user credentials
   - Should see "Password Change Required" toast
   - Should redirect to `/set-password`

3. **Set New Password**:
   - Enter new password (min 6 chars)
   - Confirm password
   - Click "Set Password"
   - Should see success toast
   - Should redirect to dashboard

4. **Verify Access**:
   - Should be logged in with new credentials
   - Can navigate the dashboard
   - Token is valid for subsequent requests

## Technical Notes

### Performance Optimizations
All input handlers use `useCallback` to prevent unnecessary re-renders and ensure smooth typing experience.

### Type Safety
All interfaces are properly typed with TypeScript for both request and response data.

### Internationalization
Full support for English and Arabic with proper RTL layout for Arabic.

### Accessibility
- Proper form labels
- Error messages linked to inputs
- Loading states for better UX
- Keyboard navigation support

## Future Enhancements

1. **Password Strength Indicator**: Visual feedback on password strength
2. **Password Requirements List**: Show all requirements with checkmarks
3. **Forgot Password**: Implement password reset via email
4. **Password History**: Prevent reuse of recent passwords
5. **Custom Password Policy**: Admin-configurable password requirements




