# Oanh Shop mobile app

This is the native React Native / Expo application. The existing Express + MySQL backend is shared with the store API.

## Run on an Android emulator

1. Start MySQL and the backend: from `../backend`, run `npm run dev`.
2. From this folder, run `npm start`.
3. Open the project in Android Emulator or scan the Expo QR code with Expo Go.

The default Android Emulator API address is `http://10.0.2.2:5000`, which routes to port 5000 on the development computer.

## Build an installable Android APK

1. From this folder, run `npx expo prebuild --platform android` if the `android` folder has not been generated.
2. Set `EXPO_PUBLIC_API_URL` in `.env` to the backend computer's LAN address (for example `http://192.168.1.20:5000`) before building for a physical phone.
3. Run `npm run apk`.
4. Find the APK at `android/app/build/outputs/apk/release/app-release.apk`.

The local APK is signed with the Android debug key and is intended for development/demo installation, not Play Store distribution. Android may ask you to allow installation from the source that opened the APK.

## Run in a web browser

1. Start MySQL and the backend: from `../backend`, run `npm run dev`.
2. From this folder, run `npm run web`.
3. Open the local URL printed by Expo. In a browser, the API defaults to `http://localhost:5000/api`.

When the app is opened from localhost or a private LAN address, it uses that same host for the API and port 5000. This keeps local web development working even if `.env` contains the LAN address used by a physical phone. On a deployed/public web host, set `EXPO_PUBLIC_API_URL` to the API server URL. The backend already enables CORS for browser development.

## Run on a physical phone

1. Connect the phone and computer to the same Wi-Fi network.
2. Copy `.env.example` to `.env` and set `EXPO_PUBLIC_API_URL` to the computer's LAN address, for example `http://192.168.1.20:5000`.
3. Allow Node.js / port 5000 through the computer firewall if prompted.
4. Restart Expo with `npx expo start --clear`.

Do not use `localhost` or `10.0.2.2` for a physical phone: those addresses point to the phone itself or Android emulator host mapping, not the developer computer.

## Features

- Register, sign in, persistent session, and profile editing
- Product catalog, category filters, product detail, and inventory-aware cart
- Admin dashboard, product create/edit/delete, and user create/edit/delete

Create the MySQL schema and promote an account to admin using the steps in `../backend/README.md`.
