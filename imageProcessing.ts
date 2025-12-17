import * as tf from '@tensorflow/tfjs';

export interface ImageQualityMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise: number;
  overall: number;
}

export interface ImageEnhancement {
  enhanced: boolean;
  improvements: string[];
  beforeMetrics: ImageQualityMetrics;
  afterMetrics: ImageQualityMetrics;
}

export class ImageProcessingService {
  private qualityModel: tf.LayersModel | null = null;
  private enhancementModel: tf.LayersModel | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load pre-trained models for image quality assessment and enhancement
      await Promise.all([
        this.loadQualityModel(),
        this.loadEnhancementModel()
      ]);

      this.isInitialized = true;
      console.log('✅ Image processing service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize image processing:', error);
      throw new Error('Failed to initialize image processing service');
    }
  }

  private async loadQualityModel(): Promise<void> {
    try {
      // In production, load from your model hosting service
      this.qualityModel = await tf.loadLayersModel('/models/image-quality-model.json');
    } catch (error) {
      console.warn('Quality model not available, using fallback assessment');
    }
  }

  private async loadEnhancementModel(): Promise<void> {
    try {
      this.enhancementModel = await tf.loadLayersModel('/models/image-enhancement-model.json');
    } catch (error) {
      console.warn('Enhancement model not available, using traditional methods');
    }
  }

  async assessImageQuality(imageElement: HTMLImageElement): Promise<ImageQualityMetrics> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      if (this.qualityModel) {
        return await this.assessQualityWithML(imageElement);
      } else {
        return await this.assessQualityTraditional(imageElement);
      }
    } catch (error) {
      console.error('Image quality assessment failed:', error);
      return this.getDefaultQualityMetrics();
    }
  }

  private async assessQualityWithML(imageElement: HTMLImageElement): Promise<ImageQualityMetrics> {
    // Preprocess image for ML model
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([224, 224])
      .expandDims(0)
      .div(255.0);

    // Run quality assessment model
    const prediction = this.qualityModel!.predict(tensor) as tf.Tensor;
    const scores = await prediction.data();

    tensor.dispose();
    prediction.dispose();

    return {
      sharpness: scores[0] * 100,
      brightness: scores[1] * 100,
      contrast: scores[2] * 100,
      noise: (1 - scores[3]) * 100, // Invert noise score
      overall: (scores[0] + scores[1] + scores[2] + (1 - scores[3])) / 4 * 100
    };
  }

  private async assessQualityTraditional(imageElement: HTMLImageElement): Promise<ImageQualityMetrics> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Calculate traditional image quality metrics
    const sharpness = this.calculateSharpness(pixels, canvas.width, canvas.height);
    const brightness = this.calculateBrightness(pixels);
    const contrast = this.calculateContrast(pixels);
    const noise = this.calculateNoise(pixels);

    const overall = (sharpness + brightness + contrast + (100 - noise)) / 4;

    return { sharpness, brightness, contrast, noise, overall };
  }

  private calculateSharpness(pixels: Uint8ClampedArray, width: number, height: number): number {
    // Sobel edge detection for sharpness
    let edgeSum = 0;
    let pixelCount = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        
        // Convert to grayscale
        const gray = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
        
        // Sobel operators
        const gx = (
          -1 * this.getGrayPixel(pixels, x - 1, y - 1, width) +
          1 * this.getGrayPixel(pixels, x + 1, y - 1, width) +
          -2 * this.getGrayPixel(pixels, x - 1, y, width) +
          2 * this.getGrayPixel(pixels, x + 1, y, width) +
          -1 * this.getGrayPixel(pixels, x - 1, y + 1, width) +
          1 * this.getGrayPixel(pixels, x + 1, y + 1, width)
        );

        const gy = (
          -1 * this.getGrayPixel(pixels, x - 1, y - 1, width) +
          -2 * this.getGrayPixel(pixels, x, y - 1, width) +
          -1 * this.getGrayPixel(pixels, x + 1, y - 1, width) +
          1 * this.getGrayPixel(pixels, x - 1, y + 1, width) +
          2 * this.getGrayPixel(pixels, x, y + 1, width) +
          1 * this.getGrayPixel(pixels, x + 1, y + 1, width)
        );

        edgeSum += Math.sqrt(gx * gx + gy * gy);
        pixelCount++;
      }
    }

    const avgEdgeStrength = edgeSum / pixelCount;
    return Math.min((avgEdgeStrength / 50) * 100, 100); // Normalize to 0-100
  }

  private getGrayPixel(pixels: Uint8ClampedArray, x: number, y: number, width: number): number {
    const idx = (y * width + x) * 4;
    return (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
  }

  private calculateBrightness(pixels: Uint8ClampedArray): number {
    let sum = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      sum += brightness;
    }
    
    const avgBrightness = sum / (pixels.length / 4);
    
    // Optimal brightness is around 128, score based on distance from optimal
    const distance = Math.abs(avgBrightness - 128);
    return Math.max(0, 100 - (distance / 128) * 100);
  }

  private calculateContrast(pixels: Uint8ClampedArray): number {
    const brightnesses = [];
    for (let i = 0; i < pixels.length; i += 4) {
      brightnesses.push((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
    }

    const mean = brightnesses.reduce((sum, b) => sum + b, 0) / brightnesses.length;
    const variance = brightnesses.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / brightnesses.length;
    const stdDev = Math.sqrt(variance);

    // Higher standard deviation indicates better contrast
    return Math.min((stdDev / 64) * 100, 100);
  }

  private calculateNoise(pixels: Uint8ClampedArray): number {
    // Simplified noise detection using local variance
    let noiseSum = 0;
    let sampleCount = 0;

    for (let i = 0; i < pixels.length; i += 16) { // Sample every 4th pixel
      if (i + 12 < pixels.length) {
        const r1 = pixels[i];
        const r2 = pixels[i + 4];
        const variance = Math.abs(r1 - r2);
        noiseSum += variance;
        sampleCount++;
      }
    }

    const avgNoise = noiseSum / sampleCount;
    return Math.min((avgNoise / 50) * 100, 100);
  }

  async enhanceImage(imageElement: HTMLImageElement): Promise<{
    enhancedImageUrl: string;
    enhancement: ImageEnhancement;
  }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const beforeMetrics = await this.assessImageQuality(imageElement);
    
    try {
      let enhancedImageUrl: string;
      
      if (this.enhancementModel) {
        enhancedImageUrl = await this.enhanceWithML(imageElement);
      } else {
        enhancedImageUrl = await this.enhanceTraditional(imageElement, beforeMetrics);
      }

      // Create temporary image element to assess enhanced quality
      const enhancedImage = new Image();
      enhancedImage.src = enhancedImageUrl;
      
      await new Promise(resolve => {
        enhancedImage.onload = resolve;
      });

      const afterMetrics = await this.assessImageQuality(enhancedImage);
      
      const improvements = this.identifyImprovements(beforeMetrics, afterMetrics);

      return {
        enhancedImageUrl,
        enhancement: {
          enhanced: improvements.length > 0,
          improvements,
          beforeMetrics,
          afterMetrics
        }
      };
    } catch (error) {
      console.error('Image enhancement failed:', error);
      return {
        enhancedImageUrl: imageElement.src,
        enhancement: {
          enhanced: false,
          improvements: [],
          beforeMetrics,
          afterMetrics: beforeMetrics
        }
      };
    }
  }

  private async enhanceWithML(imageElement: HTMLImageElement): Promise<string> {
    // Preprocess image for enhancement model
    const tensor = tf.browser.fromPixels(imageElement)
      .resizeNearestNeighbor([256, 256])
      .expandDims(0)
      .div(255.0);

    // Run enhancement model
    const enhanced = this.enhancementModel!.predict(tensor) as tf.Tensor;
    
    // Convert back to image
    const enhancedImage = enhanced.squeeze().mul(255).cast('int32');
    const canvas = document.createElement('canvas');
    await tf.browser.toPixels(enhancedImage as tf.Tensor3D, canvas);

    tensor.dispose();
    enhanced.dispose();
    enhancedImage.dispose();

    return canvas.toDataURL('image/jpeg', 0.9);
  }

  private async enhanceTraditional(
    imageElement: HTMLImageElement,
    metrics: ImageQualityMetrics
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    // Apply enhancements based on quality metrics
    if (metrics.brightness < 60) {
      this.adjustBrightness(ctx, canvas, 1.2);
    } else if (metrics.brightness > 85) {
      this.adjustBrightness(ctx, canvas, 0.8);
    }

    if (metrics.contrast < 60) {
      this.adjustContrast(ctx, canvas, 1.3);
    }

    if (metrics.sharpness < 70) {
      this.applySharpeningFilter(ctx, canvas);
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  }

  private adjustBrightness(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, factor: number): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, pixels[i] * factor);     // Red
      pixels[i + 1] = Math.min(255, pixels[i + 1] * factor); // Green
      pixels[i + 2] = Math.min(255, pixels[i + 2] * factor); // Blue
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private adjustContrast(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, factor: number): void {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = Math.min(255, Math.max(0, (pixels[i] - 128) * factor + 128));
      pixels[i + 1] = Math.min(255, Math.max(0, (pixels[i + 1] - 128) * factor + 128));
      pixels[i + 2] = Math.min(255, Math.max(0, (pixels[i + 2] - 128) * factor + 128));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private applySharpeningFilter(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    // Apply unsharp mask filter
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const width = canvas.width;
    const height = canvas.height;

    // Sharpening kernel
    const kernel = [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0
    ];

    const newPixels = new Uint8ClampedArray(pixels.length);

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pixelIndex = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIndex = (ky + 1) * 3 + (kx + 1);
              sum += pixels[pixelIndex] * kernel[kernelIndex];
            }
          }
          
          const outputIndex = (y * width + x) * 4 + c;
          newPixels[outputIndex] = Math.min(255, Math.max(0, sum));
        }
        
        // Copy alpha channel
        const alphaIndex = (y * width + x) * 4 + 3;
        newPixels[alphaIndex] = pixels[alphaIndex];
      }
    }

    const newImageData = new ImageData(newPixels, width, height);
    ctx.putImageData(newImageData, 0, 0);
  }

  private identifyImprovements(before: ImageQualityMetrics, after: ImageQualityMetrics): string[] {
    const improvements = [];

    if (after.brightness > before.brightness + 5) {
      improvements.push('Improved brightness');
    }

    if (after.contrast > before.contrast + 5) {
      improvements.push('Enhanced contrast');
    }

    if (after.sharpness > before.sharpness + 5) {
      improvements.push('Increased sharpness');
    }

    if (after.noise < before.noise - 5) {
      improvements.push('Reduced noise');
    }

    return improvements;
  }

  private getDefaultQualityMetrics(): ImageQualityMetrics {
    return {
      sharpness: 75,
      brightness: 70,
      contrast: 65,
      noise: 20,
      overall: 70
    };
  }

  // Background removal using ML
  async removeBackground(imageElement: HTMLImageElement): Promise<string> {
    try {
      // Use BodyPix or similar model for background segmentation
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = imageElement.naturalWidth;
      canvas.height = imageElement.naturalHeight;
      ctx.drawImage(imageElement, 0, 0);

      // Apply background removal (simplified implementation)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Simple background removal based on edge detection
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        
        // Simple background detection (this would be much more sophisticated with ML)
        const isBackground = this.isBackgroundPixel(r, g, b, i, pixels, canvas.width);
        if (isBackground) {
          pixels[i + 3] = 0; // Make transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Background removal failed:', error);
      return imageElement.src;
    }
  }

  private isBackgroundPixel(r: number, g: number, b: number, index: number, pixels: Uint8ClampedArray, width: number): boolean {
    // Simplified background detection
    // In production, this would use a trained segmentation model
    const brightness = (r + g + b) / 3;
    
    // Detect uniform backgrounds (very simplified)
    return brightness > 240 || brightness < 15;
  }

  // Lighting normalization
  async normalizeLighting(imageElement: HTMLImageElement): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = imageElement.naturalWidth;
    canvas.height = imageElement.naturalHeight;
    ctx.drawImage(imageElement, 0, 0);

    // Apply histogram equalization for better lighting
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const equalizedData = this.histogramEqualization(imageData);
    
    ctx.putImageData(equalizedData, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }

  private histogramEqualization(imageData: ImageData): ImageData {
    const pixels = imageData.data;
    const histogram = new Array(256).fill(0);
    
    // Build histogram
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = Math.round((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
      histogram[gray]++;
    }

    // Calculate cumulative distribution
    const cdf = new Array(256);
    cdf[0] = histogram[0];
    for (let i = 1; i < 256; i++) {
      cdf[i] = cdf[i - 1] + histogram[i];
    }

    // Normalize CDF
    const totalPixels = pixels.length / 4;
    const normalizedCdf = cdf.map(value => Math.round((value / totalPixels) * 255));

    // Apply equalization
    for (let i = 0; i < pixels.length; i += 4) {
      const gray = Math.round((pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3);
      const newValue = normalizedCdf[gray];
      
      // Maintain color ratios
      const ratio = newValue / (gray || 1);
      pixels[i] = Math.min(255, pixels[i] * ratio);
      pixels[i + 1] = Math.min(255, pixels[i + 1] * ratio);
      pixels[i + 2] = Math.min(255, pixels[i + 2] * ratio);
    }

    return imageData;
  }
}

export const imageProcessingService = new ImageProcessingService();