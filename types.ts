
export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
    placeId?: string;
    placeAnswerSources?: {
      reviewSnippets?: {
        snippet: string;
        author: string;
      }[];
    };
  };
}

export interface LocationResult {
  name: string;
  description: string;
  coordinates?: MapPoint;
  groundingChunks: GroundingChunk[];
  rawText: string;
}

export enum MapPerspective {
  AERIAL = 'Aerial / Drone',
  STREET = 'Street View',
  ISOMETRIC = 'Isometric 3D'
}

export enum ArtStyle {
  REALISTIC = 'Photorealistic',
  CYBERPUNK = 'Cyberpunk',
  CLAY = 'Claymation',
  SKETCH = 'Blueprint',
  VOXEL = 'Voxel / 8-bit',
  LOW_POLY = 'Low Poly',
  ORIGAMI = 'Origami / Papercraft',
  STEAMPUNK = 'Steampunk',
  WATERCOLOR = 'Watercolor',
  SYNTHWAVE = 'Synthwave / Retro 80s',
  NOIR = 'Film Noir',
  CUSTOM = 'Custom'
}

export enum ImageQuality {
  STANDARD = 'Standard (Fast)',
  HIGH = 'High (Detailed)',
  ULTRA = 'Ultra (Best)'
}

export interface StyleRecommendation {
  perspective: MapPerspective;
  style: ArtStyle;
  reasoning: string;
}

export interface GenerationRequest {
  location: string;
  perspective: MapPerspective;
  style: ArtStyle;
  quality: ImageQuality;
  customStyle?: string;
}
