# Garment Measurements & Scaling System

## Overview
The DTF Size Wizard now includes a sophisticated measurement-based scaling system that ensures DTF transfer previews are accurately sized relative to the selected garment size.

## Features Implemented

### 1. T-Shirt Size Measurements
All standard t-shirt sizes (XS-4XL) are now defined with actual measurements in inches:

| Size | Width (Chest) | Length (Body) | Sleeve Length |
|------|---------------|---------------|---------------|
| XS   | 16"           | 26.5"         | 15"           |
| S    | 18"           | 28"           | 15.75"        |
| M    | 20"           | 29.5"         | 17"           |
| L    | 22"           | 30.5"         | 18.5"         |
| XL   | 24"           | 31.5"         | 19.5"         |
| 2XL  | 26"           | 32.5"         | 20.75"        |
| 3XL  | 28"           | 33.5"         | 22"           |
| 4XL  | 30"           | 34.5"         | 23"           |

**Measurement Definitions:**
- **Width (Chest)**: Measured from side seam to side seam, exactly 1 inch below the armhole
- **Length (Body)**: Measured from the Highest Point of Shoulder (HPS) where shoulder seam meets collar, straight down to bottom hem
- **Sleeve Length (Center Back)**: Measured from center of back of neck, over shoulder, down to end of sleeve cuff

### 2. Size Selector UI
- **Location**: Appears at the top of the Location Selection step (Step 3) for t-shirts only
- **Design**: Beautiful gradient card with Ruler icon and measurement display
- **Interactive**: Buttons for each size (XS-4XL) with hover tooltips showing all measurements
- **Real-time Info**: Selected size displays all three measurements in a highlighted panel

### 3. Proportional Scaling Algorithm
**Base Size**: Medium (M) - 20" chest width
**Scale Factor Formula**: `scaleFactor = selectedSize.widthChest / mediumSize.widthChest`

Example scale factors:
- XS: 16/20 = 0.80 (designs appear 80% size)
- S: 18/20 = 0.90 (designs appear 90% size)
- M: 20/20 = 1.00 (baseline)
- L: 22/20 = 1.10 (designs appear 110% size)
- XL: 24/20 = 1.20 (designs appear 120% size)
- 2XL: 26/20 = 1.30 (designs appear 130% size)
- 3XL: 28/20 = 1.40 (designs appear 140% size)
- 4XL: 30/20 = 1.50 (designs appear 150% size)

### 4. Technical Implementation

#### New Type Definitions (`src/types/wizard.ts`)
```typescript
export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL';

export interface GarmentMeasurements {
  widthChest: number;      // inches
  lengthBody: number;      // inches
  sleeveLength: number;    // inches
}

// Added to WizardState
garmentSize: TShirtSize | null;
```

#### Measurement Data (`src/lib/mockup-configs.ts`)
```typescript
export const T_SHIRT_MEASUREMENTS: Record<TShirtSize, GarmentMeasurements>;
export function getGarmentScaleFactor(garmentType: GarmentType, size: TShirtSize | null): number;
export function getScaledLocationConfig(config: LocationConfig, garmentType: GarmentType, garmentSize: TShirtSize | null): LocationConfig;
```

#### Component Updates
- **dtf-size-wizard.tsx**: Added `garmentSize` to state, defaults to 'M' for t-shirts
- **location-selection-step.tsx**: Added size selector UI with measurements display
- **realistic-product-mockup.tsx**: Uses scaled location configs for accurate preview sizing

## How It Works

1. **User Selects T-Shirt**: Garment size defaults to Medium (M)
2. **User Changes Size**: Click any size button (XS-4XL)
3. **Scale Factor Calculated**: Based on chest width ratio vs Medium
4. **Preview Updates**: All design overlays scale proportionally
5. **Accurate Visualization**: User sees true-to-scale representation

## Design Rationale

- **Chest Width as Primary Metric**: Most relevant for front/back print sizing
- **Medium as Base**: Industry standard baseline size
- **Linear Scaling**: Simple, predictable, accurate for DTF applications
- **T-Shirt Only (For Now)**: System extensible to hoodies, longsleeve, etc.

## Future Enhancements

- [ ] Add measurements for hoodies (different proportions)
- [ ] Add measurements for longsleeve shirts
- [ ] Per-location scaling rules (e.g., sleeve prints scale differently)
- [ ] Import custom measurement profiles
- [ ] Save preferred sizes per customer

## User Benefits

1. **Accurate Previews**: See exactly how designs will look on different sizes
2. **Better Decisions**: Choose optimal DTF transfer sizes
3. **Reduced Waste**: Less trial-and-error with sizing
4. **Professional Tool**: Industry-standard measurement methodology
5. **Confidence**: Know the design will fit properly before ordering

## Developer Notes

- All measurements stored in inches (imperial system as requested)
- Scale factor applies to `maxWidth` and `maxHeight` in location configs
- Position percentages remain constant (designs stay centered)
- Perspective transforms (skew, rotation) unaffected by scaling
- System designed for easy extension to other garment types
