import { GarmentType, PrintLocation, TShirtSize, GarmentMeasurements } from '@/types/wizard';

// T-shirt measurements by size (in inches)
// Width (Chest): Side seam to side seam, 1 inch below armhole
// Length (Body): HPS (shoulder seam meets collar) to bottom hem
// Sleeve (Center Back): Center back neck over shoulder to cuff
export const T_SHIRT_MEASUREMENTS: Record<TShirtSize, GarmentMeasurements> = {
  'XS': { widthChest: 16, lengthBody: 26.5, sleeveLength: 15 },
  'S': { widthChest: 18, lengthBody: 28, sleeveLength: 15.75 },
  'M': { widthChest: 20, lengthBody: 29.5, sleeveLength: 17 },
  'L': { widthChest: 22, lengthBody: 30.5, sleeveLength: 18.5 },
  'XL': { widthChest: 24, lengthBody: 31.5, sleeveLength: 19.5 },
  '2XL': { widthChest: 26, lengthBody: 32.5, sleeveLength: 20.75 },
  '3XL': { widthChest: 28, lengthBody: 33.5, sleeveLength: 22 },
  '4XL': { widthChest: 30, lengthBody: 34.5, sleeveLength: 23 },
};

// Base size for mockup scaling (Medium)
const BASE_SIZE: TShirtSize = 'M';

// Calculate scale factor for a given garment size relative to base size
export function getGarmentScaleFactor(garmentType: GarmentType, size: TShirtSize | null): number {
  if (garmentType !== 'tshirt' || !size) return 1.0;
  
  const baseMeasurements = T_SHIRT_MEASUREMENTS[BASE_SIZE];
  const sizeMeasurements = T_SHIRT_MEASUREMENTS[size];
  
  // Use chest width as primary scaling factor (most relevant for front/back prints)
  return sizeMeasurements.widthChest / baseMeasurements.widthChest;
}

// Product view type - each garment can have multiple views
export type ProductView = 'front' | 'back' | 'left' | 'right';

// Maps print locations to which product view they appear on
export const LOCATION_TO_VIEW: Record<PrintLocation, ProductView> = {
  'front-chest': 'front',
  'front-full': 'front',
  'pocket': 'front',
  'back-full': 'back',
  'back-upper': 'back',
  'left-sleeve': 'left',
  'right-sleeve': 'right',
  'leg-left': 'front',
  'leg-right': 'front',
};

// Location config for positioning and sizing
export interface LocationConfig {
  position: { x: number; y: number };
  maxWidth: number;  // percentage of mockup width (at base size M)
  maxHeight: number; // percentage of mockup height (at base size M)
  scaleWithGarment?: boolean; // if true, scales with garment size (default: true)
  perspective?: {
    scaleX?: number;
    scaleY?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    skewX?: number;
    skewY?: number;
  };
}

// Get scaled dimensions for a location based on garment size
export function getScaledLocationConfig(
  config: LocationConfig,
  garmentType: GarmentType,
  garmentSize: TShirtSize | null
): LocationConfig {
  const scaleWithGarment = config.scaleWithGarment !== false; // default true
  
  if (!scaleWithGarment) return config;
  
  const scaleFactor = getGarmentScaleFactor(garmentType, garmentSize);
  
  return {
    ...config,
    maxWidth: config.maxWidth * scaleFactor,
    maxHeight: config.maxHeight * scaleFactor,
  };
}

// Product view with image and locations
export interface MockupView {
  imagePath: string;
  name: string;
  locations: Partial<Record<PrintLocation, LocationConfig>>;
}

// Complete mockup config with multiple views
export interface MockupConfig {
  views: Partial<Record<ProductView, MockupView>>;
}

// SVG images for each garment view (fallback placeholders)
// TODO: Replace with AI-generated images in /public/mockups/
const TSHIRT_FRONT = '/mockups/tshirt-front.png';
const TSHIRT_BACK = '/mockups/tshirt-back.png';
const TSHIRT_LEFT = '/mockups/tshirt-left.png';
const TSHIRT_RIGHT = '/mockups/tshirt-right.png';

const HOODIE_FRONT = '/mockups/hoodie-front.png';
const HOODIE_BACK = '/mockups/hoodie-back.png';
const HOODIE_LEFT = '/mockups/hoodie-left.png';
const HOODIE_RIGHT = '/mockups/hoodie-right.png';

const LONGSLEEVE_FRONT = '/mockups/longsleeve-front.png';
const LONGSLEEVE_BACK = '/mockups/longsleeve-back.png';
const LONGSLEEVE_LEFT = '/mockups/longsleeve-left.png';
const LONGSLEEVE_RIGHT = '/mockups/longsleeve-right.png';

