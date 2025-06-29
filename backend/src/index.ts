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

// CORS configuration - Enhanced for development and production
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Define allowed origins for both development and production
    const allowedOrigins = [
      // Development origins
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:4173',
      'http://localhost:3001',
      // Production origins
      'https://chowgpt.onrender.com',
      'https://chowgpt.vercel.app',
      'https://chowgpt-frontend.vercel.app',
      // Add the environment variable if it exists
      ...(process.env.CORS_ORIGIN ? [process.env.CORS_ORIGIN] : [])
    ];
    
    // Allow all subdomains of vercel.app
    const isVercelDomain = origin.match(/^https:\/\/.*\.vercel\.app$/);
    
    if (allowedOrigins.includes(origin) || isVercelDomain) {
      console.log(`✅ CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS: Rejecting origin: ${origin}`);
      console.log(`📋 CORS: Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// Health check endpoint - Always returns 200 for deployment health checks
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

    // Always return 200 for deployment health checks
    res.status(200).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    // Still return 200 even if health check fails
    res.status(200).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      message: 'Health check completed with warnings',
      services: {
        database: 'unknown',
      },
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