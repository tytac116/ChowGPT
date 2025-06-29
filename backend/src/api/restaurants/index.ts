import { Router } from 'express';
import { supabaseService } from '../../services/supabaseClient';
import { asyncHandler, createNotFoundError } from '../../utils/errorHandler';
import { 
  enhancedRestaurantSearchSchema,
  restaurantIdSchema,
  validateSearchQuery, 
  validateRestaurantId, 
  validatePagination 
} from '../../utils/validation';
import { SearchResult } from '../../types';

const router = Router();

// Enhanced GET /restaurants - Step 2 implementation
// Supports enhanced=true parameter to use new format
router.get('/', asyncHandler(async (req, res) => {
  const enhanced = req.query.enhanced === 'true';
  
  if (enhanced) {
    // Use enhanced validation and service for Step 2
    try {
      const validatedQuery = enhancedRestaurantSearchSchema.parse({
        ...req.query,
        rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
        priceLevel: req.query.priceLevel ? 
          (Array.isArray(req.query.priceLevel) ? req.query.priceLevel : [req.query.priceLevel]) : 
          undefined,
        openNow: req.query.openNow === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      const result = await supabaseService.getRestaurantsEnhanced(
        validatedQuery.query,
        {
          category: validatedQuery.category,
          neighborhood: validatedQuery.neighborhood,
          city: validatedQuery.city,
          priceLevel: validatedQuery.priceLevel,
          rating: validatedQuery.rating,
          openNow: validatedQuery.openNow,
        },
        validatedQuery.limit,
        validatedQuery.offset,
        validatedQuery.sortBy
      );

      res.json({
        success: true,
        data: result,
        message: 'Restaurants fetched successfully (Enhanced)',
      });
    } catch (error) {
      console.error('Enhanced search validation error:', error);
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: error instanceof Error ? error.message : 'Unknown validation error'
      });
    }
  } else {
    // Use existing validation and service for backward compatibility
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    // Validate pagination
    const pagination = validatePagination({ limit, offset });
    
    // Extract filters from query parameters
    const filters = {
      category: req.query.category as string,
      city: req.query.city as string,
      neighborhood: req.query.neighborhood as string,
      priceLevel: req.query.priceLevel ? 
        (Array.isArray(req.query.priceLevel) ? req.query.priceLevel : [req.query.priceLevel]) as string[] : 
        undefined,
      rating: req.query.rating ? parseFloat(req.query.rating as string) : undefined,
    };

    // Remove undefined values
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined)
    );

    try {
      // Fetch restaurants from database
      const { restaurants, total } = await supabaseService.getRestaurants(
        query,
        cleanFilters,
        pagination.limit,
        pagination.offset
      );

      const result: SearchResult = {
        restaurants,
        total,
        hasMore: pagination.offset + restaurants.length < total,
        query: query || '',
        filters: cleanFilters,
      };

      res.json(result);
    } catch (error) {
      console.error('Error in restaurants search:', error);
      throw error;
    }
  }
}));

// GET /restaurants/:id - Get restaurant details
router.get('/:id', asyncHandler(async (req, res) => {
  const placeId = validateRestaurantId(req.params.id);
  
  try {
    // Fetch restaurant details
    const restaurant = await supabaseService.getRestaurantById(placeId);
    
    if (!restaurant) {
      throw createNotFoundError('Restaurant', placeId);
    }

    // Fetch reviews for this restaurant
    const reviewsLimit = parseInt(req.query.reviewsLimit as string) || 10;
    const reviewsOffset = parseInt(req.query.reviewsOffset as string) || 0;
    
    const { reviews, total: reviewsTotal } = await supabaseService.getReviewsForRestaurant(
      placeId,
      reviewsLimit,
      reviewsOffset
    );

    const result = {
      ...restaurant,
      reviews: {
        data: reviews,
        total: reviewsTotal,
        hasMore: reviewsOffset + reviews.length < reviewsTotal,
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    throw error;
  }
}));

// GET /restaurants/:id/reviews - Get reviews for a specific restaurant
router.get('/:id/reviews', asyncHandler(async (req, res) => {
  const placeId = validateRestaurantId(req.params.id);
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = parseInt(req.query.offset as string) || 0;
  
  const pagination = validatePagination({ limit, offset });

  try {
    // Verify restaurant exists
    const restaurant = await supabaseService.getRestaurantById(placeId);
    if (!restaurant) {
      throw createNotFoundError('Restaurant', placeId);
    }

    // Fetch reviews
    const { reviews, total } = await supabaseService.getReviewsForRestaurant(
      placeId,
      pagination.limit,
      pagination.offset
    );

    const result = {
      reviews,
      total,
      hasMore: pagination.offset + reviews.length < total,
      restaurantId: placeId,
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching restaurant reviews:', error);
    throw error;
  }
}));

// GET /restaurants/meta/categories - Get all available categories
router.get('/meta/categories', asyncHandler(async (req, res) => {
  try {
    const categories = await supabaseService.getCategories();
    
    res.json({
      categories,
      total: categories.length,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}));

// GET /restaurants/meta/neighborhoods - Get all available neighborhoods
router.get('/meta/neighborhoods', asyncHandler(async (req, res) => {
  const city = req.query.city as string;
  
  try {
    const neighborhoods = await supabaseService.getNeighborhoods(city);
    
    res.json({
      neighborhoods,
      total: neighborhoods.length,
      city: city || 'all',
    });
  } catch (error) {
    console.error('Error fetching neighborhoods:', error);
    throw error;
  }
}));

export default router; 