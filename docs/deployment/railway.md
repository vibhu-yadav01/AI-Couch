# Railway Deployment Guide

1. **Sign Up:** Go to [railway.app](https://railway.app) and create an account.
2. **New Project:** Click **New Project** and select **Deploy from GitHub repo**.
3. **Configure Project:**
   - Add your `ai-interview-coach` repository.
   - Click **Add Variables** and input your environment variables (e.g., `MONGODB_URI`, `JWT_SECRET`, `AI_PROVIDER`, `OPENAI_API_KEY`, etc.).
4. **Configure Service:**
   - Go to **Settings** > **Build**.
   - **Builder:** Select `Nixpacks` or `Dockerfile` (Nixpacks usually works well out of the box).
   - **Root Directory:** Set this to `/backend`.
   - **Start Command:** `npm start`
5. **Generate Domain:** Go to **Settings** > **Networking** and click **Generate Domain**.
6. **Deploy:** Railway will automatically build and deploy. Once live, use the generated domain for your API.
