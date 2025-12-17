import { ClothingItem, StylePreferences, LightingSettings } from '../types';
import { realAIService, ComprehensiveAIAnalysis } from './realAI';

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

class AIService {
  private useRealAI: boolean;

  constructor() {
    this.useRealAI = import.meta.env.VITE_USE_REAL_AI === 'true';
    
    if (this.useRealAI) {
      realAIService.initialize().catch(error => {
        console.warn('Real AI initialization failed, falling back to mock:', error);
        this.useRealAI = false;
      });
    }
  }

  // Analyze user photo for body measurements and characteristics
  async analyzeUserPhoto(imageData: string): Promise<AIAnalysisResult> {
    if (this.useRealAI) {
      try {
        const analysis = await realAIService.performCompleteAnalysis(imageData);
        return this.convertToAIAnalysisResult(analysis);
      } catch (error) {
        console.warn('Real AI analysis failed, using fallback:', error);
        // Fall through to mock implementation
      }
    }

    try {
      // Simulate AI processing with realistic delay
      await this.simulateProcessing(2000);

      // In production, this would call actual AI service
      const mockAnalysis: AIAnalysisResult = {
        bodyMeasurements: {
          shoulders: 42,
          chest: 36,
          waist: 30,
          hips: 38,
          height: 168
        },
        skinTone: this.detectSkinTone(imageData),
        bodyShape: this.detectBodyShape(),
        faceShape: this.detectFaceShape(),
        confidence: 0.92
      };

      return mockAnalysis;
    } catch (error) {
      console.error('AI Analysis failed:', error);
      throw new Error('Failed to analyze photo. Please try again.');
    }
  }

