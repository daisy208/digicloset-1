import { FaceMesh } from '@mediapipe/face_mesh';

export interface FaceAnalysisResult {
  skinTone: 'warm' | 'cool' | 'neutral';
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond';
  skinColor: {
    r: number;
    g: number;
    b: number;
    hex: string;
  };
  confidence: number;
}

export class FaceAnalysisService {
  private faceMeshModel: FaceMesh | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.faceMeshModel = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });

      this.faceMeshModel.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isInitialized = true;
      console.log('✅ Face analysis service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize face analysis:', error);
      throw new Error('Failed to initialize face analysis service');
    }
  }

  async analyzeFace(imageElement: HTMLImageElement): Promise<FaceAnalysisResult> {
    if (!this.isInitialized || !this.faceMeshModel) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.faceMeshModel) {
        reject(new Error('Face mesh model not initialized'));
        return;
      }

      this.faceMeshModel.onResults((results) => {
        try {
          if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
            reject(new Error('No face detected in image'));
            return;
          }

          const landmarks = results.multiFaceLandmarks[0];
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          
          canvas.width = imageElement.naturalWidth;
          canvas.height = imageElement.naturalHeight;
          ctx.drawImage(imageElement, 0, 0);

          const skinColor = this.extractSkinColor(landmarks, canvas, ctx);
          const skinTone = this.determineSkinTone(skinColor);
          const faceShape = this.determineFaceShape(landmarks);
          const confidence = this.calculateFaceConfidence(landmarks);

          resolve({
            skinTone,
            faceShape,
            skinColor,
            confidence
          });
        } catch (error) {
          reject(error);
        }
      });

      this.faceMeshModel.send({ image: imageElement });
    });
  }

  private extractSkinColor(landmarks: any[], canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): {
    r: number;
    g: number;
    b: number;
    hex: string;
  } {
    // Sample skin color from multiple face regions
    const samplePoints = [
      landmarks[10],  // Forehead
      landmarks[151], // Cheek
      landmarks[175], // Cheek
      landmarks[136], // Nose bridge
      landmarks[150]  // Chin
    ];

    let totalR = 0, totalG = 0, totalB = 0;
    let validSamples = 0;

    samplePoints.forEach(point => {
      if (point && point.x >= 0 && point.y >= 0) {
        const x = Math.floor(point.x * canvas.width);
        const y = Math.floor(point.y * canvas.height);
        
        if (x < canvas.width && y < canvas.height) {
          const imageData = ctx.getImageData(x, y, 1, 1);
          const [r, g, b] = imageData.data;
          
          totalR += r;
          totalG += g;
          totalB += b;
          validSamples++;
        }
      }
    });

    if (validSamples === 0) {
      // Fallback to center of face
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const imageData = ctx.getImageData(centerX, centerY, 1, 1);
      const [r, g, b] = imageData.data;
      
      return {
        r,
        g,
        b,
        hex: `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      };
    }

    const avgR = Math.round(totalR / validSamples);
    const avgG = Math.round(totalG / validSamples);
    const avgB = Math.round(totalB / validSamples);

    return {
      r: avgR,
      g: avgG,
      b: avgB,
      hex: `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`
    };
  }

  private determineSkinTone(skinColor: { r: number; g: number; b: number }): 'warm' | 'cool' | 'neutral' {
    const { r, g, b } = skinColor;
    
    // Convert to HSV for better analysis
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let hue = 0;
    if (diff !== 0) {
      if (max === r) {
        hue = ((g - b) / diff) % 6;
      } else if (max === g) {
        hue = (b - r) / diff + 2;
      } else {
        hue = (r - g) / diff + 4;
      }
      hue = Math.round(hue * 60);
      if (hue < 0) hue += 360;
    }

    // Analyze undertones
    const yellowUndertone = (r + g) / 2 - b;
    const pinkUndertone = (r + b) / 2 - g;
    
    if (yellowUndertone > pinkUndertone + 10) {
      return 'warm';
    } else if (pinkUndertone > yellowUndertone + 10) {
      return 'cool';
    } else {
      return 'neutral';
    }
  }

  private determineFaceShape(landmarks: any[]): 'oval' | 'round' | 'square' | 'heart' | 'diamond' {
    // Key facial landmarks for shape analysis
    const forehead = { x: landmarks[10].x, y: landmarks[10].y };
    const leftCheek = { x: landmarks[234].x, y: landmarks[234].y };
    const rightCheek = { x: landmarks[454].x, y: landmarks[454].y };
    const chin = { x: landmarks[175].x, y: landmarks[175].y };
    const leftJaw = { x: landmarks[172].x, y: landmarks[172].y };
    const rightJaw = { x: landmarks[397].x, y: landmarks[397].y };

    // Calculate face dimensions
    const faceWidth = this.calculateDistance(leftCheek, rightCheek);
    const faceHeight = this.calculateDistance(forehead, chin);
    const jawWidth = this.calculateDistance(leftJaw, rightJaw);
    const foreheadWidth = faceWidth * 0.9; // Approximate

    // Calculate ratios
    const lengthToWidthRatio = faceHeight / faceWidth;
    const jawToForeheadRatio = jawWidth / foreheadWidth;

    // Determine face shape based on ratios
    if (lengthToWidthRatio > 1.3) {
      if (jawToForeheadRatio < 0.8) {
        return 'heart';
      } else {
        return 'oval';
      }
    } else if (lengthToWidthRatio < 1.1) {
      return 'round';
    } else if (jawToForeheadRatio > 0.95) {
      return 'square';
    } else if (jawToForeheadRatio < 0.7) {
      return 'diamond';
    } else {
      return 'oval';
    }
  }

  private calculateDistance(point1: any, point2: any): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  private calculateFaceConfidence(landmarks: any[]): number {
    // Calculate confidence based on landmark visibility and consistency
    const keyLandmarks = [10, 151, 175, 234, 454]; // Key face points
    const visibilities = keyLandmarks.map(i => landmarks[i]?.visibility || 0);
    const avgVisibility = visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
    
    return Math.min(avgVisibility * 1.1, 0.95);
  }
}

export const faceAnalysisService = new FaceAnalysisService();