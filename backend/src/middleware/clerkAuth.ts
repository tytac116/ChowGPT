import { Request, Response, NextFunction } from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Extend the Express Request interface to include auth
declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
        sessionId: string;
        claims?: any;
      };
    }
  }
}

// Create the Clerk authentication middleware
export const clerkAuth = ClerkExpressRequireAuth();

// Wrapper middleware with custom error handling
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  clerkAuth(req, res, (error: any) => {
    if (error) {
      console.error('Clerk authentication error:', error);
      
      // Handle different types of authentication errors
      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please sign in to access this resource'
        });
      }
      
      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          error: 'Access forbidden',
          message: 'You do not have permission to access this resource'
        });
      }
      
      // Generic error response
      return res.status(500).json({
        success: false,
        error: 'Authentication service error',
        message: 'An error occurred while verifying your authentication'
      });
    }
    
    // Call next() and return to satisfy TypeScript
    next();
    return;
  });
};

// Optional: Middleware to get user info (doesn't require auth)
export const clerkUserInfo = (req: Request, res: Response, next: NextFunction): void => {
  // This can be used to get user info without requiring authentication
  // Useful for optional authentication endpoints
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      // You can verify the token here if needed
      // For now, we'll just pass it through
      req.auth = { userId: 'optional', sessionId: 'optional' };
    }
    next();
  } catch (error) {
    // Don't fail if optional auth fails
    next();
  }
};

// Development-only bypass middleware (use with caution!)
export const devBypassAuth = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.warn('⚠️  BYPASSING AUTHENTICATION IN DEVELOPMENT MODE');
    req.auth = {
      userId: 'dev-user',
      sessionId: 'dev-session'
    };
    return next();
  }
  
  // In production or when bypass is not enabled, use regular auth
  return requireAuth(req, res, next);
}; 