  // Generate personalized style recommendations
  async generateRecommendations(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<StyleRecommendation[]> {
    if (this.useRealAI) {
      try {
        const comprehensiveAnalysis = this.convertToComprehensiveAnalysis(userAnalysis);
        return await realAIService.getPersonalizedRecommendations(
          comprehensiveAnalysis,
          preferences,
          availableItems,
          occasion
        );
      } catch (error) {
        console.warn('Real AI recommendations failed, using fallback:', error);
        // Fall through to mock implementation
      }
    }

    try {
      await this.simulateProcessing(1500);

      const recommendations = availableItems.map(item => {
        const score = this.calculateRecommendationScore(item, userAnalysis, preferences, occasion);
        const reasons = this.generateReasons(item, userAnalysis, preferences);
        const stylingTips = this.generateStylingTips(item, userAnalysis);

        return {
          item,
          score,
          reasons,
          styling_tips: stylingTips,
          occasion_match: this.calculateOccasionMatch(item, occasion),
          color_harmony: this.calculateColorHarmony(item, userAnalysis.skinTone),
          fit_prediction: this.predictFit(item, userAnalysis.bodyMeasurements)
        };
      });

      // Sort by score and return top recommendations
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      throw new Error('Failed to generate recommendations. Please try again.');
    }
  }

  // Process virtual try-on with AI
  async processVirtualTryOn(
    userPhoto: string,
    clothingItems: ClothingItem[],
    lightingSettings: LightingSettings,
    userAnalysis?: AIAnalysisResult
  ): Promise<VirtualTryOnResult> {
    if (this.useRealAI) {
      try {
        const comprehensiveAnalysis = userAnalysis ? this.convertToComprehensiveAnalysis(userAnalysis) : undefined;
        return await realAIService.createVirtualTryOn(
          userPhoto,
          clothingItems,
          lightingSettings,
          comprehensiveAnalysis
        );
      } catch (error) {
        console.warn('Real AI virtual try-on failed, using fallback:', error);
        // Fall through to mock implementation
      }
    }

    try {
      const startTime = Date.now();
      await this.simulateProcessing(3000);

      // Simulate AI processing result
      const result: VirtualTryOnResult = {
        processedImageUrl: this.generateProcessedImageUrl(userPhoto, clothingItems),
        fitAnalysis: {
          overall_fit: this.predictOverallFit(clothingItems, userAnalysis),
          size_recommendation: this.recommendSize(clothingItems, userAnalysis),
          adjustments_needed: this.suggestAdjustments(clothingItems, userAnalysis),
          confidence: 0.88
        },
        processingTime: Date.now() - startTime
      };

      return result;
    } catch (error) {
      console.error('Virtual try-on processing failed:', error);
      throw new Error('Failed to process virtual try-on. Please try again.');
    }
  }

  async generateOutfitCombinations(
    items: ClothingItem[],
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    occasion?: string
  ): Promise<ClothingItem[][]> {
    if (this.useRealAI) {
      try {
        const comprehensiveAnalysis = this.convertToComprehensiveAnalysis(userAnalysis);
        return await realAIService.generateOutfits(items, comprehensiveAnalysis, preferences, occasion);
      } catch (error) {
        console.warn('Real AI outfit generation failed, using fallback:', error);
      }
    }

    try {
      await this.simulateProcessing(1000);

      const outfits: ClothingItem[][] = [];
      const tops = items.filter(item => item.category === 'tops');
      const bottoms = items.filter(item => item.category === 'bottoms');
      const dresses = items.filter(item => item.category === 'dresses');
      const outerwear = items.filter(item => item.category === 'outerwear');

      // Generate dress-based outfits
      dresses.forEach(dress => {
        const outfit = [dress];
        const compatibleOuterwear = this.findCompatibleItems(dress, outerwear, userAnalysis);
        if (compatibleOuterwear.length > 0) {
          outfit.push(compatibleOuterwear[0]);
        }
        outfits.push(outfit);
      });

      // Generate top + bottom combinations
      tops.forEach(top => {
        bottoms.forEach(bottom => {
          if (this.areItemsCompatible(top, bottom, userAnalysis)) {
            const outfit = [top, bottom];
            const compatibleOuterwear = this.findCompatibleItems(top, outerwear, userAnalysis);
            if (compatibleOuterwear.length > 0) {
              outfit.push(compatibleOuterwear[0]);
            }
            outfits.push(outfit);
          }
        });
      });

      // Score and sort outfits
      const scoredOutfits = outfits.map(outfit => ({
        outfit,
        score: this.scoreOutfit(outfit, userAnalysis, preferences, occasion)
      }));

      return scoredOutfits
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
        .map(item => item.outfit);
    } catch (error) {
      console.error('Outfit generation failed:', error);
      throw new Error('Failed to generate outfit combinations.');
    }
  }

  // Smart color matching
  async suggestColorCombinations(
    baseItem: ClothingItem,
    userAnalysis: AIAnalysisResult
  ): Promise<{ color: string; harmony: string; confidence: number }[]> {
    const colorSuggestions = [];
    const baseColors = baseItem.colors;

    for (const baseColor of baseColors) {
      // Complementary colors
      const complementary = this.getComplementaryColor(baseColor);
      colorSuggestions.push({
        color: complementary,
        harmony: 'complementary',
        confidence: 0.85
      });

      // Analogous colors
      const analogous = this.getAnalogousColors(baseColor);
      analogous.forEach(color => {
        colorSuggestions.push({
          color,
          harmony: 'analogous',
          confidence: 0.78
        });
      });

      // Skin tone compatibility
      if (this.isColorCompatibleWithSkinTone(baseColor, userAnalysis.skinTone)) {
        colorSuggestions.push({
          color: baseColor,
          harmony: 'skin-tone-match',
          confidence: 0.92
        });
      }
    }

    return colorSuggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  // Conversion methods between AI result formats
  private convertToAIAnalysisResult(analysis: ComprehensiveAIAnalysis): AIAnalysisResult {
    return {
      bodyMeasurements: analysis.bodyAnalysis.measurements,
      skinTone: analysis.faceAnalysis.skinTone,
      bodyShape: analysis.bodyAnalysis.bodyShape as any,
      faceShape: analysis.faceAnalysis.faceShape,
      confidence: (analysis.bodyAnalysis.confidence + analysis.faceAnalysis.confidence) / 2
    };
  }

  private convertToComprehensiveAnalysis(analysis: AIAnalysisResult): ComprehensiveAIAnalysis {
    return {
      bodyAnalysis: {
        keypoints: this.generateMockKeypoints(),
        measurements: analysis.bodyMeasurements,
        bodyShape: analysis.bodyShape,
        confidence: analysis.confidence
      },
      faceAnalysis: {
        skinTone: analysis.skinTone,
        faceShape: analysis.faceShape,
        skinColor: { r: 200, g: 180, b: 160, hex: '#c8b4a0' },
        confidence: analysis.confidence
      },
      imageQuality: {
        sharpness: 80,
        brightness: 75,
        contrast: 70,
        noise: 15,
        overall: 75
      },
      processingTime: 1000
    };
  }

  private generateMockKeypoints(): any {
    // Generate mock keypoints for fallback
    return {
      nose: { x: 0.5, y: 0.2, visibility: 0.9 },
      leftShoulder: { x: 0.4, y: 0.35, visibility: 0.9 },
      rightShoulder: { x: 0.6, y: 0.35, visibility: 0.9 },
      leftHip: { x: 0.45, y: 0.6, visibility: 0.9 },
      rightHip: { x: 0.55, y: 0.6, visibility: 0.9 },
      leftElbow: { x: 0.35, y: 0.45, visibility: 0.8 },
      rightElbow: { x: 0.65, y: 0.45, visibility: 0.8 },
      leftWrist: { x: 0.3, y: 0.55, visibility: 0.8 },
      rightWrist: { x: 0.7, y: 0.55, visibility: 0.8 },
      leftKnee: { x: 0.45, y: 0.75, visibility: 0.8 },
      rightKnee: { x: 0.55, y: 0.75, visibility: 0.8 },
      leftAnkle: { x: 0.45, y: 0.9, visibility: 0.8 },
      rightAnkle: { x: 0.55, y: 0.9, visibility: 0.8 }
    };
  }

  // Health check for AI services
  async checkServiceHealth(): Promise<{
    realAI: boolean;
    fallback: boolean;
    overall: boolean;
  }> {
    let realAIHealth = false;
    
    if (this.useRealAI) {
      try {
        const health = await realAIService.getServiceHealth();
        realAIHealth = health.overall;
      } catch (error) {
        console.error('Real AI health check failed:', error);
      }
    }

    return {
      realAI: realAIHealth,
      fallback: true, // Mock implementation always available
      overall: realAIHealth || true // At least fallback is available
    };
  }

  // Private helper methods
  private async simulateProcessing(delay: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private detectSkinTone(imageData: string): 'warm' | 'cool' | 'neutral' {
    // Simulate skin tone detection
    const tones = ['warm', 'cool', 'neutral'] as const;
    return tones[Math.floor(Math.random() * tones.length)];
  }

  private detectBodyShape(): 'pear' | 'apple' | 'hourglass' | 'rectangle' | 'inverted-triangle' {
    const shapes = ['pear', 'apple', 'hourglass', 'rectangle', 'inverted-triangle'] as const;
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  private detectFaceShape(): 'oval' | 'round' | 'square' | 'heart' | 'diamond' {
    const shapes = ['oval', 'round', 'square', 'heart', 'diamond'] as const;
    return shapes[Math.floor(Math.random() * shapes.length)];
  }

  private calculateRecommendationScore(
    item: ClothingItem,
    analysis: AIAnalysisResult,
    preferences: StylePreferences,
    occasion?: string
  ): number {
    let score = 0;

    // Style preference match
    if (preferences.preferredStyles.includes(item.style)) score += 30;

    // Color preference match
    const colorMatch = item.colors.some(color => 
      preferences.favoriteColors.some(prefColor => 
        color.toLowerCase().includes(prefColor.toLowerCase())
      )
    );
    if (colorMatch) score += 25;

    // Price range match
    if (item.price >= preferences.priceRange[0] && item.price <= preferences.priceRange[1]) {
      score += 20;
    }

    // Body shape compatibility
    score += this.calculateBodyShapeCompatibility(item, analysis.bodyShape);

    // Skin tone compatibility
    score += this.calculateSkinToneCompatibility(item, analysis.skinTone);

    // Occasion match
    if (occasion) {
      score += this.calculateOccasionMatch(item, occasion);
    }

    return Math.min(score, 100);
  }

  private calculateBodyShapeCompatibility(item: ClothingItem, bodyShape: string): number {
    const compatibilityMap: Record<string, Record<string, number>> = {
      'pear': {
        'tops': 15,
        'dresses': 10,
        'outerwear': 12
      },
      'apple': {
        'dresses': 15,
        'tops': 12,
        'outerwear': 10
      },
      'hourglass': {
        'dresses': 15,
        'tops': 12,
        'bottoms': 10
      }
    };

    return compatibilityMap[bodyShape]?.[item.category] || 5;
  }

  private calculateSkinToneCompatibility(item: ClothingItem, skinTone: string): number {
    const warmColors = ['red', 'orange', 'yellow', 'brown', 'gold'];
    const coolColors = ['blue', 'green', 'purple', 'silver', 'gray'];
    
    const hasWarmColors = item.colors.some(color => 
      warmColors.some(warm => color.toLowerCase().includes(warm))
    );
    const hasCoolColors = item.colors.some(color => 
      coolColors.some(cool => color.toLowerCase().includes(cool))
    );

    if (skinTone === 'warm' && hasWarmColors) return 10;
    if (skinTone === 'cool' && hasCoolColors) return 10;
    if (skinTone === 'neutral') return 8;
    
    return 3;
  }

  private calculateOccasionMatch(item: ClothingItem, occasion?: string): number {
    if (!occasion) return 0;

    const occasionMap: Record<string, string[]> = {
      'work': ['business', 'formal', 'classic'],
      'casual': ['casual', 'trendy'],
      'party': ['formal', 'trendy'],
      'date': ['formal', 'trendy', 'classic']
    };

    const suitableStyles = occasionMap[occasion] || [];
    return suitableStyles.includes(item.style) ? 15 : 0;
  }

  private calculateColorHarmony(item: ClothingItem, skinTone: string): number {
    return Math.random() * 100; // Simplified for demo
  }

  private predictFit(item: ClothingItem, measurements: any): number {
    return Math.random() * 100; // Simplified for demo
  }

  private generateReasons(item: ClothingItem, analysis: AIAnalysisResult, preferences: StylePreferences): string[] {
    const reasons = [];

    if (preferences.preferredStyles.includes(item.style)) {
      reasons.push(`Matches your ${item.style} style preference`);
    }

    if (item.colors.some(color => preferences.favoriteColors.includes(color))) {
      reasons.push('Features your favorite colors');
    }

    if (analysis.bodyShape === 'hourglass' && item.category === 'dresses') {
      reasons.push('Perfect for your hourglass figure');
    }

    if (item.rating >= 4.5) {
      reasons.push('Highly rated by other customers');
    }

    return reasons.slice(0, 3);
  }

  private generateStylingTips(item: ClothingItem, analysis: AIAnalysisResult): string[] {
    const tips = [];

    if (item.category === 'tops') {
      tips.push('Pair with high-waisted bottoms to elongate your silhouette');
    }

    if (item.category === 'dresses') {
      tips.push('Add a belt to accentuate your waist');
    }

    if (analysis.skinTone === 'warm') {
      tips.push('This color will complement your warm undertones beautifully');
    }

    return tips.slice(0, 2);
  }

  private predictOverallFit(items: ClothingItem[], analysis?: AIAnalysisResult): 'excellent' | 'good' | 'fair' | 'poor' {
    const fits = ['excellent', 'good', 'fair', 'poor'] as const;
    return fits[Math.floor(Math.random() * fits.length)];
  }

  private recommendSize(items: ClothingItem[], analysis?: AIAnalysisResult): string {
    const sizes = ['XS', 'S', 'M', 'L', 'XL'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  private suggestAdjustments(items: ClothingItem[], analysis?: AIAnalysisResult): string[] {
    const adjustments = [
      'Consider sizing up for a more comfortable fit',
      'This item runs small, size up',
      'Perfect fit as shown',
      'Consider tailoring the sleeves',
      'May need hemming for optimal length'
    ];
    return [adjustments[Math.floor(Math.random() * adjustments.length)]];
  }

  private generateProcessedImageUrl(userPhoto: string, items: ClothingItem[]): string {
    // In production, this would return the actual processed image URL
    return `${userPhoto}?processed=${Date.now()}`;
  }

  private findCompatibleItems(baseItem: ClothingItem, items: ClothingItem[], analysis: AIAnalysisResult): ClothingItem[] {
    return items.filter(item => this.areItemsCompatible(baseItem, item, analysis));
  }

  private areItemsCompatible(item1: ClothingItem, item2: ClothingItem, analysis: AIAnalysisResult): boolean {
    // Simplified compatibility check
    return item1.style === item2.style || Math.random() > 0.5;
  }

  private scoreOutfit(outfit: ClothingItem[], analysis: AIAnalysisResult, preferences: StylePreferences, occasion?: string): number {
    let score = 0;
    
    // Style consistency
    const styles = outfit.map(item => item.style);
    const uniqueStyles = new Set(styles);
    if (uniqueStyles.size <= 2) score += 30;

    // Color harmony
    const colors = outfit.flatMap(item => item.colors);
    if (this.hasColorHarmony(colors)) score += 25;

    // Occasion appropriateness
    if (occasion && outfit.every(item => this.isAppropriateForOccasion(item, occasion))) {
      score += 20;
    }

    return score;
  }

  private hasColorHarmony(colors: string[]): boolean {
    // Simplified color harmony check
    return colors.length <= 3;
  }

  private isAppropriateForOccasion(item: ClothingItem, occasion: string): boolean {
    const occasionStyles: Record<string, string[]> = {
      'work': ['business', 'formal', 'classic'],
      'casual': ['casual', 'trendy'],
      'party': ['formal', 'trendy']
    };
    
    return occasionStyles[occasion]?.includes(item.style) || false;
  }

  private getComplementaryColor(color: string): string {
    const complementaryMap: Record<string, string> = {
      'red': 'green',
      'blue': 'orange',
      'yellow': 'purple',
      'green': 'red',
      'orange': 'blue',
      'purple': 'yellow'
    };
    
    return complementaryMap[color.toLowerCase()] || 'white';
  }

  private getAnalogousColors(color: string): string[] {
    const analogousMap: Record<string, string[]> = {
      'red': ['orange', 'pink'],
      'blue': ['teal', 'navy'],
      'yellow': ['gold', 'cream'],
      'green': ['teal', 'olive']
    };
    
    return analogousMap[color.toLowerCase()] || ['gray', 'beige'];
  }

  private isColorCompatibleWithSkinTone(color: string, skinTone: string): boolean {
    const warmColors = ['red', 'orange', 'yellow', 'brown'];
    const coolColors = ['blue', 'green', 'purple', 'gray'];
    
    if (skinTone === 'warm') {
      return warmColors.some(warm => color.toLowerCase().includes(warm));
    }
    if (skinTone === 'cool') {
      return coolColors.some(cool => color.toLowerCase().includes(cool));
    }
    return true; // Neutral skin tone works with most colors
  }
}

export const aiService = new AIService();
export default aiService;
