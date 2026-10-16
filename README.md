<p align="center">
  <img src="assets/images/icon.png" alt="Yapify app icon" width="120">
</p>

<h1 align="center">Yapify</h1>

<p align="center"><strong>Catch what your friends say before they deny it.</strong></p>

Yapify is a private social app for friend groups. Someone says something ridiculous, you post it as a quote attributed to them, and the rest of the group can witness it ("I was there"), react, and play a guessing game: *who said it?* Think of it as receipts for the wildest things your friends will ever say.

This repo is the iOS app, built with React Native and Expo. The API lives in [yapify](https://github.com/solomonrodrigues/yapify).

**Status:** Built through to App Store–ready (accounts, groups, push notifications, moderation, privacy and terms) but not currently live. I'd like to bring it back one day.

## Features

- **Feed** of quotes from your groups, with filters, infinite scroll and skeleton loading states
- **Posting** a quote with context, attributed to a group member or to someone not on the app
- **"Who said it?"** guessing, with streaks and weekly skips
- **Witnessing, likes and responses**, plus saving and hiding quotes
- **Groups**: create a group, invite friends, manage members and settings
- **Shareable quote cards**, rendered to an image for sharing outside the app
- **Notifications**, in-app and push
- **Onboarding, email verification and password reset**
- **Profiles, search, blocking and account deletion**

## Built with

- **Expo SDK 54** and **React Native 0.81**, written in **TypeScript**
- **Expo Router** for file-based navigation (`app/`)
- **Reanimated**, **Gesture Handler** and **Skia** for animation, gestures and the blurred gradient backgrounds
- **Expo Haptics**, **Expo Notifications** and **Expo Secure Store** (for auth tokens)
- **Axios** with automatic JWT refresh
- **openapi-typescript**, generating API types from the backend's OpenAPI schema
- **EAS Build** for development and production builds

## Project layout

```
app/
├── (auth)/        # Sign in, onboarding, email verification, password reset
└── (app)/         # Signed-in app
    ├── (tabs)/    # Feed, post, notifications, profile
    ├── groups/    # Create a group, members, settings
    └── …          # Quote detail, search, saved and hidden quotes, account screens
components/        # Feed quote, guess button, shareable quote card, UI primitives
lib/api/           # API client and token refresh
types/             # Types generated from the OpenAPI schema
```

## Running locally

```bash
npm install
npx expo start
```

The app talks to the API URL set in `lib/api/client.ts`. To use a local backend, run [yapify](https://github.com/solomonrodrigues/yapify) and point that URL at it. Push notifications need a development build (`eas build --profile development`) rather than Expo Go.

To regenerate the API types after the backend changes, download the schema from the backend's `/api/schema/` endpoint and run:

```bash
npx openapi-typescript path/to/schema.yaml -o types/schema.ts
```
