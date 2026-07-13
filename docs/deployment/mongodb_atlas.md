# MongoDB Atlas Deployment Guide

1. **Create an Account:** Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. **Deploy a Cluster:** Click **Build a Cluster** and choose the **Shared (Free)** tier. Select a cloud provider and region closest to your backend hosting location.
3. **Set Up Database Access:** Go to **Database Access** under Security and click **Add New Database User**. Provide a username and a strong, auto-generated password. Save this password.
4. **Set Up Network Access:** Go to **Network Access**, click **Add IP Address**, and add `0.0.0.0/0` (Allow access from anywhere) or specifically the IP addresses of your backend deployment.
5. **Get the Connection String:** Go to **Databases** -> **Connect** -> **Connect your application**. Copy the connection string.
6. **Configure Environment Variables:** Replace `<password>` in the connection string with the database user's password. Add this as the `MONGODB_URI` environment variable in your `.env` or cloud provider environment settings.
