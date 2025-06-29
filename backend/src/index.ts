import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { SERVER_CONFIG, isDevelopment } from './config';
import { errorHandler, notFoundHandler } from './utils/errorHandler';
import { supabaseService } from './services/supabaseClient';

// Import API routes
import restaurantsRouter from './api/restaurants/index';
import searchRouter from './api/search';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Enhanced for development
const corsOptions = {
  origin: isDevelopment 
    ? ['http://localhost:3000', 'http://localhost:3000','http://localhost:5173', 'http://localhost:4173', 'https://chowgpt.onrender.com'] // Allow common dev ports
    : SERVER_CONFIG.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: SERVER_CONFIG.rateLimitWindowMs,
  max: SERVER_CONFIG.rateLimitMaxRequests,
  message: {
    error: 'Too Many Requests',
    message: 'You have exceeded the request limit. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging in development
if (isDevelopment) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      query: req.query,
      body: req.body,
      headers: req.headers,
    });
    next();
  });
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const dbConnected = await supabaseService.testConnection();
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: SERVER_CONFIG.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: dbConnected ? 'connected' : 'disconnected',
        // vectorDatabase: 'not_implemented', // Will be added later
        // aiService: 'not_implemented', // Will be added later
      },
      features: {
        basicSearch: true,
        vectorSearch: true,
        aiFeatures: true,
      }
    };

    // Return 503 if any critical service is down
    const statusCode = dbConnected ? 200 : 503;
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed',
      error: isDevelopment ? error : undefined,
    });
  }
});

// API routes
app.use(`${SERVER_CONFIG.apiPrefix}/restaurants`, restaurantsRouter);
app.use(`${SERVER_CONFIG.apiPrefix}/search`, searchRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'ChowGPT Backend API',
    version: '1.0.0',
    description: 'AI-powered restaurant finder backend',
    documentation: '/api/docs', // Will be added later
    endpoints: {
      health: '/health',
      restaurants: `${SERVER_CONFIG.apiPrefix}/restaurants`,
      search: `${SERVER_CONFIG.apiPrefix}/search`,
    },
    features: {
      basicSearch: true,
      vectorSearch: true,
      aiFeatures: true,
    }
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection on startup
    console.log('🔍 Testing database connection...');
    const dbConnected = await supabaseService.testConnection();
    
    if (!dbConnected) {
      console.error('❌ Database connection failed');
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    
    // Start listening
    app.listen(SERVER_CONFIG.port, () => {
      console.log(`🚀 ChowGPT Backend API Server started`);
      console.log(`📍 Server running on port ${SERVER_CONFIG.port}`);
      console.log(`🌍 Environment: ${SERVER_CONFIG.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${SERVER_CONFIG.port}/health`);
      console.log(`📡 API endpoints: http://localhost:${SERVER_CONFIG.port}${SERVER_CONFIG.apiPrefix}`);
      
      if (isDevelopment) {
        console.log(`🔧 Development mode - detailed logging enabled`);
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app; 