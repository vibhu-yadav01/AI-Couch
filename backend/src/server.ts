import path from 'path';
import dotenv from "dotenv";
// Configure environment variables before importing App
dotenv.config();

import app from './app';
import connectDB from './config/database';
import { validateAIConfig } from './services/ai';

const PORT = process.env.PORT || 5000;

// Start database connection and listening
const startServer = async () => {
  try {
    const server = app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    try {
      const aiConfig = validateAIConfig();
      console.log(`🤖 AI provider: ${aiConfig.provider} (model: ${aiConfig.provider === 'gemini' ? aiConfig.geminiModel : aiConfig.openaiModel})`);
    } catch (aiErr: any) {
      console.warn(`⚠️ AI configuration warning: ${aiErr.message}`);
    }

    await connectDB();

    // Handle system signals for graceful shutdown
    const handleShutdown = (signal: string) => {
      console.log(`\nSystem received ${signal}. Shutting down gracefully...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

  } catch (error) {
    console.error('Fatal server start error:', error);
    process.exit(1);
  }
};

startServer();
