# API Connection Troubleshooting Guide

## Common Issues and Solutions

### 1. Authentication Failures

**Problem**: "Authentication required" or "Unauthorized" errors
**Solutions**:
- Verify that you're logged in and have a valid auth token
- Check that the auth token is being sent in the Authorization header as `Bearer <token>`
- Ensure the token hasn't expired (check expiration time)
- Try logging out and logging back in to get a fresh token

### 2. Network Connection Issues

**Problem**: "Network error" or timeouts
**Solutions**:
- Verify that the API server is running
- Check that you're using the correct IP address for the API server
- For mobile development:
  - Android emulator: Use `10.0.2.2` as the host
  - iOS simulator: Use `localhost`
  - Physical device: Use your development machine's IP address
- Ensure your development machine's firewall allows connections on the API port

### 3. CORS Issues

**Problem**: Browser blocks requests due to CORS policy
**Solutions**:
- Ensure the Next.js API routes include proper CORS headers
- For development, you can disable CORS restrictions in your browser (not recommended for production)

### 4. Parameter Passing Issues

**Problem**: API endpoints not receiving expected parameters
**Solutions**:
- For GET requests, pass parameters in the `params` object:
  ```javascript
  apiClient.get('/endpoint', { params: { key: 'value' } })
  ```
- For POST/PUT requests, pass data as the second parameter:
  ```javascript
  apiClient.post('/endpoint', { key: 'value' })
  ```

## Testing API Connectivity

Use the test API functions to verify connectivity:

```javascript
import { testApi } from '@/lib/api';

// Test basic connectivity
const connectivityTest = await testApi.testConnection();

// Test authentication
const authTest = await testApi.testAuth();

// Test specific endpoints
const writingTest = await testApi.testWritingExercises();
```

## Environment Configuration

### Development Environment Variables

Create a `.env` file in your mobile app root with:

```
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:3000/api
```

### Common IP Addresses for Development

- **Android Emulator**: `10.0.2.2`
- **iOS Simulator**: `localhost`
- **Physical Device**: Your machine's local IP (e.g., `192.168.1.10`)

## Debugging Tips

1. **Enable Logging**: Check the console logs in both the mobile app and the API server
2. **Network Inspection**: Use tools like React Native Debugger or Flipper to inspect network requests
3. **Token Verification**: Verify that auth tokens are being stored and retrieved correctly
4. **Server Logs**: Check the Next.js server logs for authentication and API request information

## Common Fixes

### Update API Base URL

In `lib/api.ts`, make sure the BASE_URL is correct for your environment:

```typescript
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:3000/api';
```

### Verify Token Storage

Check that tokens are being stored correctly in SecureStore:

```javascript
import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('authToken', token);

// Retrieve token
const token = await SecureStore.getItemAsync('authToken');
```

### Check API Route Implementation

Ensure API routes properly handle both cookie-based and header-based authentication:

```javascript
// In your Next.js API routes
import { getAuthenticatedUser } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    // ... rest of implementation
  } catch (error) {
    return new NextResponse('Unauthorized', { status: 401 });
  }
}
```