const TANK_FRONT = '/mockups/tank-front.png';
const TANK_BACK = '/mockups/tank-back.png';

const TOTE_FRONT = '/mockups/tote-front.png';
const HAT_FRONT = '/mockups/hat-front.png';

// Fallback SVG placeholders (will be used until real images are added)
const SVG_TSHIRT_FRONT = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InRzaGlydC1ncmFkIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj48c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZjNmNGY2O3N0b3Atb3BhY2l0eToxIiAvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2UyZThmMDtzdG9wLW9wYWNpdHk6MSIgLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0idXJsKCN0c2hpcnQtZ3JhZCkiLz48cGF0aCBkPSJNIDgwIDUwIEwgODAgNDUwIEwgMzIwIDQ1MCBMIDMYMCA1MCBMIDM1MCA1MCBMIDM4MCA4MCBMIDM4MCAxNDAgTCAzNTAgMTQwIEwgMzUwIDE2MCBMIDMYMCAXNJAGTCAZMJAGNTAGTCA4MCA1MCBMIDGWCA4MCAxNjAgTCA1MCAxNjAgTCA1MCAxNDAgTCAyMCAxNDAgTCAyMCA4MCBMIDU1MCA1MCBaIiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjxlbGxpcHNlIGN4PSIyMDAiIGN5PSI1NSIgcng9IjMwIiByeT0iMjAiIGZpbGw9IiNmM2Y0ZjYiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSA1MCA1MCBMIDI1IDgwIEwgMjAgMTQwIEwgNTAgMTQwIFoiIGZpbGw9IiNmM2Y0ZjYiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTSAzNTAgNTAgTCAzNzUgODAgTCAzODAgMTQwIEwgMzUwIDE0MCBaIiBmaWxsPSIjZjNmNGY2IiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==';

