# Authentication Fix for Mobile API Calls

## Problem Description

The mobile app was unable to call API endpoints due to authentication failures, even though valid JWT tokens were being sent in the Authorization header. The error was:

```
GET /api/writing/exercises?type=SENTENCE&level=Beginner&pageSize=20 500
Authentication failed: Error: Unauthorized - Authentication required
```

## Root Cause

The issue was in the server-side authentication implementation. The API routes were using the [verifyJWT](file:///D:/WebProject/EasyLangProject/easy-lang/lib/jwt-auth.ts#L37-L74) function which only checked for tokens in cookies, but did not properly handle Authorization headers from mobile clients.

Additionally, the [validateJWTRequest](file:///D:/WebProject/EasyLangProject/easy-lang/lib/jwt-auth.ts#L104-L169) function (used by [getAuthenticatedUser](file:///D:/WebProject/EasyLangProject/easy-lang/lib/jwt-auth.ts#L199-L206)) had a mismatch in how it extracted tokens from requests - it was using `await headers()` which is for App Router server components, not API routes which use the [NextRequest](file:///D:/WebProject/EasyLangProject/easy-lang/node_modules/next/dist/server/web/spec-extension/request.d.ts#L17-L54) object.

## Solution Implemented

### 1. Created a New Authentication Function

A new function `getAccessTokenFromRequest` was created specifically for API routes that properly extracts tokens from both cookies and Authorization headers:

```typescript
export async function getAccessTokenFromRequest(request: Request): Promise<string | null> {
  try {
    // First try to get token from cookies (for web clients)
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {} as Record<string, string>);
      
      if (cookies.accessToken) {
        return cookies.accessToken;
      }
    }
    
    // If no cookie token, try Authorization header (for mobile clients)
    const authHeader = request.headers.get('authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting access token from request:', error);
    return null;
  }
}
```

### 2. Updated API Routes

The writing exercises and submissions API routes were updated to use the new authentication approach:

```typescript
// In API routes
const authResult = await verifyJWT(req);

if (!authResult.success || !authResult.payload) {
  return new NextResponse('Unauthorized - Authentication required', { status: 401 });
}

const userId = authResult.payload.userId;
```

### 3. Enhanced verifyJWT Function

The [verifyJWT](file:///D:/WebProject/EasyLangProject/easy-lang/lib/jwt-auth.ts#L37-L74) function was updated to use the new `getAccessTokenFromRequest` function:

```typescript
export async function verifyJWT(request: NextRequest): Promise<{
  success: boolean;
  payload: { userId: string; role: string } | null;
  error?: string;
}> {
  try {
    // Get access token from cookies or Authorization header
    const accessToken = await getAccessTokenFromRequest(request);
    
    if (!accessToken) {
      return { success: false, payload: null, error: 'No access token' };
    }

    // Verify access token
    const tokenPayload = verifyToken(accessToken);
    
    if (!tokenPayload) {
      return { success: false, payload: null, error: 'Invalid access token' };
    }

    // Get user from database to ensure user still exists
    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.userId },
      select: {
        id: true,
        role: true
      }
    });

    if (!user) {
      return { success: false, payload: null, error: 'User not found' };
    }

    return {
      success: true,
      payload: {
        userId: user.id,
        role: user.role.toLowerCase()
      }
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return { success: false, payload: null, error: 'Verification failed' };
  }
}
```

## Testing

A comprehensive test suite was created to verify the fix:

1. **Mobile Authentication Test Endpoint**: A new API endpoint `/api/test/mobile-auth` was created to specifically test mobile authentication
2. **Mobile App Test Utilities**: Utility functions were added to the mobile app for testing authentication
3. **Test Screen**: A test screen was added to the mobile app to easily verify the fix

## Verification

After implementing these changes, the mobile app should now be able to successfully:

1. Authenticate using JWT tokens sent in the Authorization header
2. Access protected API endpoints like `/api/writing/exercises` and `/api/writing/submissions`
3. Receive proper responses instead of 500 errors

## Future Improvements

1. Consider implementing a unified authentication approach across all API routes
2. Add more comprehensive logging for authentication failures
3. Implement rate limiting for authentication attempts
4. Add support for refresh tokens in mobile clients