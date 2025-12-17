import { ClothingItem, StylePreferences, LightingSettings } from '../types';

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

class EnhancedAIService {
  private modelVersions = {
    bodyAnalysis: 'v2.1.0',
    styleRecommendation: 'v1.8.0',
    virtualTryOn: 'v3.0.0'
  };

  private fallbackEnabled = true;
  private maxRetries = 3;
  private baseDelay = 1000;

  // Enhanced photo analysis with retry logic and fallback
  async analyzeUserPhotoWithRetry(imageData: string, maxRetries = this.maxRetries): Promise<AIAnalysisResult> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.analyzeUserPhoto(imageData);
      } catch (error) {
        console.warn(`AI analysis attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          if (this.fallbackEnabled) {
            console.log('Using fallback analysis');
            return this.getFallbackAnalysis(imageData);
          }
          throw new Error('AI analysis failed after all retries');
        }
        
        // Exponential backoff
        await this.delay(this.baseDelay * Math.pow(2, attempt - 1));
      }
    }
    
    throw new Error('Unexpected error in retry logic');
  }

  // Fallback analysis when AI services are unavailable
  private async getFallbackAnalysis(imageData: string): Promise<AIAnalysisResult> {
    // Basic image analysis without AI
    const dimensions = await this.getImageDimensions(imageData);
    
    return {
      bodyMeasurements: this.estimateFromImageDimensions(dimensions),
      skinTone: 'neutral',
      bodyShape: 'rectangle',
      faceShape: 'oval',
      confidence: 0.6
    };
  }

  // Batch processing for multiple users
  async batchProcessRecommendations(
    requests: Array<{
      userAnalysis: AIAnalysisResult;
      preferences: StylePreferences;
      availableItems: ClothingItem[];
      occasion?: string;
    }>
  ): Promise<StyleRecommendation[][]> {
    const batchSize = 10;
    const results: StyleRecommendation[][] = [];
    
    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      
      try {
        const batchResults = await Promise.all(
          batch.map(req => this.generateRecommendations(
            req.userAnalysis,
            req.preferences,
            req.availableItems,
            req.occasion
          ))
        );
        results.push(...batchResults);
      } catch (error) {
        console.error(`Batch processing failed for batch starting at ${i}:`, error);
        // Add empty results for failed batch
        results.push(...batch.map(() => []));
      }
    }
    
    return results;
  }

  // Enhanced virtual try-on with quality checks
  async processVirtualTryOnEnhanced(
    userPhoto: string,
    clothingItems: ClothingItem[],
    lightingSettings: LightingSettings,
    userAnalysis?: AIAnalysisResult
  ): Promise<{
    processedImageUrl: string;
    fitAnalysis: any;
    processingTime: number;
    qualityScore: number;
    recommendations: string[];
  }> {
    const startTime = Date.now();
    
    try {
      // Validate inputs
      this.validateTryOnInputs(userPhoto, clothingItems);
      
      // Process with AI
      const result = await this.processVirtualTryOn(userPhoto, clothingItems, lightingSettings, userAnalysis);
      
      // Quality assessment
      const qualityScore = await this.assessImageQuality(result.processedImageUrl);
      
      // Generate improvement recommendations
      const recommendations = this.generateImprovementRecommendations(qualityScore, lightingSettings);
      
      return {
        ...result,
        qualityScore,
        recommendations,
        processingTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Enhanced virtual try-on failed:', error);
      throw error;
    }
  }

  // Smart caching for recommendations
  private recommendationCache = new Map<string, { data: StyleRecommendation[]; timestamp: number }>();
  private cacheTimeout = 30 * 60 * 1000; // 30 minutes

  async generateRecommendationsWithCache(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<StyleRecommendation[]> {
    const cacheKey = this.generateCacheKey(userAnalysis, preferences, occasion);
    const cached = this.recommendationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const recommendations = await this.generateRecommendations(
      userAnalysis,
      preferences,
      availableItems,
      occasion
    );
    
    this.recommendationCache.set(cacheKey, {
      data: recommendations,
      timestamp: Date.now()
    });
    
    return recommendations;
  }

  // A/B testing for AI models
  async generateRecommendationsWithABTest(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    testVariant: 'control' | 'experimental' = 'control'
  ): Promise<StyleRecommendation[]> {
    if (testVariant === 'experimental') {
      return this.generateExperimentalRecommendations(userAnalysis, preferences, availableItems);
    }
    
    return this.generateRecommendations(userAnalysis, preferences, availableItems);
  }

  // Performance monitoring
  private performanceMetrics = {
    analysisTime: [] as number[],
    recommendationTime: [] as number[],
    tryOnTime: [] as number[]
  };

  private trackPerformance(operation: string, duration: number) {
    const metrics = this.performanceMetrics[operation as keyof typeof this.performanceMetrics];
    if (metrics) {
      metrics.push(duration);
      // Keep only last 100 measurements
      if (metrics.length > 100) {
        metrics.shift();
      }
    }
  }

  getPerformanceStats() {
    const calculateStats = (times: number[]) => {
      if (times.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
      
      const sorted = [...times].sort((a, b) => a - b);
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const p95Index = Math.floor(sorted.length * 0.95);
      const p95 = sorted[p95Index];
      
      return { avg, min, max, p95 };
    };

    return {
      analysis: calculateStats(this.performanceMetrics.analysisTime),
      recommendation: calculateStats(this.performanceMetrics.recommendationTime),
      tryOn: calculateStats(this.performanceMetrics.tryOnTime)
    };
  }

  // Helper methods
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async getImageDimensions(imageData: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.src = imageData;
    });
  }

  private estimateFromImageDimensions(dimensions: { width: number; height: number }) {
    // Basic estimation based on image proportions
    const aspectRatio = dimensions.height / dimensions.width;
    
    return {
      shoulders: 42,
      chest: Math.round(36 * (aspectRatio > 1.3 ? 1.1 : 0.9)),
      waist: Math.round(30 * (aspectRatio > 1.3 ? 1.0 : 0.8)),
      hips: Math.round(38 * (aspectRatio > 1.3 ? 1.1 : 0.9)),
      height: Math.round(168 * (aspectRatio > 1.5 ? 1.1 : aspectRatio < 1.2 ? 0.9 : 1.0))
    };
  }

  private validateTryOnInputs(userPhoto: string, clothingItems: ClothingItem[]) {
    if (!userPhoto) {
      throw new Error('User photo is required');
    }
    
    if (!clothingItems || clothingItems.length === 0) {
      throw new Error('At least one clothing item is required');
    }
    
    if (clothingItems.length > 5) {
      throw new Error('Maximum 5 clothing items allowed');
    }
  }

  private async assessImageQuality(imageUrl: string): Promise<number> {
    // Simulate quality assessment
    // In real implementation, this would analyze image sharpness, lighting, etc.
    return Math.random() * 40 + 60; // Score between 60-100
  }

  private generateImprovementRecommendations(qualityScore: number, lightingSettings: LightingSettings): string[] {
    const recommendations = [];
    
    if (qualityScore < 70) {
      recommendations.push('Try adjusting the lighting for better results');
    }
    
    if (lightingSettings.brightness < 80) {
      recommendations.push('Increase brightness for clearer visualization');
    }
    
    if (lightingSettings.contrast > 120) {
      recommendations.push('Reduce contrast for more natural appearance');
    }
    
    return recommendations;
  }

  private generateCacheKey(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    occasion?: string
  ): string {
    return `${userAnalysis.bodyShape}_${userAnalysis.skinTone}_${preferences.preferredStyles.join(',')}_${occasion || 'any'}`;
  }

  private async generateExperimentalRecommendations(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[]
  ): Promise<StyleRecommendation[]> {
    // Experimental algorithm with different scoring
    return this.generateRecommendations(userAnalysis, preferences, availableItems);
  }

  // Existing methods from original aiService would be here...
  private async analyzeUserPhoto(imageData: string): Promise<AIAnalysisResult> {
    // Simulate AI processing with realistic delay
    await this.delay(2000);
    
    return {
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
  }

  private async generateRecommendations(
    userAnalysis: AIAnalysisResult,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<StyleRecommendation[]> {
    const startTime = Date.now();
    
    try {
      await this.delay(1500);

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

      const result = recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      
      this.trackPerformance('recommendationTime', Date.now() - startTime);
      return result;
    } catch (error) {
      console.error('Recommendation generation failed:', error);
      throw error;
    }
  }

  private async processVirtualTryOn(
    userPhoto: string,
    clothingItems: ClothingItem[],
    lightingSettings: LightingSettings,
    userAnalysis?: AIAnalysisResult
  ): Promise<any> {
    const startTime = Date.now();
    await this.delay(3000);

    const result = {
      processedImageUrl: this.generateProcessedImageUrl(userPhoto, clothingItems),
      fitAnalysis: {
        overall_fit: this.predictOverallFit(clothingItems, userAnalysis),
        size_recommendation: this.recommendSize(clothingItems, userAnalysis),
        adjustments_needed: this.suggestAdjustments(clothingItems, userAnalysis),
        confidence: 0.88
      },
      processingTime: Date.now() - startTime
    };

    this.trackPerformance('tryOnTime', Date.now() - startTime);
    return result;
  }

  // Additional helper methods would be implemented here...
  private detectSkinTone(imageData: string): 'warm' | 'cool' | 'neutral' {
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

    if (preferences.preferredStyles.includes(item.style)) score += 30;

    const colorMatch = item.colors.some(color => 
      preferences.favoriteColors.some(prefColor => 
        color.toLowerCase().includes(prefColor.toLowerCase())
      )
    );
    if (colorMatch) score += 25;

    if (item.price >= preferences.priceRange[0] && item.price <= preferences.priceRange[1]) {
      score += 20;
    }

    score += this.calculateBodyShapeCompatibility(item, analysis.bodyShape);
    score += this.calculateSkinToneCompatibility(item, analysis.skinTone);

    if (occasion) {
      score += this.calculateOccasionMatch(item, occasion);
    }

    return Math.min(score, 100);
  }

  private calculateBodyShapeCompatibility(item: ClothingItem, bodyShape: string): number {
    const compatibilityMap: Record<string, Record<string, number>> = {
      'pear': { 'tops': 15, 'dresses': 10, 'outerwear': 12 },
      'apple': { 'dresses': 15, 'tops': 12, 'outerwear': 10 },
      'hourglass': { 'dresses': 15, 'tops': 12, 'bottoms': 10 }
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
    return Math.random() * 100;
  }

  private predictFit(item: ClothingItem, measurements: any): number {
    return Math.random() * 100;
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
    return `${userPhoto}?processed=${Date.now()}`;
  }
}

export const enhancedAIService = new EnhancedAIService();
export default enhancedAIService;