
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { LocationResult, MapPerspective, ArtStyle, GroundingChunk, StyleRecommendation, ImageQuality } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const findLocationData = async (query: string, userLat?: number, userLon?: number): Promise<LocationResult> => {
  const ai = getClient();
  
  // Removed retrivalConfig/latLng as we are relying on Search Grounding which is broader
  // and less dependent on specific coordinate binding for the "Maps" tool.

  // Using only googleSearch allows for visual descriptions without Maps API dependencies
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `I need to generate a custom 3D visual map of a location.
    First, identify the specific location for this query: "${query}".
    
    Use Google Search to find visual details about its appearance, key landmarks, colors, and atmosphere.
    
    Provide a response that describes the location visually. Focus on architecture, environment, and distinct features that would be visible in a 3D render.
    `,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];
  
  // Extract a plausible name from web grounding or default to query.
  const searchChunk = groundingChunks.find(c => c.web?.title);
  const name = searchChunk?.web?.title || query;

  return {
    name,
    description: response.text || "No description available.",
    rawText: response.text || "",
    groundingChunks
  };
};

export const getStyleRecommendation = async (locationName: string, description: string): Promise<StyleRecommendation> => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Based on the location "${locationName}" and its visual description below, recommend the best "Visual Perspective" and "Art Style" for a cool 3D map render.
    
    Location Description:
    "${description}"
    
    Available Perspectives: ${Object.values(MapPerspective).join(', ')}
    Available Art Styles: ${Object.values(ArtStyle).join(', ')}
    
    Rules:
    1. Cyberpunk fits modern cities with neon or nightlife (e.g., Tokyo, Times Square).
    2. Steampunk fits industrial or Victorian era locations (e.g., London, factories).
    3. Sketch/Blueprint fits historical or structural landmarks.
    4. Low Poly or Origami fits playful or abstract scenes.
    5. Realistic fits nature or grand landscapes.
    6. Synthwave fits retro or beach vibes (e.g. Miami).
    7. Provide a short, punchy reasoning for your choice.
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          perspective: { 
            type: Type.STRING, 
            enum: Object.values(MapPerspective) 
          },
          style: { 
            type: Type.STRING, 
            enum: Object.values(ArtStyle) 
          },
          reasoning: { 
            type: Type.STRING 
          }
        },
        required: ["perspective", "style", "reasoning"]
      }
    }
  });

  if (!response.text) {
    throw new Error("No recommendation returned");
  }

  return JSON.parse(response.text) as StyleRecommendation;
};

export const generateMapVisual = async (
  locationName: string, 
  description: string, 
  perspective: MapPerspective,
  style: ArtStyle,
  customStylePrompt?: string,
  quality: ImageQuality = ImageQuality.HIGH
): Promise<string> => {
  const ai = getClient();
  
  let visualPrompt = "";
  
  // Define Perspective behavior
  switch (perspective) {
    case MapPerspective.AERIAL:
      visualPrompt += "High-angle drone photography view, top-down aerial perspective looking down at the location. ";
      break;
    case MapPerspective.STREET:
      visualPrompt += "Eye-level street view photography, immersive perspective from the ground looking at the location. ";
      break;
    case MapPerspective.ISOMETRIC:
      visualPrompt += "Isometric projection, 3D game map style, diorama, tilt-shift miniature effect. ";
      break;
  }

  // Define Style behavior
  if (style === ArtStyle.CUSTOM && customStylePrompt) {
    visualPrompt += `${customStylePrompt}. `;
  } else {
    switch (style) {
      case ArtStyle.REALISTIC:
        visualPrompt += "Hyper-realistic, unreal engine 5 render, 8k resolution, detailed textures, cinematic lighting, photorealism. ";
        break;
      case ArtStyle.CYBERPUNK:
        visualPrompt += "Cyberpunk aesthetic, neon lights, night time, rain-slicked surfaces, futuristic hologram overlays, sci-fi atmosphere. ";
        break;
      case ArtStyle.CLAY:
        visualPrompt += "Claymation style, plasticine textures, soft rounded edges, miniature lighting, stop-motion look, vibrant colors. ";
        break;
      case ArtStyle.SKETCH:
        visualPrompt += "Architectural blueprint sketch, white lines on blue paper, technical drawing style, precise lines, wireframe. ";
        break;
      case ArtStyle.VOXEL:
        visualPrompt += "Voxel art style, 3D pixels, minecraft-like aesthetic, blocky but detailed, bright colors, 8-bit 3D. ";
        break;
      case ArtStyle.LOW_POLY:
        visualPrompt += "Low poly 3D art, flat shading, geometric shapes, minimalist details, clean sharp edges, vibrant pastel colors. ";
        break;
      case ArtStyle.ORIGAMI:
         visualPrompt += "Origami papercraft style, folded paper textures, layered paper art, craft aesthetic, soft shadows, diorama look. ";
         break;
      case ArtStyle.STEAMPUNK:
        visualPrompt += "Steampunk aesthetic, brass and copper gears, victorian architecture, industrial steam pipes, mechanical details, sepia tones. ";
        break;
      case ArtStyle.WATERCOLOR:
        visualPrompt += "Watercolor painting style, soft brush strokes, paint splatter, artistic, dreamy atmosphere, wet-on-wet technique. ";
        break;
      case ArtStyle.SYNTHWAVE:
        visualPrompt += "Synthwave aesthetic, retro 80s grid, purple and magenta neon, sunset gradient, vaporwave style, digital retro. ";
        break;
      case ArtStyle.NOIR:
        visualPrompt += "Film Noir style, high contrast black and white, dramatic shadows, moody atmosphere, detective movie aesthetic, volumetric fog. ";
        break;
    }
  }

  // Add quality-specific keywords for Ultra
  if (quality === ImageQuality.ULTRA) {
    visualPrompt += "Masterpiece, award-winning photography, highly detailed, 8k, raytracing. ";
  }

  const finalPrompt = `Create a ${visualPrompt} image of ${locationName}. 
  
  Visual Context based on real-world data: ${description}. 
  
  Ensure the image is high quality and coherent. No text overlays.`;

  if (quality === ImageQuality.STANDARD) {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: finalPrompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      return `data:image/jpeg;base64,${part.inlineData.data}`;
    }
    throw new Error("Failed to generate image with Standard quality");
  } else {
    // High or Ultra
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '16:9',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      throw new Error("Failed to generate image with High/Ultra quality");
    }

    return `data:image/jpeg;base64,${base64ImageBytes}`;
  }
};
