# Recommended Size Scaling Examples

## How It Works

The recommended DTF transfer sizes now automatically scale based on the selected garment size. This ensures that print recommendations are proportional to the actual garment dimensions.

### Formula
```
Scaled Size = Base Size (Medium) × Scale Factor
Scale Factor = Selected Size Chest Width ÷ Medium Chest Width
```

## Example Calculations

### Front Chest Location (Base: 3.5" × 3.5")

| Garment Size | Chest Width | Scale Factor | Recommended Width | Recommended Height |
|--------------|-------------|--------------|-------------------|-------------------|
| XS           | 16"         | 0.80         | 2.8"             | 2.8"              |
| S            | 18"         | 0.90         | 3.2"             | 3.2"              |
| **M**        | **20"**     | **1.00**     | **3.5"**         | **3.5"**          |
| L            | 22"         | 1.10         | 3.9"             | 3.9"              |
| XL           | 24"         | 1.20         | 4.2"             | 4.2"              |
| 2XL          | 26"         | 1.30         | 4.6"             | 4.6"              |
| 3XL          | 28"         | 1.40         | 4.9"             | 4.9"              |
| 4XL          | 30"         | 1.50         | 5.3"             | 5.3"              |

### Full Front Location (Base: 12" × 15")

| Garment Size | Scale Factor | Recommended Width | Recommended Height |
|--------------|--------------|-------------------|-------------------|
| XS           | 0.80         | 9.6"              | 12.0"             |
| S            | 0.90         | 10.8"             | 13.5"             |
| **M**        | **1.00**     | **12.0"**         | **15.0"**         |
| L            | 1.10         | 13.2"             | 16.5"             |
| XL           | 1.20         | 14.4"             | 18.0"             |
| 2XL          | 1.30         | 15.6"             | 19.5"             |
| 3XL          | 1.40         | 16.8"             | 21.0"             |
| 4XL          | 1.50         | 18.0"             | 22.5"             |

### Back Full Location (Base: 12" × 15")

Same scaling as Full Front - proportional to garment width.

### Sleeve Locations (Base: 2.5" × 3")

| Garment Size | Scale Factor | Recommended Width | Recommended Height |
|--------------|--------------|-------------------|-------------------|
| XS           | 0.80         | 2.0"              | 2.4"              |
| S            | 0.90         | 2.3"              | 2.7"              |
| **M**        | **1.00**     | **2.5"**          | **3.0"**          |
| L            | 1.10         | 2.8"              | 3.3"              |
| XL           | 1.20         | 3.0"              | 3.6"              |
| 2XL          | 1.30         | 3.3"              | 3.9"              |
| 3XL          | 1.40         | 3.5"              | 4.2"              |
| 4XL          | 1.50         | 3.8"              | 4.5"              |

## User Experience

### Before Scaling
- Select XS t-shirt → Get 12" × 15" recommendation (too large!)
- Select 4XL t-shirt → Get 12" × 15" recommendation (too small!)

### After Scaling ✅
- Select XS t-shirt → Get 9.6" × 12" recommendation (proportional!)
- Select 4XL t-shirt → Get 18" × 22.5" recommendation (proportional!)

## Technical Details

### Implementation
```typescript
export function getRecommendedSize(
  garmentType: GarmentType, 
  location: PrintLocation, 
  garmentSize: TShirtSize | null = null
): PrintSize {
  const baseSize = sizeMap[garmentType]?.[location];
  const scaleFactor = getGarmentScaleFactor(garmentType, garmentSize);
  
  return {
    width: Math.round(baseSize.width * scaleFactor * 10) / 10,
    height: Math.round(baseSize.height * scaleFactor * 10) / 10
  };
}
```

### Rounding
- Sizes are rounded to 1 decimal place (e.g., 3.9" not 3.8647")
- Maintains precision while being readable

### Backwards Compatibility
- `garmentSize` parameter is optional (defaults to `null`)
- When `null` or non-tshirt garment, scale factor = 1.0 (no scaling)
- Existing code continues to work

## Benefits

1. **Accurate Recommendations**: Sizes match the actual garment proportions
2. **Better User Experience**: No more "this seems too small/large" confusion
3. **Professional**: Industry-standard approach to garment printing
4. **Consistent**: Both preview scaling AND recommended sizes scale together
5. **Flexible**: System easily extends to hoodies, longsleeve, etc.

## Real-World Impact

### Small T-Shirt (XS)
- **Without Scaling**: 12" × 15" design looks comically oversized
- **With Scaling**: 9.6" × 12" design looks professionally proportioned

### Large T-Shirt (4XL)  
- **Without Scaling**: 12" × 15" design looks too small
- **With Scaling**: 18" × 22.5" design fills the space appropriately

### Chest Logo (All Sizes)
- **Without Scaling**: Same 3.5" logo on XS and 4XL looks inconsistent
- **With Scaling**: 2.8" (XS) to 5.3" (4XL) maintains visual balance
