# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Yapify is a React Native mobile app built with Expo that allows users to share, discover, and interact with quotes. The app features authentication, social interactions (likes, witnesses, guessing who said the quote), and a feed-based UI.

## Commands

### Development
- `npm start` - Start the Expo development server
- `npx expo start` - Alternative way to start development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

### Code Quality
- `npm run lint` - Run ESLint to check code quality

### Type Generation
When the API schema changes, regenerate TypeScript types from the OpenAPI specification:
```bash
npx openapi-typescript "/path/to/Yapify API.yaml" -o "/Users/solomonrodrigues/Personal/yapify-app/types/schema.ts"
```

## Architecture

### Routing & Navigation
The app uses **Expo Router** with file-based routing. The routing structure is:
- `app/_layout.tsx` - Root layout with providers and theme configuration
- `app/index.tsx` - Entry point that redirects based on auth state
- `app/(auth)/*` - Authentication flows (login, registration, email verification, password reset)
- `app/(app)/*` - Protected app routes (requires authentication)
  - `app/(app)/(tabs)/*` - Bottom tab navigation (index=feed, post, notifications, profile)
  - `app/(app)/(modals)/*` - Modal screens (quote actions)
  - `app/(app)/[quoteID].tsx` - Dynamic quote detail route
  - `app/(app)/user/[userID].tsx` - User profile route
  - `app/(app)/saved-quotes.tsx` - Saved quotes screen
  - `app/(app)/my-account.tsx` - Account settings

Authentication state is checked in `app/(app)/_layout.tsx` which redirects to `/(auth)` if not logged in.

### State Management via Context

The app uses React Context for global state management. Context providers are stacked in `app/_layout.tsx` in the following order (outermost to innermost):
1. **AuthProvider** (`context/AuthContext.tsx`) - Authentication state and token management
2. **UserProvider** (`context/UserContext.tsx`) - Current user profile data
3. **QuotesProvider** (`context/QuotesContext.tsx`) - Global quotes feed state
4. **QuoteActionsModalProvider** (`context/QuoteActionsModalContext.tsx`) - Modal state for quote actions

### API Client Architecture

**Token Management** (`lib/api/client.ts` + `lib/utils/storage.ts`):
- Access tokens are stored **in-memory only** (never persisted to disk)
- Refresh tokens are stored in **SecureStore** (encrypted on-device storage)
- On app startup, the refresh token is used to obtain a new access token
- Axios interceptors automatically attach the access token to requests
- On 401 responses, the client automatically refreshes tokens using a **queue system** to prevent multiple simultaneous refresh requests

**Request/Response Flow**:
1. Request interceptor adds `Authorization: Bearer <access_token>` header
2. If response is 401 and not already retrying:
   - Lock refresh operation (set `isRefreshing = true`)
   - Queue any concurrent requests that also received 401
   - Call refresh endpoint with refresh token
   - Update stored tokens
   - Resolve all queued requests with new access token
   - Retry original request
3. If refresh fails with 400/401 (invalid refresh token), clear tokens and trigger logout

**Logout Handler**:
The API client uses `setOnLogoutHandler()` to register the `AuthContext.logout()` function. This allows the client to trigger logout from anywhere (e.g., when refresh token expires).

**API Modules**:
- `lib/api/client.ts` - Core Axios instance with interceptors
- `lib/api/auth.ts` - Login, registration, email verification
- `lib/api/quotes.ts` - Quote CRUD, like, witness, guess, save/unsave actions
- `lib/api/profile.ts` - User profile operations
- `lib/api/friends.ts` - Friend relationships
- `lib/api/notifications.ts` - Notifications

### Feed System

The app uses a reusable feed hook pattern:

**`useQuotesFeed` hook** (`hooks/useQuotesFeed.tsx`):
- Core reusable logic for any quote feed (global, user-scoped, saved quotes, etc.)
- Handles loading, refreshing, pagination, and optimistic updates
- Takes optional `scope` parameter to fetch different feeds (e.g., `{ user: 123 }` for user quotes)
- Takes optional `fetcher` function for custom data fetching
- All quote actions (like, witness, guess, save/unsave, hide/unhide) use optimistic updates with rollback on error

**Context Pattern**:
`QuotesProvider` wraps the global feed and makes it available via `useQuotes()`. Other screens can use `useQuotesFeed()` directly with different scopes (e.g., user profiles use `useUserQuotesFeed` which wraps `useQuotesFeed` with user scope).

