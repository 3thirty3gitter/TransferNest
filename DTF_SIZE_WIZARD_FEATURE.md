# DTF Size Wizard Feature

## Overview
The DTF Size Wizard is a friendly, step-by-step interface that helps customers who are new to DTF (Direct-to-Film) printing determine the correct print sizes and quantities for their projects.

## User Flow

### Step 1: Select Garment Type
- Visual cards showing different garment options:
  - T-Shirt 👕
  - Hoodie 🧥
  - Long Sleeve 👔
  - Tank Top 🎽
  - Tote Bag 👜
  - Hat 🧢

### Step 2: Upload Design
- Drag-and-drop or click to upload artwork
- Supports PNG, JPG, SVG formats
- Shows preview of uploaded image
- Option to replace image

### Step 3: Select Locations & Quantities
- **Visual Mockup**: Interactive preview showing the selected garment with clickable location hotspots
- **Location List**: Side panel with all available print locations for the selected garment
- Each location shows:
  - Label and description
  - Recommended print size (in inches)
  - Quantity selector with +/- buttons
- Customer's uploaded design appears on the mockup at selected locations
- Live order summary showing total prints

### Completion
- Wizard converts selections into properly-sized prints
- Uploads design to Firebase Storage
- Creates ManagedImage objects for each location/quantity combination
- Adds all prints directly to the nesting tool
- Shows success message with summary

## Technical Implementation

### New Components
- `DTFSizeWizard` - Main modal component with step navigation
- `GarmentSelectionStep` - Step 1 visual garment selector
- `ImageUploadStep` - Step 2 drag-and-drop image uploader
- `LocationSelectionStep` - Step 3 interactive mockup and location selector
- `WizardSummary` - Order summary sidebar
- `WizardTrigger` - Button to open wizard from nesting tool

### Configuration
- `wizard-config.ts` - Garment options, location definitions, size recommendations
- `wizard-integration.ts` - Utilities to convert wizard output to ManagedImages

### Type Definitions
- `types/wizard.ts` - TypeScript interfaces for wizard state and data structures

## Size Recommendations

The wizard includes pre-configured size recommendations for each garment type and print location:

### T-Shirts
- Front Chest: 12" × 16"
- Full Front: 14" × 18"
- Full Back: 14" × 18"
- Upper Back: 10" × 4"
- Sleeves: 3" × 4"
- Pocket: 4" × 4"

### Hoodies
- Front Chest: 12" × 16"
- Full Front: 14" × 18"
- Full Back: 14" × 18"
- Upper Back: 12" × 5"
- Sleeves: 3" × 5"
- Pocket: 4" × 4"

### Tote Bags
- Front: 12" × 14"

### Hats
- Front: 5" × 3"

*Other garment types have similar optimized recommendations*

## Integration

### Entry Point
The wizard is accessible via a prominent button in the Image Manager section of the nesting tool:
- Button label: "Need help choosing sizes?"
- Styled with gradient (purple to blue) to stand out
- Includes magic wand icon 🪄

### Output
When the wizard completes:
1. Validates all selections
2. Uploads the customer's design image once
3. Creates multiple ManagedImage entries (one per location)
4. Each entry has:
   - Same image URL (reused)
   - Recommended dimensions for that location
   - Specified quantity
5. Adds all entries to the existing nesting tool
6. Shows success toast with summary

### Non-Invasive Design
- **No modifications to core application code**
- Wizard components are completely separate
- Integration point is a single button added to Image Manager
- Uses existing services (storage, authentication, toast notifications)
- Outputs standard ManagedImage objects that work with existing nesting algorithm

## Future Enhancements
- Custom size adjustments (override recommendations)
- Garment size variations (Youth, Adult, Plus sizes)
- Multi-image support (different designs per location)
- Save favorite configurations
- Price calculator integration
- Real-time nesting preview before adding

## Files Added
```
src/
├── components/
│   ├── dtf-size-wizard.tsx          # Main wizard modal
│   ├── wizard-trigger.tsx           # Button to open wizard
│   └── wizard/
│       ├── garment-selection-step.tsx
│       ├── image-upload-step.tsx
│       ├── location-selection-step.tsx
│       └── wizard-summary.tsx
├── lib/
│   ├── wizard-config.ts             # Configuration & recommendations
│   └── wizard-integration.ts        # Integration utilities
└── types/
    └── wizard.ts                     # TypeScript types
```

## Files Modified
```
src/components/image-manager.tsx     # Added wizard trigger button
```

## Testing
1. Navigate to the nesting tool (`/nesting-tool-13` or `/nesting-tool-17`)
2. Click "Need help choosing sizes?" button
3. Follow the wizard steps
4. Verify prints are added to the nesting tool with correct dimensions
5. Test nesting algorithm with wizard-generated prints

## Usage Tips for Customers
- Start with the most common garment type (T-Shirt)
- Upload high-resolution artwork for best results
- Select multiple locations to create variety packs
- Use the visual mockup to preview placement
- Review the order summary before confirming
