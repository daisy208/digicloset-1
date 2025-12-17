import { ClothingItem, StylePreferences, LightingSettings } from '../../types';

export interface CustomBackendConfig {
  baseUrl: string;
  apiKey: string;
  endpoints: {
    virtualTryOn: string;
    bodyAnalysis: string;
    styleRecommendation: string;
    colorAnalysis: string;
    imageEnhancement: string;
  };
}

export interface VirtualTryOnRequest {
  personImage: string;
  clothingImage: string;
  bodyKeypoints?: any;
  lightingSettings?: LightingSettings;
  preserveBackground?: boolean;
}

export interface VirtualTryOnResponse {
  resultImageUrl: string;
  processingTime: number;
  confidence: number;
  fitAnalysis: {
    overall_fit: 'excellent' | 'good' | 'fair' | 'poor';
    size_recommendation: string;
    adjustments_needed: string[];
  };
}

export class CustomBackendService {
  private config: CustomBackendConfig;
  private isInitialized = false;

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000',
      apiKey: import.meta.env.VITE_AI_API_KEY || '',
      endpoints: {
        virtualTryOn: '/api/v1/virtual-tryon',
        bodyAnalysis: '/api/v1/body-analysis',
        styleRecommendation: '/api/v1/style-recommendation',
        colorAnalysis: '/api/v1/color-analysis',
        imageEnhancement: '/api/v1/image-enhancement'
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test backend connection
      const response = await fetch(`${this.config.baseUrl}/health`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }

      this.isInitialized = true;
      console.log('✅ Custom backend service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize custom backend:', error);
      throw new Error('Failed to initialize custom backend service');
    }
  }

  // Virtual try-on using VITON-HD or similar models
  async processVirtualTryOn(request: VirtualTryOnRequest): Promise<VirtualTryOnResponse> {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.virtualTryOn}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          person_image: request.personImage,
          clothing_image: request.clothingImage,
          body_keypoints: request.bodyKeypoints,
          lighting_settings: request.lightingSettings,
          preserve_background: request.preserveBackground || false,
          model_config: {
            num_inference_steps: 20,
            guidance_scale: 7.5,
            strength: 0.8
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Virtual try-on failed: ${response.status}`);
      }

      const result = await response.json();
      return {
        resultImageUrl: result.result_image_url,
        processingTime: result.processing_time,
        confidence: result.confidence,
        fitAnalysis: result.fit_analysis
      };
    } catch (error) {
      console.error('Custom backend virtual try-on failed:', error);
      throw new Error('Failed to process virtual try-on');
    }
  }

  // Body analysis using OpenPose or MediaPipe
  async analyzeBody(imageData: string): Promise<{
    keypoints: any;
    measurements: any;
    bodyShape: string;
    confidence: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.bodyAnalysis}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData,
          model: 'mediapipe_pose',
          extract_measurements: true,
          detect_body_shape: true
        })
      });

      if (!response.ok) {
        throw new Error(`Body analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Custom backend body analysis failed:', error);
      throw new Error('Failed to analyze body');
    }
  }

  // Style recommendations using transformer models
  async generateStyleRecommendations(
    userProfile: any,
    preferences: StylePreferences,
    availableItems: ClothingItem[],
    occasion?: string
  ): Promise<any[]> {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.styleRecommendation}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_profile: userProfile,
          preferences,
          available_items: availableItems,
          occasion,
          model_config: {
            top_k: 8,
            temperature: 0.7,
            use_collaborative_filtering: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Style recommendation failed: ${response.status}`);
      }

      const result = await response.json();
      return result.recommendations;
    } catch (error) {
      console.error('Custom backend style recommendation failed:', error);
      throw new Error('Failed to generate style recommendations');
    }
  }

  // Color analysis using computer vision models
  async analyzeColors(imageData: string): Promise<{
    dominantColors: Array<{ color: string; percentage: number; hex: string }>;
    colorHarmony: number;
    skinToneCompatibility: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.colorAnalysis}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData,
          extract_palette: true,
          analyze_harmony: true,
          num_colors: 5
        })
      });

      if (!response.ok) {
        throw new Error(`Color analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Custom backend color analysis failed:', error);
      throw new Error('Failed to analyze colors');
    }
  }

  // Image enhancement using super-resolution models
  async enhanceImage(imageData: string, options: {
    upscale?: boolean;
    denoise?: boolean;
    sharpen?: boolean;
    colorCorrection?: boolean;
  } = {}): Promise<{
    enhancedImageUrl: string;
    improvements: string[];
    qualityScore: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(`${this.config.baseUrl}${this.config.endpoints.imageEnhancement}`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: imageData,
          enhancements: {
            upscale: options.upscale || false,
            denoise: options.denoise || true,
            sharpen: options.sharpen || true,
            color_correction: options.colorCorrection || true
          },
          model: 'real_esrgan'
        })
      });

      if (!response.ok) {
        throw new Error(`Image enhancement failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Custom backend image enhancement failed:', error);
      throw new Error('Failed to enhance image');
    }
  }

  // Batch processing for multiple requests
  async batchProcess(requests: Array<{
    type: 'virtual_tryon' | 'body_analysis' | 'style_recommendation';
    data: any;
  }>): Promise<Array<{ success: boolean; result?: any; error?: string }>> {
    if (!this.isInitialized) await this.initialize();

    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/batch`, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests,
          batch_config: {
            max_concurrent: 3,
            timeout_seconds: 30
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Batch processing failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw new Error('Failed to process batch requests');
    }
  }

  // Get model status and performance metrics
  async getModelStatus(): Promise<{
    models: Record<string, { status: string; latency: number; accuracy: number }>;
    overall: boolean;
    gpu_usage: number;
    memory_usage: number;
  }> {
    try {
      const response = await fetch(`${this.config.baseUrl}/api/v1/status`, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Model status check failed:', error);
      return {
        models: {},
        overall: false,
        gpu_usage: 0,
        memory_usage: 0
      };
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'VirtualFit-Frontend/1.0'
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}

export const customBackendService = new CustomBackendService();