### Component Patterns

**Themed Components**:
- `ThemedView` and `ThemedText` automatically adapt to light/dark mode
- `useThemedStyles` hook for creating theme-aware stylesheets
- Theme colors defined in `constants/Colors.ts`

**Key Components**:
- `FeedQuote` - Quote card displayed in feeds with all interaction buttons
- `UnifiedProfile` - Reusable profile header component
- `GuessButton` - Complex button for the quote guessing game
- `FilterPicker` - Segmented control for feed filtering

### Animation & UI Libraries

- `@legendapp/list` - Performant list component used for feeds
- `react-native-reanimated` - Animation library
- `@legendapp/motion` - Declarative animations
- `@shopify/react-native-skia` - Canvas rendering for custom graphics
- `expo-blur` - Blur effects for backgrounds and overlays

### Platform Considerations

**iOS-specific**:
- Tablet support is disabled (`app.json` sets `ios.supportsTablet: false`)
- Modal presentation uses iOS-specific `sheetAllowedDetents` and `sheetGrabberVisible` options
- Platform version detection used for iOS 26+ features (e.g., transparent modal backgrounds)

**Android**:
- Edge-to-edge display enabled (`android.edgeToEdgeEnabled: true`)

## Design Principles

### Feed Quote Card
- The card is **content-first** — quote text (Lora, 27px) is the hero element
- Header uses `[Author] quoted [Quoted Person]` pattern with three-dot menu in the top-right corner
- The **author is de-emphasized** (medium weight, secondary text color) so the quoted person is the clear focal point. The author blends with the "quoted" verb as contextual text.
- The **quoted person is prominent** (semibold, primary text color) — they said the interesting thing
- Both names use **display_name** — never mix usernames and display names in the same line; consistency matters more than clever formatting
- **No avatars in feed cards** — keeps cards content-focused, avoids clutter
- **In-app users** have tappable names that navigate to profiles
- **External/custom names** (not registered users) are rendered in *italic*, normal weight, secondary text color — signals "not a profile" without badges. The tappability difference + italic styling prevents "dead tap" frustration.
- All names use the **same font size** (14px) — hierarchy comes from weight and color, not size differences

### Color System
- Each quote card has a **gradient left strip** blending the hash-based pastel color (top) with the quoted user's profile color (bottom)
- Pastel colors use a **djb2 hash** on the quote ID for even distribution across a 10-color palette
- When the quoted user is external (no profile), the strip falls back to a solid hash color

## Key Patterns to Follow

### API Calls
All API functions should use the shared `api` client from `lib/api/client.ts` to ensure auth interceptors are applied. For auth endpoints (login, refresh), use the separate `authClient` to avoid interceptor loops.

### Type Safety
Types are auto-generated from OpenAPI spec in `types/schema.ts`. Additional manual types are in `types/api.ts`. Never manually edit `types/schema.ts`.

### Error Handling
Use `getErrorMessage()` from `lib/utils/error.ts` to safely extract error messages from unknown error types (Axios errors, Error objects, strings, etc.).

### Quote Actions
When modifying quote state (like, witness, save, etc.), always use optimistic updates in the feed hook with rollback logic on API failure. This ensures instant UI feedback.

### Modals
The app uses Expo Router's modal presentation for overlays. The `QuoteActionsModalProvider` manages quote selection state and navigation to the modal route.

### Navigation
Use `useRouter()` from `expo-router` for programmatic navigation. Use typed routes from `expo-router/types` for type-safe navigation.

## Important Files

- `types/schema.ts` - Auto-generated API types (DO NOT manually edit)
- `types/api.ts` - Manual type definitions and extensions
- `lib/api/client.ts` - Core API client with auth interceptors
- `hooks/useQuotesFeed.tsx` - Reusable feed logic
- `app/_layout.tsx` - Root layout with provider hierarchy
- `context/AuthContext.tsx` - Authentication flow and token lifecycle

## Dependencies

Notable dependencies:
- `expo` ~54.0.31 - Expo framework
- `expo-router` ~6.0.21 - File-based routing
- `react-native` 0.81.5 - React Native
- `axios` ^1.11.0 - HTTP client
- `@legendapp/list` ~2.0.11 - High-performance lists
- `react-native-reanimated` ~4.1.1 - Animations
- `expo-secure-store` ~15.0.8 - Encrypted storage for tokens
