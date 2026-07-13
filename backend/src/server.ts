import path from 'path';
import dotenv from "dotenv";
dotenv.config();
// Configure environment variables before importing App
dotenv.config();

import app from './app';
import connectDB from './config/database';
import { validateAIConfig } from './services/ai';

const PORT = process.env.PORT || 5000;

// Start database connection and listening
const startServer = async () => {
  try {
    // Fail fast on AI misconfiguration BEFORE accepting traffic, rather than
    // deferring failures (and silent fallbacks) to the first AI request.
    const aiConfig = validateAIConfig();
    console.log(`🤖 AI provider: ${aiConfig.provider} (model: ${aiConfig.provider === 'gemini' ? aiConfig.geminiModel : aiConfig.openaiModel})`);

    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

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
