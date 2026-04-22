# Yapify - React Native/Expo mobile app

## Generating TypeScript Types from OpenAPI

We use the openapi-typescript package to generate TypeScript type definitions from our OpenAPI schema. This step only needs to be done when the API specification has changed.

Run the following command, updating the paths to match your local environment:
```
Windows
npx openapi-typescript "C:\Users\Solom\Downloads\yapifySchema.yaml" -o C:\Users\Solom\Sites\yapify-app\types\schema.ts
MacOS:
npx openapi-typescript "/Users/solomonrodrigues/Downloads/Yapify API(22).yaml" -o "/Users/solomonrodrigues/Personal/yapify-projects/yapify-app/types/schema.ts"
```
Notes
- The first path points to your OpenAPI schema file (.yaml or .json).
- The -o option specifies the output file where the generated TypeScript types will be saved.


This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
