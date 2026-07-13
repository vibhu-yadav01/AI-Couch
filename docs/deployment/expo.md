# Expo Deployment Guide

1. **Prerequisites:** Ensure you have an Expo account at [expo.dev](https://expo.dev) and EAS CLI installed (`npm install -g eas-cli`).
2. **Login:** Run `eas login` and authenticate.
3. **Configure Project:** In the `frontend` directory, run `eas build:configure`. Select the platforms you wish to build for (Android/iOS).
4. **Update `app.json`:** Ensure your `app.json` has an `extra` object containing your production backend URL:
   ```json
   "extra": {
     "apiUrl": "https://your-backend-url.com/api"
   }
   ```
5. **Build for Android:**
   - Run `eas build -p android --profile production`
   - Wait for the build to finish and download the APK or AAB file.
6. **Build for iOS (requires Apple Developer Account):**
   - Run `eas build -p ios --profile production`
   - Follow the prompts to provide your Apple credentials and provisioning profiles.
7. **Submit to Stores:** Use `eas submit` to upload the generated builds to the Google Play Store and Apple App Store.
