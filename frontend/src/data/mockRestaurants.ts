import { Restaurant, AIMatchExplanation } from '../types/restaurant'

export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    title: 'The Test Kitchen',
    categoryName: 'Fine Dining',
    categories: ['Fine Dining', 'Contemporary', 'Tasting Menu'],
    totalScore: 4.8,
    reviewsCount: 1247,
    price: 'R800-1500',
    address: 'The Old Biscuit Mill, 373-375 Albert Rd, Woodstock',
    neighborhood: 'Woodstock',
    reviewsTags: ['Exceptional Service', 'Creative Cuisine', 'Wine Pairing', 'Special Occasion'],
    imagesCount: 24,
    imageUrls: [
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg',
      'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
    ],
    phone: '+27 21 447 2337',
    website: 'https://thetestkitchen.co.za',
    openingHours: {
      monday: 'Closed',
      tuesday: '19:00 - 22:00',
      wednesday: '19:00 - 22:00',
      thursday: '19:00 - 22:00',
      friday: '19:00 - 22:00',
      saturday: '19:00 - 22:00',
      sunday: 'Closed'
    },
    popularTimes: ['19:00-20:00', '20:00-21:00'],
    serviceOptions: ['Dine-in', 'Reservation Required'],
    highlights: ['Wine Bar', 'Chef\'s Table', 'Tasting Menu'],
    offerings: ['Vegetarian Options', 'Wine List', 'Cocktails'],
    accessibility: ['Wheelchair Accessible', 'Disabled Parking'],
    reviews: [
      {
        id: '1',
        author: 'Sarah M.',
        rating: 5,
        text: 'Absolutely extraordinary dining experience. Every dish was a work of art and the service was impeccable.',
        date: '2024-01-15',
        helpful: 23
      },
      {
        id: '2',
        author: 'Michael R.',
        rating: 5,
        text: 'Worth every penny. The tasting menu was innovative and perfectly executed.',
        date: '2024-01-10',
        helpful: 18
      }
    ]
  },
  {
    id: '2',
    title: 'Kloof Street House',
    categoryName: 'Contemporary',
    categories: ['Contemporary', 'Brunch', 'Cocktail Bar'],
    totalScore: 4.3,
    reviewsCount: 892,
    price: 'R150-400',
    address: '30 Kloof St, Gardens',
    neighborhood: 'Gardens',
    reviewsTags: ['Great Atmosphere', 'Brunch Spot', 'Cocktails', 'Victorian House'],
    imagesCount: 18,
    imageUrls: [
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
      'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    ],
    phone: '+27 21 423 4413',
    website: 'https://kloofstreethouse.co.za',
    openingHours: {
      monday: '08:00 - 23:00',
      tuesday: '08:00 - 23:00',
      wednesday: '08:00 - 23:00',
      thursday: '08:00 - 23:00',
      friday: '08:00 - 00:00',
      saturday: '08:00 - 00:00',
      sunday: '08:00 - 22:00'
    },
    popularTimes: ['09:00-11:00', '18:00-20:00'],
    serviceOptions: ['Dine-in', 'Takeout', 'Outdoor Seating'],
    highlights: ['Historic Building', 'Garden Seating', 'Live Music'],
    offerings: ['Brunch', 'Dinner', 'Cocktails', 'Wine'],
    accessibility: ['Some Wheelchair Access'],
    reviews: [
      {
        id: '3',
        author: 'Emma L.',
        rating: 4,
        text: 'Beautiful Victorian house with lovely garden seating. Food was good, atmosphere was perfect.',
        date: '2024-01-20',
        helpful: 15
      }
    ]
  },
  {
    id: '3',
    title: 'Ocean Basket V&A Waterfront',
    categoryName: 'Seafood',
    categories: ['Seafood', 'Casual Dining', 'Family Friendly'],
    totalScore: 4.1,
    reviewsCount: 2156,
    price: 'R120-300',
    address: 'Shop 6140, V&A Waterfront',
    neighborhood: 'V&A Waterfront',
    reviewsTags: ['Fresh Seafood', 'Family Friendly', 'Good Value', 'Waterfront Views'],
    imagesCount: 12,
    imageUrls: [
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg',
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg'
    ],
    phone: '+27 21 419 2700',
    website: 'https://oceanbasket.com',
    openingHours: {
      monday: '11:00 - 22:00',
      tuesday: '11:00 - 22:00',
      wednesday: '11:00 - 22:00',
      thursday: '11:00 - 22:00',
      friday: '11:00 - 23:00',
      saturday: '11:00 - 23:00',
      sunday: '11:00 - 22:00'
    },
    popularTimes: ['12:00-14:00', '19:00-21:00'],
    serviceOptions: ['Dine-in', 'Takeout', 'Delivery'],
    highlights: ['Fresh Seafood', 'Family Friendly', 'Waterfront Location'],
    offerings: ['Lunch', 'Dinner', 'Kids Menu', 'Halaal Options'],
    accessibility: ['Wheelchair Accessible', 'Family Bathrooms'],
    reviews: [
      {
        id: '4',
        author: 'David K.',
        rating: 4,
        text: 'Great spot for fresh seafood with the family. Good portions and reasonable prices.',
        date: '2024-01-18',
        helpful: 12
      }
    ]
  },
  {
    id: '4',
    title: 'La Colombe',
    categoryName: 'Fine Dining',
    categories: ['Fine Dining', 'Wine Estate', 'Contemporary'],
    totalScore: 4.7,
    reviewsCount: 743,
    price: 'R600-1200',
    address: 'Silvermist Wine Estate, Constantia',
    neighborhood: 'Constantia',
    reviewsTags: ['Wine Estate', 'Mountain Views', 'Fine Dining', 'Special Occasion'],
    imagesCount: 32,
    imageUrls: [
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg',
      'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    ],
    phone: '+27 21 794 2390',
    website: 'https://lacolombe.co.za',
    openingHours: {
      monday: 'Closed',
      tuesday: 'Closed',
      wednesday: '12:00 - 15:00, 18:30 - 22:00',
      thursday: '12:00 - 15:00, 18:30 - 22:00',
      friday: '12:00 - 15:00, 18:30 - 22:00',
      saturday: '12:00 - 15:00, 18:30 - 22:00',
      sunday: '12:00 - 15:00'
    },
    popularTimes: ['13:00-14:00', '19:30-20:30'],
    serviceOptions: ['Dine-in', 'Reservation Required', 'Outdoor Seating'],
    highlights: ['Wine Estate Setting', 'Mountain Views', 'Award-Winning Chef'],
    offerings: ['Lunch', 'Dinner', 'Wine Tasting', 'Tasting Menu'],
    accessibility: ['Wheelchair Accessible', 'Disabled Parking'],
    reviews: [
      {
        id: '5',
        author: 'Jennifer W.',
        rating: 5,
        text: 'Stunning location with incredible food. The wine pairing was exceptional.',
        date: '2024-01-12',
        helpful: 28
      }
    ]
  },
  {
    id: '5',
    title: 'Mama Africa',
    categoryName: 'African Cuisine',
    categories: ['African Cuisine', 'Traditional', 'Live Music'],
    totalScore: 4.2,
    reviewsCount: 1834,
    price: 'R180-450',
    address: '178 Long St, City Centre',
    neighborhood: 'City Centre',
    reviewsTags: ['African Cuisine', 'Live Music', 'Cultural Experience', 'Touristy'],
    imagesCount: 15,
    imageUrls: [
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
      'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg',
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg'
    ],
    phone: '+27 21 424 8634',
    website: 'https://mama-africa.co.za',
    openingHours: {
      monday: '18:00 - 23:00',
      tuesday: '18:00 - 23:00',
      wednesday: '18:00 - 23:00',
      thursday: '18:00 - 23:00',
      friday: '18:00 - 00:00',
      saturday: '18:00 - 00:00',
      sunday: '18:00 - 23:00'
    },
    popularTimes: ['19:00-21:00', '21:00-22:00'],
    serviceOptions: ['Dine-in', 'Live Entertainment'],
    highlights: ['Live African Music', 'Traditional Decor', 'Cultural Experience'],
    offerings: ['Dinner', 'Traditional African Dishes', 'Vegetarian Options'],
    accessibility: ['Limited Wheelchair Access'],
    reviews: [
      {
        id: '6',
        author: 'Robert T.',
        rating: 4,
        text: 'Authentic African dining experience with fantastic live music. Great for tourists!',
        date: '2024-01-16',
        helpful: 19
      }
    ]
  },
  {
    id: '6',
    title: 'Two Oceans Restaurant',
    categoryName: 'Seafood',
    categories: ['Seafood', 'Fine Dining', 'Ocean Views'],
    totalScore: 4.4,
    reviewsCount: 967,
    price: 'R300-600',
    address: 'Cape Point, Cape of Good Hope',
    neighborhood: 'Cape Point',
    reviewsTags: ['Ocean Views', 'Fresh Seafood', 'Scenic Location', 'Tourist Destination'],
    imagesCount: 20,
    imageUrls: [
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg'
    ],
    phone: '+27 21 780 9200',
    website: 'https://two-oceans.co.za',
    openingHours: {
      monday: '09:00 - 17:00',
      tuesday: '09:00 - 17:00',
      wednesday: '09:00 - 17:00',
      thursday: '09:00 - 17:00',
      friday: '09:00 - 17:00',
      saturday: '09:00 - 17:00',
      sunday: '09:00 - 17:00'
    },
    popularTimes: ['12:00-14:00', '14:00-15:00'],
    serviceOptions: ['Dine-in', 'Outdoor Seating'],
    highlights: ['Ocean Views', 'Cape Point Location', 'Fresh Seafood'],
    offerings: ['Lunch', 'Seafood', 'South African Cuisine'],
    accessibility: ['Wheelchair Accessible', 'Disabled Parking'],
    reviews: [
      {
        id: '7',
        author: 'Lisa H.',
        rating: 4,
        text: 'Amazing views where two oceans meet! Food was good, but the location is the real star.',
        date: '2024-01-14',
        helpful: 22
      }
    ]
  }
]

export const mockAIExplanations: Record<string, AIMatchExplanation> = {
  '1': {
    matchPercentage: 95,
    matchReasons: [
      'Exceptional fine dining experience as requested',
      'Award-winning restaurant with creative cuisine',
      'Perfect for special occasions',
      'Excellent wine pairing options'
    ],
    concernReasons: [
      'Higher price point than specified budget',
      'Requires advance reservations'
    ],
    summary: 'This restaurant perfectly matches your desire for an exceptional dining experience, though it may exceed your budget expectations.'
  },
  '2': {
    matchPercentage: 88,
    matchReasons: [
      'Great atmosphere in historic Victorian house',
      'Excellent brunch options',
      'Good cocktail selection',
      'Beautiful garden setting'
    ],
    concernReasons: [
      'Can get quite busy during peak hours',
      'Noise levels may be high on weekends'
    ],
    summary: 'Excellent match for casual dining with great atmosphere, perfect for brunch or evening drinks.'
  },
  '3': {
    matchPercentage: 82,
    matchReasons: [
      'Family-friendly environment',
      'Fresh seafood options',
      'Good value for money',
      'Convenient waterfront location'
    ],
    concernReasons: [
      'Can be crowded with tourists',
      'Limited fine dining ambiance'
    ],
    summary: 'Great choice for families seeking quality seafood in a convenient location with good value.'
  },
  '4': {
    matchPercentage: 92,
    matchReasons: [
      'Stunning wine estate setting',
      'Exceptional mountain views',
      'Award-winning fine dining',
      'Perfect for special occasions'
    ],
    concernReasons: [
      'Remote location requires travel time',
      'Higher price point'
    ],
    summary: 'Outstanding choice for fine dining with spectacular views, ideal for romantic occasions despite the premium pricing.'
  },
  '5': {
    matchPercentage: 78,
    matchReasons: [
      'Authentic African cultural experience',
      'Live traditional music',
      'Unique local cuisine',
      'Great for tourists'
    ],
    concernReasons: [
      'Very touristy atmosphere',
      'Can be loud due to live music'
    ],
    summary: 'Perfect for experiencing authentic African culture and cuisine, though the atmosphere is quite touristy.'
  },
  '6': {
    matchPercentage: 85,
    matchReasons: [
      'Spectacular ocean views',
      'Fresh seafood specialties',
      'Unique Cape Point location',
      'Iconic tourist destination'
    ],
    concernReasons: [
      'Requires full day trip',
      'Weather dependent for best experience'
    ],
    summary: 'Exceptional location with stunning views and fresh seafood, perfect if you have time for the Cape Point journey.'
  }
}

export const searchSuggestions = [
  'Beachfront dining with ocean views',
  'Romantic spots for date night',
  'Open late for dinner after 9pm',
  'Affordable meals under R300',
  'Family-friendly restaurants',
  'Best seafood in Cape Town',
  'Fine dining for special occasions',
  'Traditional African cuisine',
  'Wine estates with food',
  'Vegetarian-friendly options'
]