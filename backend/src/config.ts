import { config } from 'dotenv';
import { SupabaseConfig, PineconeConfig, OpenAIConfig } from './types';

// Load environment variables
config();

// Validate required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'PORT'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Server configuration
export const SERVER_CONFIG = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  apiPrefix: process.env.API_PREFIX || '/api',
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

// Supabase configuration
export const SUPABASE_CONFIG: SupabaseConfig = {
  url: process.env.SUPABASE_URL!,
  anonKey: process.env.SUPABASE_ANON_KEY!,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Pinecone configuration (optional - will be used when vector search is implemented)
export const PINECONE_CONFIG: PineconeConfig | null = process.env.PINECONE_API_KEY ? {
  apiKey: process.env.PINECONE_API_KEY,
  environment: process.env.PINECONE_ENVIRONMENT || 'us-west1-gcp-free',
  indexName: process.env.PINECONE_INDEX_NAME || 'chowgpt-restaurants',
} : null;

// OpenAI configuration (optional - will be used for AI features)
export const OPENAI_CONFIG: OpenAIConfig | null = process.env.OPENAI_API_KEY ? {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
} : null;

// Search configuration
export const SEARCH_CONFIG = {
  defaultLimit: parseInt(process.env.DEFAULT_SEARCH_LIMIT || '20', 10),
  maxLimit: parseInt(process.env.MAX_SEARCH_LIMIT || '100', 10),
  defaultSemanticWeight: parseFloat(process.env.DEFAULT_SEMANTIC_WEIGHT || '0.7'),
};

// Logging configuration
export const LOGGING_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  enableConsole: process.env.ENABLE_CONSOLE_LOGGING !== 'false',
  enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
  logFilePath: process.env.LOG_FILE_PATH || './logs/app.log',
};

// Development helpers
export const isDevelopment = SERVER_CONFIG.nodeEnv === 'development';
export const isProduction = SERVER_CONFIG.nodeEnv === 'production';

// Feature flags
export const FEATURES = {
  vectorSearch: !!PINECONE_CONFIG,
  aiFeatures: !!OPENAI_CONFIG,
  enableCaching: process.env.ENABLE_CACHING === 'true',
  enableMetrics: process.env.ENABLE_METRICS === 'true',
};

console.log('🚀 Configuration loaded:', {
  port: SERVER_CONFIG.port,
  nodeEnv: SERVER_CONFIG.nodeEnv,
  features: FEATURES,
  supabaseUrl: SUPABASE_CONFIG.url,
  hasSupabaseServiceKey: !!SUPABASE_CONFIG.serviceRoleKey,
  hasPinecone: !!PINECONE_CONFIG,
  hasOpenAI: !!OPENAI_CONFIG,
}); 