export const MOCKUP_CONFIGS: Record<GarmentType, MockupConfig> = {
  tshirt: {
    views: {
      front: {
        imagePath: TSHIRT_FRONT,
        name: 'Front View',
        locations: {
          'front-chest': {
            position: { x: 50, y: 28 },
            maxWidth: 25,
            maxHeight: 25,
            perspective: { scaleY: 0.95 }
          },
          'front-full': {
            position: { x: 50, y: 50 },
            maxWidth: 45,
            maxHeight: 55,
            perspective: { scaleY: 0.98 }
          },
          'pocket': {
            position: { x: 35, y: 35 },
            maxWidth: 15,
            maxHeight: 15,
          },
        }
      },
      back: {
        imagePath: TSHIRT_BACK,
        name: 'Back View',
        locations: {
          'back-full': {
            position: { x: 50, y: 50 },
            maxWidth: 45,
            maxHeight: 55,
            perspective: { scaleY: 0.98 }
          },
          'back-upper': {
            position: { x: 50, y: 22 },
            maxWidth: 38,
            maxHeight: 18,
          },
        }
      },
      left: {
        imagePath: TSHIRT_LEFT,
        name: 'Left Sleeve',
        locations: {
          'left-sleeve': {
            position: { x: 45, y: 35 },
            maxWidth: 35,
            maxHeight: 40,
            perspective: { scaleX: 0.8 }
          }
        }
      },
      right: {
        imagePath: TSHIRT_RIGHT,
        name: 'Right Sleeve',
        locations: {
          'right-sleeve': {
            position: { x: 55, y: 35 },
            maxWidth: 35,
            maxHeight: 40,
            perspective: { scaleX: 0.8 }
          }
        }
      }
    }
  },
  hoodie: {
    views: {
      front: {
        imagePath: HOODIE_FRONT,
        name: 'Front View',
        locations: {
          'front-chest': {
            position: { x: 50, y: 25 },
            maxWidth: 25,
            maxHeight: 25,
            perspective: { scaleY: 0.95 }
          },
          'front-full': {
            position: { x: 50, y: 40 },
            maxWidth: 45,
            maxHeight: 42,
            perspective: { scaleY: 0.98 }
          },
          'pocket': {
            position: { x: 50, y: 56 },
            maxWidth: 22,
            maxHeight: 22,
            perspective: { scaleY: 1.05 }
          },
        }
      },
      back: {
        imagePath: HOODIE_BACK,
        name: 'Back View',
        locations: {
          'back-full': {
            position: { x: 50, y: 50 },
            maxWidth: 45,
            maxHeight: 55,
            perspective: { scaleY: 0.98 }
          },
          'back-upper': {
            position: { x: 50, y: 20 },
            maxWidth: 38,
            maxHeight: 18,
          },
        }
      },
      left: {
        imagePath: HOODIE_LEFT,
        name: 'Left Sleeve',
        locations: {
          'left-sleeve': {
            position: { x: 45, y: 35 },
            maxWidth: 35,
            maxHeight: 40,
            perspective: { scaleX: 0.75 }
          }
        }
      },
      right: {
        imagePath: HOODIE_RIGHT,
        name: 'Right Sleeve',
        locations: {
          'right-sleeve': {
            position: { x: 55, y: 35 },
            maxWidth: 35,
            maxHeight: 40,
            perspective: { scaleX: 0.75 }
          }
        }
      }
    }
  },
  longsleeve: {
    views: {
      front: {
        imagePath: LONGSLEEVE_FRONT,
        name: 'Front View',
        locations: {
          'front-chest': {
            position: { x: 50, y: 28 },
            maxWidth: 25,
            maxHeight: 25,
            perspective: { scaleY: 0.95 }
          },
          'front-full': {
            position: { x: 50, y: 50 },
            maxWidth: 45,
            maxHeight: 55,
            perspective: { scaleY: 0.98 }
          },
        }
      },
      back: {
        imagePath: LONGSLEEVE_BACK,
        name: 'Back View',
        locations: {
          'back-full': {
            position: { x: 50, y: 50 },
            maxWidth: 45,
            maxHeight: 55,
            perspective: { scaleY: 0.98 }
          },
          'back-upper': {
            position: { x: 50, y: 22 },
            maxWidth: 38,
            maxHeight: 18,
          },
        }
      },
      left: {
        imagePath: LONGSLEEVE_LEFT,
        name: 'Left Sleeve',
        locations: {
          'left-sleeve': {
            position: { x: 45, y: 35 },
            maxWidth: 35,
            maxHeight: 45,
            perspective: { scaleX: 0.7 }
          }
        }
      },
      right: {
        imagePath: LONGSLEEVE_RIGHT,
        name: 'Right Sleeve',
        locations: {
          'right-sleeve': {
            position: { x: 55, y: 35 },
            maxWidth: 35,
            maxHeight: 45,
            perspective: { scaleX: 0.7 }
          }
        }
      }
    }
  },
  tank: {
    views: {
      front: {
        imagePath: TANK_FRONT,
        name: 'Front View',
        locations: {
          'front-chest': {
            position: { x: 50, y: 28 },
            maxWidth: 22,
            maxHeight: 22,
            perspective: { scaleY: 0.95 }
          },
          'front-full': {
            position: { x: 50, y: 50 },
            maxWidth: 42,
            maxHeight: 52,
            perspective: { scaleY: 0.98 }
          },
        }
      },
      back: {
        imagePath: TANK_BACK,
        name: 'Back View',
        locations: {
          'back-full': {
            position: { x: 50, y: 50 },
            maxWidth: 42,
            maxHeight: 52,
            perspective: { scaleY: 0.98 }
          },
          'back-upper': {
            position: { x: 50, y: 22 },
            maxWidth: 35,
            maxHeight: 15,
          },
        }
      }
    }
  },
  tote: {
    views: {
      front: {
        imagePath: TOTE_FRONT,
        name: 'Front View',
        locations: {
          'front-full': {
            position: { x: 50, y: 52 },
            maxWidth: 50,
            maxHeight: 60,
            perspective: { scaleY: 1.02 }
          },
        }
      }
    }
  },
  hat: {
    views: {
      front: {
        imagePath: HAT_FRONT,
        name: 'Front View',
        locations: {
          'front-chest': {
            position: { x: 50, y: 40 },
            maxWidth: 35,
            maxHeight: 25,
            perspective: { scaleY: 0.85, skewY: -2 }
          },
        }
      }
    }
  }
};

export function getPerspectiveTransform(perspective?: LocationConfig['perspective']): string {
  if (!perspective) return 'none';
  
  const transforms: string[] = [];
  
  if (perspective.scaleX) transforms.push(`scaleX(${perspective.scaleX})`);
  if (perspective.scaleY) transforms.push(`scaleY(${perspective.scaleY})`);
  if (perspective.rotateX) transforms.push(`rotateX(${perspective.rotateX}deg)`);
  if (perspective.rotateY) transforms.push(`rotateY(${perspective.rotateY}deg)`);
  if (perspective.rotateZ) transforms.push(`rotateZ(${perspective.rotateZ}deg)`);
  if (perspective.skewX) transforms.push(`skewX(${perspective.skewX}deg)`);
  if (perspective.skewY) transforms.push(`skewY(${perspective.skewY}deg)`);
  
  return transforms.length > 0 ? transforms.join(' ') : 'none';
}
