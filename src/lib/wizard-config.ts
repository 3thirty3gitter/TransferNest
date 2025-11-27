import { GarmentOption, LocationInfo, PrintLocation, GarmentType, PrintSize, TShirtSize } from '@/types/wizard';
import { getGarmentScaleFactor } from './mockup-configs';

// Garment options available in the wizard
export const GARMENT_OPTIONS: GarmentOption[] = [
  {
    id: 'tshirt',
    name: 'T-Shirt',
    icon: '👕',
    availableLocations: ['front-chest', 'front-full', 'back-full', 'back-upper', 'left-sleeve', 'right-sleeve', 'pocket']
  },
  {
    id: 'hoodie',
    name: 'Hoodie',
    icon: '🧥',
    availableLocations: ['front-chest', 'front-full', 'back-full', 'back-upper', 'left-sleeve', 'right-sleeve', 'pocket']
  },
  {
    id: 'longsleeve',
    name: 'Long Sleeve',
    icon: '👔',
    availableLocations: ['front-chest', 'front-full', 'back-full', 'back-upper', 'left-sleeve', 'right-sleeve']
  },
  {
    id: 'tank',
    name: 'Tank Top',
    icon: '🎽',
    availableLocations: ['front-chest', 'front-full', 'back-full', 'back-upper']
  },
  {
    id: 'tote',
    name: 'Tote Bag',
    icon: '👜',
    availableLocations: ['front-full']
  },
  {
    id: 'hat',
    name: 'Hat',
    icon: '🧢',
    availableLocations: ['front-chest']
  }
];

// Location information with positioning (adjusted for realistic product photos)
export const LOCATION_INFO: Record<PrintLocation, LocationInfo> = {
  'front-chest': {
    id: 'front-chest',
    label: 'Front Chest',
    description: 'Pocket-sized chest placement',
    position: { x: 50, y: 30 }  // Upper chest area
  },
  'front-full': {
    id: 'front-full',
    label: 'Full Front',
    description: 'Large front design',
    position: { x: 50, y: 45 }  // Center of torso
  },
  'back-full': {
    id: 'back-full',
    label: 'Full Back',
    description: 'Large back design',
    position: { x: 50, y: 45 }  // Center of back
  },
  'back-upper': {
    id: 'back-upper',
    label: 'Upper Back',
    description: 'Between shoulders',
    position: { x: 50, y: 20 }  // Upper back/neck area
  },
  'left-sleeve': {
    id: 'left-sleeve',
    label: 'Left Sleeve',
    description: 'Left arm placement',
    position: { x: 20, y: 35 }  // Left arm area
  },
  'right-sleeve': {
    id: 'right-sleeve',
    label: 'Right Sleeve',
    description: 'Right arm placement',
    position: { x: 80, y: 35 }  // Right arm area
  },
  'pocket': {
    id: 'pocket',
    label: 'Pocket',
    description: 'Small pocket design',
    position: { x: 50, y: 55 }  // Lower chest/pocket area
  },
  'leg-left': {
    id: 'leg-left',
    label: 'Left Leg',
    description: 'Left leg placement',
    position: { x: 35, y: 70 }
  },
  'leg-right': {
    id: 'leg-right',
    label: 'Right Leg',
    description: 'Right leg placement',
    position: { x: 65, y: 70 }
  }
};

// Size recommendations based on garment type and location
// Based on industry-standard DTF sizing chart
// Note: Sizes are width-based; height will auto-adjust to maintain aspect ratio
// Base sizes are for Medium (adult) and will be scaled for other sizes
export function getRecommendedSize(
  garmentType: GarmentType, 
  location: PrintLocation, 
  garmentSize: TShirtSize | null = null
): PrintSize {
  const sizeMap: Record<GarmentType, Record<PrintLocation, PrintSize>> = {
    tshirt: {
      'front-chest': { width: 3.5, height: 3.5 },  // Pocket chest size
      'front-full': { width: 9.5, height: 12 },    // Adult Medium standard
      'back-full': { width: 9.5, height: 12 },     // Adult Medium standard
      'back-upper': { width: 10, height: 3.5 },    // Between shoulders
      'left-sleeve': { width: 2.5, height: 3 },
      'right-sleeve': { width: 2.5, height: 3 },
      'pocket': { width: 3.5, height: 3.5 },
      'leg-left': { width: 0, height: 0 },
      'leg-right': { width: 0, height: 0 }
    },
    hoodie: {
      'front-chest': { width: 3.5, height: 3.5 },  // Pocket chest size
      'front-full': { width: 9.5, height: 10 },    // Reduced height due to kangaroo pocket
      'back-full': { width: 9.5, height: 12 },     // Adult Medium standard
      'back-upper': { width: 10, height: 3.5 },    // Between shoulders
      'left-sleeve': { width: 2.5, height: 3 },
      'right-sleeve': { width: 2.5, height: 3 },
      'pocket': { width: 3.5, height: 3.5 },
      'leg-left': { width: 0, height: 0 },
      'leg-right': { width: 0, height: 0 }
    },
    longsleeve: {
      'front-chest': { width: 3.5, height: 3.5 },  // Pocket chest size
      'front-full': { width: 9.5, height: 12 },    // Adult Medium standard
      'back-full': { width: 9.5, height: 12 },     // Adult Medium standard
      'back-upper': { width: 10, height: 3.5 },    // Between shoulders
      'left-sleeve': { width: 2.5, height: 4 },    // Longer for long sleeve
      'right-sleeve': { width: 2.5, height: 4 },   // Longer for long sleeve
      'pocket': { width: 0, height: 0 },
      'leg-left': { width: 0, height: 0 },
      'leg-right': { width: 0, height: 0 }
    },
    tank: {
      'front-chest': { width: 3, height: 3 },      // Smaller for tank
      'front-full': { width: 9, height: 11 },      // Narrower for tank
      'back-full': { width: 9, height: 11 },       // Narrower for tank
      'back-upper': { width: 9, height: 3 },       // Narrower for tank
      'left-sleeve': { width: 0, height: 0 },
      'right-sleeve': { width: 0, height: 0 },
      'pocket': { width: 0, height: 0 },
      'leg-left': { width: 0, height: 0 },
      'leg-right': { width: 0, height: 0 }
    },
    tote: {
      'front-full': { width: 10, height: 12 },     // Standard tote size
      'front-chest': { width: 0, height: 0 },
      'back-full': { width: 0, height: 0 },
      'back-upper': { width: 0, height: 0 },
      'left-sleeve': { width: 0, height: 0 },
      'right-sleeve': { width: 0, height: 0 },
      'pocket': { width: 0, height: 0 },
      'leg-left': { width: 0, height: 0 },
      'leg-right': { width: 0, height: 0 }
    },
    hat: {
      'front-chest': { width: 4.5, height: 2.5 },  // Hat front
      'front-full': { width: 0, height: 0 },
      'back-full': { width: 0, height: 0 },
      'back-upper': { width: 0, height: 0 },
      'left-sleeve': { width: 0, height: 0 },
      'right-sleeve': { width: 0, height: 0 },
      'pocket': { width: 0, height: 0 },
      'leg-left': { width: 0, height: 0 },
      'leg-right': { width: 0, height: 0 }
    }
  };

  const baseSize = sizeMap[garmentType]?.[location] || { width: 12, height: 16 };
  
  // Apply garment size scaling
  const scaleFactor = getGarmentScaleFactor(garmentType, garmentSize);
  
  return {
    width: Math.round(baseSize.width * scaleFactor * 10) / 10,  // Round to 1 decimal
    height: Math.round(baseSize.height * scaleFactor * 10) / 10
  };
}
