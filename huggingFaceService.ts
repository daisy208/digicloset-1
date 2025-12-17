import { HfInference } from '@huggingface/inference';
import { ClothingItem, StylePreferences } from '../../types';

export interface HuggingFaceConfig {
  apiKey: string;
  models: {
    imageClassification: string;
    objectDetection: string;
    imageSegmentation: string;
    textGeneration: string;
    imageToText: string;
  };
}

export class HuggingFaceService {
  private hf: HfInference;
  private config: HuggingFaceConfig;
  private isInitialized = false;

  constructor() {
    const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HuggingFace API key not configured');
    }

    this.hf = new HfInference(apiKey);
    this.config = {
      apiKey,
      models: {
        imageClassification: 'microsoft/resnet-50',
        objectDetection: 'facebook/detr-resnet-50',
        imageSegmentation: 'facebook/detr-resnet-50-panoptic',
        textGeneration: 'microsoft/DialoGPT-medium',
        imageToText: 'nlpconnect/vit-gpt2-image-captioning'
      }
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test API connection
      await this.hf.listModels({ limit: 1 });
      this.isInitialized = true;
      console.log('✅ HuggingFace service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize HuggingFace service:', error);
      throw new Error('Failed to initialize HuggingFace service');
    }
  }

  // Analyze clothing items in image
  async analyzeClothingInImage(imageBlob: Blob): Promise<{
    detectedItems: Array<{
      label: string;
      confidence: number;
      bbox: { x: number; y: number; width: number; height: number };
    }>;
    description: string;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      // Object detection for clothing items
      const detectionResult = await this.hf.objectDetection({
        data: imageBlob,
        model: this.config.models.objectDetection
      });

      // Filter for clothing-related objects
      const clothingLabels = [
        'person', 'shirt', 'dress', 'pants', 'jacket', 'coat', 
        'skirt', 'shoes', 'hat', 'bag', 'tie', 'suit'
      ];

      const detectedItems = detectionResult
        .filter(item => clothingLabels.some(label => 
          item.label.toLowerCase().includes(label)
        ))
        .map(item => ({
          label: item.label,
          confidence: item.score,
          bbox: {
            x: item.box.xmin,
            y: item.box.ymin,
            width: item.box.xmax - item.box.xmin,
            height: item.box.ymax - item.box.ymin
          }
        }));

      // Generate description of the image
      const captionResult = await this.hf.imageToText({
        data: imageBlob,
        model: this.config.models.imageToText
      });

      return {
        detectedItems,
        description: captionResult.generated_text
      };
    } catch (error) {
      console.error('HuggingFace clothing analysis failed:', error);
      throw new Error('Failed to analyze clothing in image');
    }
  }

  // Generate style recommendations using text generation
  async generateStyleRecommendations(
    userProfile: {
      bodyShape: string;
      skinTone: string;
      preferences: StylePreferences;
    },
    occasion: string
  ): Promise<{
    recommendations: string[];
    reasoning: string;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const prompt = this.buildStylePrompt(userProfile, occasion);
      
      const result = await this.hf.textGeneration({
        model: this.config.models.textGeneration,
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          do_sample: true,
          return_full_text: false
        }
      });

      const response = result.generated_text;
      return this.parseStyleRecommendations(response);
    } catch (error) {
      console.error('HuggingFace style generation failed:', error);
      throw new Error('Failed to generate style recommendations');
    }
  }

  // Classify clothing style from image
  async classifyClothingStyle(imageBlob: Blob): Promise<{
    style: string;
    confidence: number;
    alternatives: Array<{ style: string; confidence: number }>;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = await this.hf.imageClassification({
        data: imageBlob,
        model: this.config.models.imageClassification
      });

      // Map model outputs to clothing styles
      const styleMapping = this.mapToClothingStyles(result);
      
      return {
        style: styleMapping[0]?.style || 'casual',
        confidence: styleMapping[0]?.confidence || 0.5,
        alternatives: styleMapping.slice(1, 4)
      };
    } catch (error) {
      console.error('HuggingFace style classification failed:', error);
      throw new Error('Failed to classify clothing style');
    }
  }

  // Segment person from background
  async segmentPerson(imageBlob: Blob): Promise<{
    maskUrl: string;
    confidence: number;
  }> {
    if (!this.isInitialized) await this.initialize();

    try {
      const result = await this.hf.imageSegmentation({
        data: imageBlob,
        model: this.config.models.imageSegmentation
      });

      // Find person segment
      const personSegment = result.find(segment => 
        segment.label.toLowerCase().includes('person')
      );

      if (!personSegment) {
        throw new Error('No person detected in image');
      }

      return {
        maskUrl: personSegment.mask,
        confidence: personSegment.score
      };
    } catch (error) {
      console.error('HuggingFace segmentation failed:', error);
      throw new Error('Failed to segment person from image');
    }
  }

  private buildStylePrompt(userProfile: any, occasion: string): string {
    return `Fashion stylist recommendation for a ${userProfile.bodyShape} body shape with ${userProfile.skinTone} skin tone. 
    User prefers ${userProfile.preferences.preferredStyles.join(', ')} styles and likes ${userProfile.preferences.favoriteColors.join(', ')} colors.
    Occasion: ${occasion}. 
    Provide 3 specific clothing recommendations with reasoning:`;
  }

  private parseStyleRecommendations(response: string): {
    recommendations: string[];
    reasoning: string;
  } {
    const lines = response.split('\n').filter(line => line.trim());
    const recommendations = lines.filter(line => 
      line.includes('recommend') || line.includes('suggest') || line.includes('try')
    ).slice(0, 3);

    return {
      recommendations: recommendations.length > 0 ? recommendations : ['Classic pieces that match your style'],
      reasoning: lines.join(' ')
    };
  }

  private mapToClothingStyles(classifications: any[]): Array<{ style: string; confidence: number }> {
    const styleMap: Record<string, string> = {
      'suit': 'formal',
      'dress': 'formal',
      'casual': 'casual',
      'business': 'business',
      'elegant': 'classic',
      'modern': 'minimalist',
      'vintage': 'classic',
      'sporty': 'casual',
      'chic': 'trendy'
    };

    return classifications
      .map(item => {
        const mappedStyle = Object.keys(styleMap).find(key => 
          item.label.toLowerCase().includes(key)
        );
        
        return {
          style: mappedStyle ? styleMap[mappedStyle] : 'casual',
          confidence: item.score
        };
      })
      .filter(item => item.confidence > 0.1)
      .sort((a, b) => b.confidence - a.confidence);
  }
}

export const huggingFaceService = new HuggingFaceService();