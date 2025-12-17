import * as tf from '@tensorflow/tfjs';
import { Pose, POSE_LANDMARKS } from '@mediapipe/pose';

export interface BodyMeasurements {
  shoulders: number;
  chest: number;
  waist: number;
  hips: number;
  height: number;
  armLength: number;
  legLength: number;
}

export interface PoseKeypoints {
  nose: { x: number; y: number; visibility: number };
  leftShoulder: { x: number; y: number; visibility: number };
  rightShoulder: { x: number; y: number; visibility: number };
  leftElbow: { x: number; y: number; visibility: number };
  rightElbow: { x: number; y: number; visibility: number };
  leftWrist: { x: number; y: number; visibility: number };
  rightWrist: { x: number; y: number; visibility: number };
  leftHip: { x: number; y: number; visibility: number };
  rightHip: { x: number; y: number; visibility: number };
  leftKnee: { x: number; y: number; visibility: number };
  rightKnee: { x: number; y: number; visibility: number };
  leftAnkle: { x: number; y: number; visibility: number };
  rightAnkle: { x: number; y: number; visibility: number };
}

export class BodyAnalysisService {
  private poseModel: Pose | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize MediaPipe Pose
      this.poseModel = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      this.poseModel.setOptions({
        modelComplexity: 2,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isInitialized = true;
      console.log('✅ Body analysis service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize body analysis:', error);
      throw new Error('Failed to initialize body analysis service');
    }
  }

  async analyzeBodyFromImage(imageElement: HTMLImageElement): Promise<{
    keypoints: PoseKeypoints;
    measurements: BodyMeasurements;
    bodyShape: string;
    confidence: number;
  }> {
    if (!this.isInitialized || !this.poseModel) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      if (!this.poseModel) {
        reject(new Error('Pose model not initialized'));
        return;
      }

      this.poseModel.onResults((results) => {
        try {
          if (!results.poseLandmarks || results.poseLandmarks.length === 0) {
            reject(new Error('No pose detected in image'));
            return;
          }

          const keypoints = this.extractKeypoints(results.poseLandmarks);
          const measurements = this.calculateMeasurements(keypoints, imageElement);
          const bodyShape = this.determineBodyShape(measurements);
          const confidence = this.calculateConfidence(results.poseLandmarks);

          resolve({
            keypoints,
            measurements,
            bodyShape,
            confidence
          });
        } catch (error) {
          reject(error);
        }
      });

      // Send image to pose detection
      this.poseModel.send({ image: imageElement });
    });
  }

  private extractKeypoints(landmarks: any[]): PoseKeypoints {
    const getPoint = (index: number) => ({
      x: landmarks[index]?.x || 0,
      y: landmarks[index]?.y || 0,
      visibility: landmarks[index]?.visibility || 0
    });

    return {
      nose: getPoint(0),
      leftShoulder: getPoint(11),
      rightShoulder: getPoint(12),
      leftElbow: getPoint(13),
      rightElbow: getPoint(14),
      leftWrist: getPoint(15),
      rightWrist: getPoint(16),
      leftHip: getPoint(23),
      rightHip: getPoint(24),
      leftKnee: getPoint(25),
      rightKnee: getPoint(26),
      leftAnkle: getPoint(27),
      rightAnkle: getPoint(28)
    };
  }

  private calculateMeasurements(keypoints: PoseKeypoints, imageElement: HTMLImageElement): BodyMeasurements {
    const imageWidth = imageElement.naturalWidth;
    const imageHeight = imageElement.naturalHeight;

    // Calculate distances in pixels, then convert to real measurements
    const pixelToRealRatio = this.estimatePixelToRealRatio(keypoints, imageHeight);

    const shoulderWidth = this.calculateDistance(keypoints.leftShoulder, keypoints.rightShoulder) * pixelToRealRatio;
    const hipWidth = this.calculateDistance(keypoints.leftHip, keypoints.rightHip) * pixelToRealRatio;
    
    // Estimate chest and waist based on shoulder and hip measurements
    const chestWidth = shoulderWidth * 0.85;
    const waistWidth = shoulderWidth * 0.7;

    // Calculate height from head to feet
    const bodyHeight = this.calculateDistance(keypoints.nose, {
      x: (keypoints.leftAnkle.x + keypoints.rightAnkle.x) / 2,
      y: (keypoints.leftAnkle.y + keypoints.rightAnkle.y) / 2,
      visibility: 1
    }) * pixelToRealRatio;

    // Calculate arm and leg lengths
    const armLength = (
      this.calculateDistance(keypoints.leftShoulder, keypoints.leftWrist) +
      this.calculateDistance(keypoints.rightShoulder, keypoints.rightWrist)
    ) / 2 * pixelToRealRatio;

    const legLength = (
      this.calculateDistance(keypoints.leftHip, keypoints.leftAnkle) +
      this.calculateDistance(keypoints.rightHip, keypoints.rightAnkle)
    ) / 2 * pixelToRealRatio;

    return {
      shoulders: Math.round(shoulderWidth),
      chest: Math.round(chestWidth),
      waist: Math.round(waistWidth),
      hips: Math.round(hipWidth),
      height: Math.round(bodyHeight),
      armLength: Math.round(armLength),
      legLength: Math.round(legLength)
    };
  }

  private calculateDistance(point1: any, point2: any): number {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
    );
  }

  private estimatePixelToRealRatio(keypoints: PoseKeypoints, imageHeight: number): number {
    // Estimate based on average human proportions
    // Head height is typically 1/8 of total body height
    const headToShoulderDistance = this.calculateDistance(keypoints.nose, {
      x: (keypoints.leftShoulder.x + keypoints.rightShoulder.x) / 2,
      y: (keypoints.leftShoulder.y + keypoints.rightShoulder.y) / 2,
      visibility: 1
    });

    // Average head height is about 23cm
    const estimatedHeadHeight = 23;
    const pixelsPerCm = headToShoulderDistance / estimatedHeadHeight;
    
    return 1 / pixelsPerCm;
  }

  private determineBodyShape(measurements: BodyMeasurements): string {
    const shoulderToHipRatio = measurements.shoulders / measurements.hips;
    const waistToHipRatio = measurements.waist / measurements.hips;
    const waistToShoulderRatio = measurements.waist / measurements.shoulders;

    if (shoulderToHipRatio > 1.05) {
      return 'inverted-triangle';
    } else if (shoulderToHipRatio < 0.95) {
      return 'pear';
    } else if (waistToHipRatio < 0.75 && waistToShoulderRatio < 0.75) {
      return 'hourglass';
    } else if (waistToShoulderRatio > 0.85) {
      return 'apple';
    } else {
      return 'rectangle';
    }
  }

  private calculateConfidence(landmarks: any[]): number {
    // Calculate average visibility of key landmarks
    const keyLandmarkIndices = [11, 12, 23, 24]; // Shoulders and hips
    const visibilities = keyLandmarkIndices.map(i => landmarks[i]?.visibility || 0);
    const avgVisibility = visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
    
    return Math.min(avgVisibility, 0.95);
  }
}

export const bodyAnalysisService = new BodyAnalysisService();