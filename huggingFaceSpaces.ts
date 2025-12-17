import axios from 'axios';

interface SpaceConfig {
  name: string;
  sdk: 'gradio' | 'streamlit' | 'docker';
  apiEndpoint?: string;
  hfToken?: string;
}

interface TryOnRequest {
  personImage: string;
  garmentImage: string;
  category?: 'upper_body' | 'lower_body' | 'dresses';
  denoisingSteps?: number;
  seed?: number;
}

interface TryOnResult {
  output: string;
  processingTime: number;
  spaceUsed: string;
}

class HuggingFaceSpacesService {
  private hfToken: string | null = null;
  private spaces: Map<string, SpaceConfig> = new Map();

  constructor() {
    this.hfToken = import.meta.env.VITE_HUGGINGFACE_API_KEY || null;
    this.initializeSpaces();
  }

  private initializeSpaces() {
    this.spaces.set('idm-vton', {
      name: 'yisol/IDM-VTON',
      sdk: 'gradio',
      apiEndpoint: 'https://yisol-idm-vton.hf.space/api/predict',
      hfToken: this.hfToken || undefined
    });

    this.spaces.set('ootd', {
      name: 'levihsu/OOTDiffusion',
      sdk: 'gradio',
      apiEndpoint: 'https://levihsu-ootdiffusion.hf.space/api/predict',
      hfToken: this.hfToken || undefined
    });

    this.spaces.set('cloth-segmentation', {
      name: 'mattmdjaga/segformer_b2_clothes',
      sdk: 'gradio',
      apiEndpoint: 'https://mattmdjaga-segformer-b2-clothes.hf.space/api/predict',
      hfToken: this.hfToken || undefined
    });
  }

  async quickPrototype(
    spaceName: 'idm-vton' | 'ootd' | 'cloth-segmentation',
    request: TryOnRequest
  ): Promise<TryOnResult> {
    const startTime = Date.now();
    const space = this.spaces.get(spaceName);

    if (!space) {
      throw new Error(`Space ${spaceName} not configured`);
    }

    try {
      const result = await this.callGradioSpace(space, request);

      return {
        output: result.output,
        processingTime: Date.now() - startTime,
        spaceUsed: space.name
      };
    } catch (error) {
      console.error(`Failed to call ${spaceName}:`, error);
      throw new Error(`Hugging Face Space ${spaceName} failed to process request`);
    }
  }

  private async callGradioSpace(space: SpaceConfig, request: TryOnRequest): Promise<any> {
    if (!space.apiEndpoint) {
      throw new Error('API endpoint not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (space.hfToken) {
      headers['Authorization'] = `Bearer ${space.hfToken}`;
    }

    const response = await axios.post(
      space.apiEndpoint,
      {
        data: [
          request.personImage,
          request.garmentImage,
          request.category || 'upper_body',
          request.denoisingSteps || 20,
          request.seed || 42
        ]
      },
      { headers, timeout: 120000 }
    );

    if (response.data.error) {
      throw new Error(response.data.error);
    }

    return {
      output: response.data.data?.[0] || response.data.output,
      metadata: response.data
    };
  }

  async processWithIDMVTON(personImage: string, garmentImage: string): Promise<TryOnResult> {
    return this.quickPrototype('idm-vton', {
      personImage,
      garmentImage,
      category: 'upper_body',
      denoisingSteps: 20,
      seed: 42
    });
  }

  async processWithOOTD(personImage: string, garmentImage: string): Promise<TryOnResult> {
    return this.quickPrototype('ootd', {
      personImage,
      garmentImage,
      category: 'upper_body',
      denoisingSteps: 30,
      seed: 42
    });
  }

  async segmentClothing(clothingImage: string): Promise<{ segmentedImage: string; masks: any }> {
    const startTime = Date.now();
    const space = this.spaces.get('cloth-segmentation');

    if (!space || !space.apiEndpoint) {
      throw new Error('Cloth segmentation space not configured');
    }

    try {
      const response = await axios.post(
        space.apiEndpoint,
        { data: [clothingImage] },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(space.hfToken && { Authorization: `Bearer ${space.hfToken}` })
          },
          timeout: 60000
        }
      );

      return {
        segmentedImage: response.data.data?.[0] || '',
        masks: response.data.data?.[1] || {}
      };
    } catch (error) {
      console.error('Cloth segmentation failed:', error);
      throw new Error('Failed to segment clothing');
    }
  }

  async compareModels(
    personImage: string,
    garmentImage: string
  ): Promise<{ idmVton: TryOnResult; ootd: TryOnResult; comparison: any }> {
    try {
      const [idmResult, ootdResult] = await Promise.all([
        this.processWithIDMVTON(personImage, garmentImage).catch(e => ({
          output: '',
          processingTime: 0,
          spaceUsed: 'idm-vton',
          error: e.message
        })),
        this.processWithOOTD(personImage, garmentImage).catch(e => ({
          output: '',
          processingTime: 0,
          spaceUsed: 'ootd',
          error: e.message
        }))
      ]);

      return {
        idmVton: idmResult,
        ootd: ootdResult,
        comparison: {
          fasterModel: idmResult.processingTime < ootdResult.processingTime ? 'idm-vton' : 'ootd',
          timeDifference: Math.abs(idmResult.processingTime - ootdResult.processingTime)
        }
      };
    } catch (error) {
      console.error('Model comparison failed:', error);
      throw error;
    }
  }

  async getSpaceStatus(spaceName: string): Promise<{ status: string; queue: number }> {
    const space = this.spaces.get(spaceName);

    if (!space) {
      return { status: 'unknown', queue: 0 };
    }

    try {
      const apiUrl = `https://huggingface.co/api/spaces/${space.name}`;
      const response = await axios.get(apiUrl, {
        headers: this.hfToken ? { Authorization: `Bearer ${this.hfToken}` } : {}
      });

      return {
        status: response.data.runtime?.stage || 'unknown',
        queue: response.data.runtime?.queue || 0
      };
    } catch (error) {
      console.warn(`Failed to get status for ${spaceName}:`, error);
      return { status: 'unknown', queue: 0 };
    }
  }
}

export const huggingFaceSpaces = new HuggingFaceSpacesService();
export default huggingFaceSpaces;
