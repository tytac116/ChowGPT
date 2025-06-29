export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  joinedDate: string
  preferences?: {
    favoriteCategories: string[]
    priceRange: string
    dietaryRestrictions: string[]
  }
}

export const mockUser: User = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
  joinedDate: '2024-01-15',
  preferences: {
    favoriteCategories: ['Fine Dining', 'Seafood', 'Italian'],
    priceRange: 'R300-800',
    dietaryRestrictions: []
  }
}