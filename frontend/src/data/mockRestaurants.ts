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
    id: '8',
    title: 'Café Caprice',
    categoryName: 'Casual Dining',
    categories: ['Casual Dining', 'Beach Bar', 'Mediterranean'],
    totalScore: 3.9,
    reviewsCount: 1456,
    price: 'R100-250',
    address: '37 Victoria Rd, Camps Bay',
    neighborhood: 'Camps Bay',
    reviewsTags: ['Beach Views', 'Casual Atmosphere', 'Good for Groups', 'Sunset Views'],
    imagesCount: 16,
    imageUrls: [
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg',
      'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg'
    ],
    phone: '+27 21 438 8315',
    website: 'https://cafecaprice.co.za',
    openingHours: {
      monday: '08:00 - 00:00',
      tuesday: '08:00 - 00:00',
      wednesday: '08:00 - 00:00',
      thursday: '08:00 - 00:00',
      friday: '08:00 - 02:00',
      saturday: '08:00 - 02:00',
      sunday: '08:00 - 00:00'
    },
    popularTimes: ['17:00-19:00', '20:00-22:00'],
    serviceOptions: ['Dine-in', 'Takeout', 'Outdoor Seating'],
    highlights: ['Beach Location', 'Sunset Views', 'Live DJ'],
    offerings: ['Breakfast', 'Lunch', 'Dinner', 'Cocktails'],
    accessibility: ['Limited Wheelchair Access'],
    reviews: [
      {
        id: '9',
        author: 'Mark S.',
        rating: 4,
        text: 'Perfect spot for sunset drinks with friends. Food is decent, but the location and vibe are unbeatable.',
        date: '2024-01-22',
        helpful: 8
      }
    ]
  },
  {
    id: '11',
    title: 'Quick Bite Express',
    categoryName: 'Fast Food',
    categories: ['Fast Food', 'Takeaway', 'Budget'],
    totalScore: 2.8,
    reviewsCount: 234,
    price: 'R50-120',
    address: '45 Main Rd, Observatory',
    neighborhood: 'Observatory',
    reviewsTags: ['Cheap Eats', 'Quick Service', 'Basic Food', 'Student Friendly'],
    imagesCount: 6,
    imageUrls: [
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
      'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg',
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg'
    ],
    phone: '+27 21 448 1234',
    website: undefined,
    openingHours: {
      monday: '10:00 - 22:00',
      tuesday: '10:00 - 22:00',
      wednesday: '10:00 - 22:00',
      thursday: '10:00 - 22:00',
      friday: '10:00 - 23:00',
      saturday: '10:00 - 23:00',
      sunday: '11:00 - 21:00'
    },
    popularTimes: ['12:00-13:00', '18:00-19:00'],
    serviceOptions: ['Takeout', 'Delivery', 'Dine-in'],
    highlights: ['Budget Friendly', 'Quick Service'],
    offerings: ['Burgers', 'Wraps', 'Chips'],
    accessibility: ['Ground Level Access'],
    reviews: [
      {
        id: '20',
        author: 'Student A.',
        rating: 3,
        text: 'Cheap and fills you up. Nothing fancy but does the job when you\'re on a budget.',
        date: '2024-01-20',
        helpful: 3
      }
    ]
  },
  {
    id: '12',
    title: 'Mediocre Meals',
    categoryName: 'Casual Dining',
    categories: ['Casual Dining', 'Generic'],
    totalScore: 3.2,
    reviewsCount: 567,
    price: 'R180-320',
    address: '123 Generic St, City Centre',
    neighborhood: 'City Centre',
    reviewsTags: ['Average Food', 'Okay Service', 'Nothing Special', 'Convenient Location'],
    imagesCount: 8,
    imageUrls: [
      'https://images.pexels.com/photos/2291367/pexels-photo-2291367.jpeg',
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg'
    ],
    phone: '+27 21 423 5678',
    website: undefined,
    openingHours: {
      monday: '11:00 - 21:00',
      tuesday: '11:00 - 21:00',
      wednesday: '11:00 - 21:00',
      thursday: '11:00 - 21:00',
      friday: '11:00 - 22:00',
      saturday: '11:00 - 22:00',
      sunday: '12:00 - 20:00'
    },
    popularTimes: ['12:00-14:00', '19:00-20:00'],
    serviceOptions: ['Dine-in', 'Takeout'],
    highlights: ['Central Location', 'Standard Menu'],
    offerings: ['Lunch', 'Dinner', 'Basic Options'],
    accessibility: ['Wheelchair Accessible'],
    reviews: [
      {
        id: '21',
        author: 'Regular Customer',
        rating: 3,
        text: 'It\'s okay. Food is edible, service is fine. Nothing to write home about but convenient.',
        date: '2024-01-18',
        helpful: 5
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
    id: '7',
    title: 'Nobu Cape Town',
    categoryName: 'Japanese Fine Dining',
    categories: ['Japanese', 'Fine Dining', 'Sushi'],
    totalScore: 4.6,
    reviewsCount: 654,
    price: 'R700-1400',
    address: 'One&Only Cape Town, V&A Waterfront',
    neighborhood: 'V&A Waterfront',
    reviewsTags: ['World-Class Sushi', 'Luxury Dining', 'Celebrity Chef', 'Waterfront Views'],
    imagesCount: 28,
    imageUrls: [
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
      'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg'
    ],
    phone: '+27 21 431 4511',
    website: 'https://noburestaurants.com',
    openingHours: {
      monday: '18:00 - 22:30',
      tuesday: '18:00 - 22:30',
      wednesday: '18:00 - 22:30',
      thursday: '18:00 - 22:30',
      friday: '18:00 - 23:00',
      saturday: '18:00 - 23:00',
      sunday: '18:00 - 22:30'
    },
    popularTimes: ['19:00-20:00', '20:30-21:30'],
    serviceOptions: ['Dine-in', 'Reservation Required'],
    highlights: ['Celebrity Chef', 'Luxury Setting', 'Signature Cocktails'],
    offerings: ['Dinner', 'Sushi', 'Japanese Cuisine', 'Premium Sake'],
    accessibility: ['Wheelchair Accessible', 'Valet Parking'],
    reviews: [
      {
        id: '8',
        author: 'Alexandra P.',
        rating: 5,
        text: 'Exceptional Japanese cuisine with stunning waterfront views. The black cod was perfection.',
        date: '2024-01-08',
        helpful: 31
      }
    ]
  },
  {
    id: '9',
    title: 'Greenhouse at Cellars-Hohenort',
    categoryName: 'Fine Dining',
    categories: ['Fine Dining', 'Contemporary', 'Garden Setting'],
    totalScore: 4.5,
    reviewsCount: 423,
    price: 'R650-1100',
    address: '93 Brommersvlei Rd, Constantia',
    neighborhood: 'Constantia',
    reviewsTags: ['Garden Setting', 'Innovative Cuisine', 'Romantic', 'Hotel Restaurant'],
    imagesCount: 22,
    imageUrls: [
      'https://images.pexels.com/photos/1581384/pexels-photo-1581384.jpeg',
      'https://images.pexels.com/photos/2788792/pexels-photo-2788792.jpeg',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    ],
    phone: '+27 21 795 6226',
    website: 'https://greenhouse.co.za',
    openingHours: {
      monday: 'Closed',
      tuesday: 'Closed',
      wednesday: '19:00 - 22:00',
      thursday: '19:00 - 22:00',
      friday: '19:00 - 22:00',
      saturday: '19:00 - 22:00',
      sunday: 'Closed'
    },
    popularTimes: ['19:30-20:30'],
    serviceOptions: ['Dine-in', 'Reservation Required'],
    highlights: ['Garden Views', 'Innovative Menu', 'Romantic Setting'],
    offerings: ['Dinner', 'Tasting Menu', 'Wine Pairing'],
    accessibility: ['Wheelchair Accessible'],
    reviews: [
      {
        id: '10',
        author: 'Catherine M.',
        rating: 5,
        text: 'Magical dining experience in the most beautiful garden setting. Every course was a surprise.',
        date: '2024-01-05',
        helpful: 17
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
  },
  {
    id: '10',
    title: 'Codfather Seafood & Sushi',
    categoryName: 'Seafood',
    categories: ['Seafood', 'Sushi', 'Casual Dining'],
    totalScore: 4.0,
    reviewsCount: 892,
    price: 'R200-450',
    address: 'The Wharf, Kalk Bay Harbour',
    neighborhood: 'Kalk Bay',
    reviewsTags: ['Fresh Fish', 'Harbour Views', 'Local Favorite', 'Sushi'],
    imagesCount: 14,
    imageUrls: [
      'https://images.pexels.com/photos/725992/pexels-photo-725992.jpeg',
      'https://images.pexels.com/photos/1058277/pexels-photo-1058277.jpeg',
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg'
    ],
    phone: '+27 21 788 5804',
    website: 'https://codfather.co.za',
    openingHours: {
      monday: '11:30 - 21:00',
      tuesday: '11:30 - 21:00',
      wednesday: '11:30 - 21:00',
      thursday: '11:30 - 21:00',
      friday: '11:30 - 22:00',
      saturday: '11:30 - 22:00',
      sunday: '11:30 - 21:00'
    },
    popularTimes: ['12:30-14:00', '18:00-20:00'],
    serviceOptions: ['Dine-in', 'Takeout'],
    highlights: ['Harbour Location', 'Fresh Daily Catch', 'Sushi Bar'],
    offerings: ['Lunch', 'Dinner', 'Fresh Fish', 'Sushi'],
    accessibility: ['Limited Wheelchair Access'],
    reviews: [
      {
        id: '11',
        author: 'James L.',
        rating: 4,
        text: 'Best fresh fish in Cape Town! The harbour setting adds to the authentic experience.',
        date: '2024-01-19',
        helpful: 14
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
  }
]

// Enhanced AI explanations with varied match scenarios
export const mockAIExplanations: Record<string, AIMatchExplanation> = {
  '1': {
    matchPercentage: 97,
    matchReasons: [
      'World-renowned fine dining restaurant',
      'Exceptional creative cuisine and presentation',
      'Perfect for special occasions and celebrations',
      'Outstanding wine pairing program',
      'Consistently rated among world\'s top restaurants',
      'Impeccable service standards'
    ],
    concernReasons: [
      'Very expensive - significantly above average budget',
      'Extremely difficult to get reservations'
    ],
    summary: 'This is a perfect match for exceptional fine dining experiences. The Test Kitchen offers world-class cuisine that justifies its premium pricing.'
  },
  '8': {
    matchPercentage: 42,
    matchReasons: [
      'Prime beachfront location with sunset views',
      'Lively social atmosphere',
      'Good for large groups and parties'
    ],
    concernReasons: [
      'Food quality is significantly below expectations',
      'Very touristy and overcrowded',
      'Overpriced for the quality offered',
      'Service is often slow and inattentive',
      'More of a bar than a proper restaurant',
      'Noise levels can be overwhelming'
    ],
    summary: 'Poor match for quality dining. While the location is stunning, this venue is better suited for drinks and socializing rather than a proper meal.'
  },
  '11': {
    matchPercentage: 35,
    matchReasons: [
      'Very budget-friendly pricing',
      'Quick service for fast meals',
      'Convenient location for students'
    ],
    concernReasons: [
      'Very poor food quality and limited menu',
      'Basic fast food with no dining experience',
      'Unhealthy options with poor ingredients',
      'No atmosphere or ambiance',
      'Not suitable for any special occasion',
      'Limited seating and basic facilities'
    ],
    summary: 'Very poor match for most dining needs. Only suitable if you need the cheapest possible meal option with no quality expectations.'
  },
  '12': {
    matchPercentage: 58,
    matchReasons: [
      'Central location and convenient access',
      'Standard menu with familiar options',
      'Reasonable pricing for the area'
    ],
    concernReasons: [
      'Food quality is mediocre at best',
      'Service lacks attention and care',
      'No unique features or specialties',
      'Atmosphere is bland and uninspiring',
      'Better options available nearby'
    ],
    summary: 'Fair match if you need convenience over quality. This restaurant serves its purpose but offers nothing memorable or special.'
  },
  '4': {
    matchPercentage: 94,
    matchReasons: [
      'Stunning wine estate setting with mountain views',
      'Exceptional fine dining cuisine',
      'Perfect romantic atmosphere',
      'Outstanding wine selection and pairings',
      'Award-winning chef and innovative menu',
      'Beautiful outdoor terrace dining'
    ],
    concernReasons: [
      'Higher price point for fine dining',
      'Remote location requires travel time'
    ],
    summary: 'Excellent match for fine dining with spectacular views. La Colombe offers an unforgettable experience that justifies the premium pricing and travel.'
  },
  '3': {
    matchPercentage: 85,
    matchReasons: [
      'Excellent fresh seafood quality',
      'Family-friendly environment',
      'Great value for money',
      'Convenient waterfront location',
      'Consistent quality and service',
      'Good portion sizes'
    ],
    concernReasons: [
      'Can be crowded with tourists',
      'Chain restaurant lacks unique character'
    ],
    summary: 'Excellent choice for families seeking quality seafood. Ocean Basket delivers reliable, fresh seafood in a convenient location with good value.'
  },
  '7': {
    matchPercentage: 92,
    matchReasons: [
      'World-renowned celebrity chef restaurant',
      'Exceptional Japanese cuisine and sushi',
      'Luxury waterfront setting',
      'Innovative menu and presentation',
      'Impeccable service standards',
      'Unique dining experience'
    ],
    concernReasons: [
      'Very expensive luxury dining',
      'Reservations extremely difficult to secure'
    ],
    summary: 'Excellent choice for luxury Japanese dining. Nobu offers world-class cuisine and service that justifies the premium experience and pricing.'
  },
  '9': {
    matchPercentage: 89,
    matchReasons: [
      'Beautiful garden setting',
      'Innovative contemporary cuisine',
      'Romantic and peaceful atmosphere',
      'Excellent wine selection',
      'Creative seasonal menu',
      'Away from tourist crowds'
    ],
    concernReasons: [
      'Limited operating days',
      'Higher price point for fine dining'
    ],
    summary: 'Excellent choice for romantic fine dining. Greenhouse offers a unique garden setting with innovative cuisine, perfect for special occasions.'
  },
  '6': {
    matchPercentage: 81,
    matchReasons: [
      'Spectacular ocean views at Cape Point',
      'Fresh seafood specialties',
      'Iconic tourist destination',
      'Unique location where oceans meet',
      'Good food quality',
      'Great photo opportunities'
    ],
    concernReasons: [
      'Requires full day trip to reach',
      'Can be very crowded with tour groups',
      'Weather dependent for best experience'
    ],
    summary: 'Very good choice if you have time for the Cape Point journey. The spectacular location and views make it worth the trip for the experience.'
  },
  '10': {
    matchPercentage: 76,
    matchReasons: [
      'Authentic harbour location',
      'Fresh daily catch',
      'Local favorite with character',
      'Good value for fresh seafood',
      'Unique Kalk Bay atmosphere',
      'Excellent sushi options'
    ],
    concernReasons: [
      'Limited seating and often crowded',
      'Basic facilities and decor',
      'Can run out of popular fish varieties'
    ],
    summary: 'Very good choice for authentic fresh seafood. The harbour location and daily fresh catch make up for the basic setting.'
  },
  '2': {
    matchPercentage: 73,
    matchReasons: [
      'Beautiful Victorian house setting',
      'Great atmosphere and character',
      'Excellent brunch options',
      'Good cocktail selection',
      'Historic charm and garden seating',
      'Flexible dining hours'
    ],
    concernReasons: [
      'Can get quite busy and noisy',
      'Service can be inconsistent during peak times',
      'Food quality varies'
    ],
    summary: 'Good match for casual dining with great atmosphere. Perfect for brunch or evening drinks, though expect crowds during popular times.'
  },
  '5': {
    matchPercentage: 68,
    matchReasons: [
      'Authentic African cultural experience',
      'Live traditional music and entertainment',
      'Unique local cuisine',
      'Vibrant and energetic atmosphere',
      'Good for groups and celebrations'
    ],
    concernReasons: [
      'Very touristy atmosphere',
      'Can be extremely loud due to live music',
      'Food quality can be inconsistent',
      'Service may be slow during busy periods'
    ],
    summary: 'Good for experiencing authentic African culture and cuisine, though the atmosphere is quite touristy and can be overwhelming for some.'
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
  'Vegetarian-friendly options',
  'Japanese sushi restaurants',
  'Casual beach bars and cafes',
  'Garden restaurants with views',
  'Fresh fish at the harbour'
]