export interface User {
  id: string;
  name: string;
  photo?: string;
  preferences: StylePreferences;
}

export interface StylePreferences {
  favoriteColors: string[];
  preferredStyles: ClothingStyle[];
  bodyType: BodyType;
  occasions: Occasion[];
  brands: string[];
  priceRange: [number, number];
}

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  style: ClothingStyle;
  colors: string[];
  brand: string;
  price: number;
  image: string;
  overlayImage: string; // For virtual try-on
  tags: string[];
  rating: number;
  sizes: Size[];
}

export interface LightingSettings {
  brightness: number;
  contrast: number;
  warmth: number;
  scenario: LightingScenario;
  intensity: number;
}

export type ClothingCategory = 'tops' | 'bottoms' | 'dresses' | 'outerwear' | 'shoes' | 'accessories';
export type ClothingStyle = 'casual' | 'formal' | 'business' | 'trendy' | 'classic' | 'bohemian' | 'minimalist';
export type BodyType = 'petite' | 'tall' | 'curvy' | 'athletic' | 'plus-size';
export type Occasion = 'work' | 'casual' | 'party' | 'date' | 'vacation' | 'formal-event';
export type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type LightingScenario = 'natural' | 'indoor' | 'evening' | 'bright' | 'warm' | 'cool';

export interface TryOnSession {
  userPhoto: string;
  selectedItems: ClothingItem[];
  lightingSettings: LightingSettings;
  timestamp: Date;
}

// AI-related types
export interface AIAnalysisResult {
  bodyMeasurements: {
    shoulders: number;
    chest: number;
    waist: number;
    hips: number;
    height: number;
  };
  skinTone: 'warm' | 'cool' | 'neutral';
  bodyShape: 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle';
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
  confidence: number;
}

export interface StyleRecommendation {
  item: ClothingItem;
  score: number;
  reasons: string[];
  styling_tips: string[];
  occasion_match: number;
  color_harmony: number;
  fit_prediction: number;
}

export interface VirtualTryOnResult {
  processedImageUrl: string;
  fitAnalysis: {
    overall_fit: 'excellent' | 'good' | 'fair' | 'poor';
    size_recommendation: string;
    adjustments_needed: string[];
    confidence: number;
  };
  processingTime: number;
}

// AI-related types
export interface AIAnalysisResult {
  bodyMeasurements: {
    shoulders: number;
    chest: number;
    waist: number;
    hips: number;
    height: number;
  };
  skinTone: 'warm' | 'cool' | 'neutral';
  bodyShape: 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle';
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
  confidence: number;
}

export interface StyleRecommendation {
  item: ClothingItem;
  score: number;
  reasons: string[];
  styling_tips: string[];
  occasion_match: number;
  color_harmony: number;
  fit_prediction: number;
}

export interface VirtualTryOnResult {
  processedImageUrl: string;
  fitAnalysis: {
    overall_fit: 'excellent' | 'good' | 'fair' | 'poor';
    size_recommendation: string;
    adjustments_needed: string[];
    confidence: number;
  };
  processingTime: number;
}