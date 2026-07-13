# Render Deployment Guide

1. **Connect GitHub:** Sign up at [render.com](https://render.com) and link your GitHub account.
2. **Create a Web Service:** Click **New +** and select **Web Service**.
3. **Select Repository:** Choose your `ai-interview-coach` repository.
4. **Configure Service:**
   - **Name:** e.g., `ai-interview-coach-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd backend && npm install && npm run build`
   - **Start Command:** `cd backend && npm start`
5. **Environment Variables:** Click **Advanced** and add the following:
   - `PORT`: (Leave blank or set to 10000, Render sets this)
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A strong secret key
   - `AI_PROVIDER`: `openai` or `gemini`
   - `OPENAI_API_KEY`: Your OpenAI key
   - `GEMINI_API_KEY`: Your Gemini key
   - `STORAGE_PROVIDER`: `aws`
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret
   - `AWS_REGION`: Your AWS region
   - `AWS_S3_BUCKET`: Your S3 bucket name
   - `NODE_ENV`: `production`
6. **Deploy:** Click **Create Web Service**. Render will build and deploy the backend API.
7. **Copy API URL:** Once deployed, copy the service URL (e.g., `https://ai-interview-coach-backend.onrender.com`) and update your frontend's API client to point to this URL.
