import { z } from 'zod';
import { SearchFilters, SearchQuery, VectorSearchQuery } from '../types';
import { Request, Response, NextFunction } from 'express';

// Base validation schemas
export const paginationSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(20),
  offset: z.number().int().min(0).optional().default(0),
});

export const searchFiltersSchema = z.object({
  category: z.string().optional(),
  priceLevel: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  openNow: z.boolean().optional(),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1).max(500),
  filters: searchFiltersSchema.optional(),
  limit: z.number().int().min(1).max(100).optional(),
  offset: z.number().int().min(0).optional(),
});

export const vectorSearchQuerySchema = searchQuerySchema.extend({
  semanticWeight: z.number().min(0).max(1).optional(),
  includeReviews: z.boolean().optional(),
});

// Restaurant ID validation
export const restaurantIdSchema = z.string().min(1).max(200);

// Query rewrite validation
export const queryRewriteSchema = z.object({
  originalQuery: z.string().min(1).max(500),
  context: z.string().optional(),
});

// Enhanced restaurant search validation schema for Step 2
export const enhancedRestaurantSearchSchema = z.object({
  query: z.string().optional().transform(val => val?.trim()),
  category: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  priceLevel: z.array(z.string()).optional(),
  rating: z.number().min(0).max(5).optional(),
  openNow: z.boolean().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sortBy: z.enum(['relevance', 'rating', 'reviewCount']).default('relevance'),
});

// Validation helper functions
export const validateSearchQuery = (data: any): SearchQuery => {
  return searchQuerySchema.parse(data);
};

export const validateVectorSearchQuery = (data: any): VectorSearchQuery => {
  return vectorSearchQuerySchema.parse(data);
};

export const validateSearchFilters = (data: any): SearchFilters => {
  return searchFiltersSchema.parse(data);
};

export const validateRestaurantId = (id: string): string => {
  return restaurantIdSchema.parse(id);
};

export const validatePagination = (data: any) => {
  return paginationSchema.parse(data);
};

// Common validation patterns
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeString = (str: string, maxLength = 1000): string => {
  return str.trim().slice(0, maxLength);
};

export const sanitizeSearchQuery = (query: string): string => {
  // Remove potentially harmful characters and limit length
  return query
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/[{}]/g, '') // Remove curly braces
    .trim()
    .slice(0, 500);
};

// Middleware function to validate restaurant ID parameter
export const validateRestaurantIdParam = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    
    if (!id || typeof id !== 'string') {
      res.status(400).json({
        code: 'BAD_REQUEST',
        message: 'Restaurant ID parameter is required',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Validate the ID format
    validateRestaurantId(id);
    
    // If validation passes, continue to the next middleware
    next();
  } catch (error) {
    res.status(400).json({
      code: 'BAD_REQUEST',
      message: `Invalid restaurant ID format: ${error instanceof Error ? error.message : 'Unknown error'}`,
      timestamp: new Date().toISOString()
    });
  }
};

export type EnhancedRestaurantSearchQuery = z.infer<typeof enhancedRestaurantSearchSchema>; 