import { ClothingItem, StylePreferences, User } from '../types';

export const mockClothingItems: ClothingItem[] = [
  {
    id: '1',
    name: 'Classic White Button Shirt',
    category: 'tops',
    style: 'classic',
    colors: ['white', 'light-blue'],
    brand: 'StyleCo',
    price: 89,
    image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=500',
    overlayImage: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['professional', 'versatile', 'cotton'],
    rating: 4.5,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: '2',
    name: 'Elegant Black Dress',
    category: 'dresses',
    style: 'formal',
    colors: ['black'],
    brand: 'Elegance',
    price: 149,
    image: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=500',
    overlayImage: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['evening', 'sophisticated', 'little-black-dress'],
    rating: 4.8,
    sizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: '3',
    name: 'Casual Denim Jacket',
    category: 'outerwear',
    style: 'casual',
    colors: ['blue', 'light-blue'],
    brand: 'DenimCo',
    price: 79,
    image: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=500',
    overlayImage: 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['versatile', 'denim', 'layering'],
    rating: 4.3,
    sizes: ['S', 'M', 'L', 'XL']
  },
  {
    id: '4',
    name: 'High-Waisted Trousers',
    category: 'bottoms',
    style: 'business',
    colors: ['black', 'navy', 'gray'],
    brand: 'ProFit',
    price: 95,
    image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=500',
    overlayImage: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['professional', 'high-waisted', 'tailored'],
    rating: 4.6,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: '5',
    name: 'Bohemian Maxi Dress',
    category: 'dresses',
    style: 'bohemian',
    colors: ['floral', 'earth-tones'],
    brand: 'FreeSpirit',
    price: 129,
    image: 'https://images.pexels.com/photos/1103834/pexels-photo-1103834.jpeg?auto=compress&cs=tinysrgb&w=500',
    overlayImage: 'https://images.pexels.com/photos/1103834/pexels-photo-1103834.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['flowy', 'vacation', 'comfortable'],
    rating: 4.4,
    sizes: ['S', 'M', 'L']
  },
  {
    id: '6',
    name: 'Minimalist Blazer',
    category: 'outerwear',
    style: 'minimalist',
    colors: ['beige', 'black', 'white'],
    brand: 'MinimalCo',
    price: 179,
    image: 'https://images.pexels.com/photos/1036804/pexels-photo-1036804.jpeg?auto=compress&cs=tinysrgb&w=500',
    overlayImage: 'https://images.pexels.com/photos/1036804/pexels-photo-1036804.jpeg?auto=compress&cs=tinysrgb&w=300',
    tags: ['structured', 'clean-lines', 'versatile'],
    rating: 4.7,
    sizes: ['XS', 'S', 'M', 'L', 'XL']
  }
];

export const mockUser: User = {
  id: '1',
  name: 'Alex Johnson',
  preferences: {
    favoriteColors: ['black', 'white', 'navy', 'beige'],
    preferredStyles: ['minimalist', 'classic', 'business'],
    bodyType: 'athletic',
    occasions: ['work', 'casual', 'date'],
    brands: ['StyleCo', 'MinimalCo'],
    priceRange: [50, 200]
  }
};