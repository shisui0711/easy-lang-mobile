# EasyLang Mobile

A React Native mobile application for language learning, built with Expo and designed to complement the EasyLang web application.

## Features

- **Authentication**: Sign in/Sign up with secure token storage
- **Dashboard**: Overview of learning progress, stats, and quick actions
- **Learning Modules**: Vocabulary, Writing, Speaking, Reading, Listening, and Grammar
- **Progress Tracking**: Weekly activity charts, skill levels, and achievements
- **User Profile**: Personal stats, settings, and account management
- **Modern UI**: Beautiful gradients, cards, and responsive design

## Tech Stack

- **React Native** with **Expo Router** for navigation
- **TypeScript** for type safety
- **Expo Linear Gradient** for beautiful UI
- **React Query** for API state management
- **Expo Secure Store** for secure token storage
- **React Hook Form** with **Zod** for form validation

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd easy-lang-mobile
   npm install
   ```

2. **Start the Development Server**
   ```bash
   npm start
   ```

3. **Run on Device/Simulator**
   - For iOS: `npm run ios`
   - For Android: `npm run android`
   - For Web: `npm run web`

## Project Structure

```
app/
├── (tabs)/                 # Main app screens
│   ├── index.tsx          # Dashboard
│   ├── learn.tsx          # Learning modules
│   ├── progress.tsx       # Progress tracking
│   └── profile.tsx        # User profile
├── auth/                  # Authentication screens
│   ├── sign-in.tsx
│   ├── sign-up.tsx
│   └── _layout.tsx
└── _layout.tsx           # Root layout

components/
├── ui/                   # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Progress.tsx
│   ├── Badge.tsx
│   ├── Avatar.tsx
│   └── index.ts
└── ...

lib/                      # Utilities and helpers
├── api.ts               # API client
├── auth.ts              # Authentication manager
└── utils.ts             # Utility functions

contexts/                 # React contexts
├── AuthContext.tsx      # Authentication state
└── QueryProvider.tsx    # React Query provider

types/                   # TypeScript type definitions
└── index.ts
```

## API Integration

The app is designed to work with the EasyLang web application API. Update the `BASE_URL` in `lib/api.ts` to point to your backend server:

```typescript
const BASE_URL = 'http://your-api-url.com/api';
```

### API Configuration for Development

For mobile development, you'll need to use your machine's IP address instead of `localhost` since `localhost` on mobile refers to the device itself:

- **Android Emulator**: Use `10.0.2.2` as the host
- **iOS Simulator**: Use `localhost`
- **Physical Device**: Use your development machine's IP address (e.g., `192.168.1.10`)

Example configuration for Android emulator:
```typescript
const BASE_URL = 'http://10.0.2.2:3000/api';
```

You can also set the API URL using environment variables:
```bash
EXPO_PUBLIC_API_URL=http://YOUR_MACHINE_IP:3000/api
```

Then in your code:
```typescript
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000/api';
```

### Testing API Connectivity

The app includes built-in API testing utilities. You can run tests to verify connectivity:

```javascript
import { apiTestUtils } from '@/lib/api-test-utils';

// Run all tests
const results = await apiTestUtils.runAllTests();
console.log(results);
```

### Troubleshooting API Issues

If you encounter API connection issues:

1. **Verify the API server is running** on your development machine
2. **Check the IP address** you're using matches your machine's IP
3. **Ensure your firewall** allows connections on the API port (usually 3000)
4. **Verify authentication** by checking that tokens are being stored and sent correctly
5. **Check server logs** for authentication errors

For detailed troubleshooting steps, see [API Troubleshooting Guide](docs/api-troubleshooting.md).

## Key Features Implemented

### Authentication System
- JWT token management with secure storage
- Auto-refresh tokens
- Protected routes with authentication checks

### Dashboard
- Learning statistics overview
- Quick action cards for different learning modules
- Daily goal progress tracking
- Motivational streak counter

### Learning Modules
- Vocabulary review with spaced repetition
- Writing practice exercises
- Speaking pronunciation practice
- Reading comprehension
- Listening exercises
- Grammar lessons

### Progress Tracking
- Weekly activity charts
- Skill level progression
- Achievement system with different rarities
- Detailed statistics

### User Profile
- Personal information display
- Learning statistics
- Settings and preferences
- Account management

## Customization

### Theming
Colors and styles can be customized in the component files. The app uses a consistent color palette:
- Primary: Blue (#3B82F6)
- Secondary: Purple (#8B5CF6)
- Success: Green (#10B981)
- Warning: Orange (#F59E0B)
- Error: Red (#EF4444)

### Adding New Screens
1. Create new screen file in appropriate directory
2. Add navigation route if needed
3. Update TypeScript types for navigation

## Development Notes

- The app uses mock data for demonstration. Replace with real API calls.
- Authentication context manages global auth state
- All UI components are customizable and reusable
- Progress tracking uses local state - connect to backend for persistence
- Achievement system is ready for real implementation

## Future Enhancements

- Offline mode support
- Push notifications for study reminders
- Social features (friends, leaderboards)
- Advanced analytics and insights
- Voice recognition for speaking practice
- AR/VR learning experiences

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the EasyLang language learning platform.