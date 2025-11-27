// DTF Size Wizard Types
export type GarmentType = 'tshirt' | 'hoodie' | 'tote' | 'hat' | 'longsleeve' | 'tank';

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL';

export interface GarmentMeasurements {
  widthChest: number;      // inches - measured from side seam to side seam
  lengthBody: number;      // inches - measured from HPS to bottom hem
  sleeveLength: number;    // inches - measured from center back neck over shoulder to cuff
}

export type PrintLocation = 
  | 'front-chest'
  | 'front-full'
  | 'back-full'
  | 'back-upper'
  | 'left-sleeve'
  | 'right-sleeve'
  | 'pocket'
  | 'leg-left'
  | 'leg-right';

export interface PrintSize {
  width: number;
  height: number;
}

export interface LocationSelection {
  location: PrintLocation;
  quantity: number;
  recommendedSize: PrintSize;
  customSize?: PrintSize;  // User-adjusted size override
  customPosition?: { x: number; y: number };  // User-adjusted position (percentage)
}

export interface WizardState {
  step: number;
  garmentType: GarmentType | null;
  garmentSize: TShirtSize | null;
  uploadedImage: File | null;
  imagePreviewUrl: string | null;
  selections: LocationSelection[];
}

export interface GarmentOption {
  id: GarmentType;
  name: string;
  icon: string;
  availableLocations: PrintLocation[];
}

export interface LocationInfo {
  id: PrintLocation;
  label: string;
  description: string;
  position: { x: number; y: number }; // Position on mockup (percentage)
}
