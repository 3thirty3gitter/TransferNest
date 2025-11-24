# Export Rotation Research - Transparent Background Issue

## Problem Statement
Images without backgrounds (transparent PNGs) that are rotated during nesting are not being placed properly in the exported files. Images WITH backgrounds export correctly. The preview displays correctly but the export does not match.

---

## Current System Analysis

### 1. Preview Display (✅ WORKING CORRECTLY)
**File:** `src/components/sheet-preview.tsx`

**Method:** CSS Transform Rotation

```tsx
// For rotated images:
// 1. Container dimensions are SWAPPED
const containerWidth = item.rotated ? displayHeight : displayWidth;
const containerHeight = item.rotated ? displayWidth : displayHeight;

// 2. Inner div has ORIGINAL dimensions
width: `${displayWidth}px`,
height: `${displayHeight}px`,

// 3. CSS Transform applied
transform: item.rotated ? 'rotate(90deg) translateY(-100%)' : 'none',
transformOrigin: 'top left',
```

**How it works:**
- Outer container: SWAPPED dimensions (height×width)
- Inner div: ORIGINAL dimensions (width×height)  
- CSS rotation: `rotate(90deg) translateY(-100%)`
- Transform origin: top-left
- **Result:** Image rotates 90° and is translated to fit within the swapped container

---

### 2. Export Method 1: Admin Nesting Tool Download
**File:** `src/app/admin/nesting-tool/page.tsx` (lines 148-238)

**Method:** Canvas API + Context Rotation

```tsx
if (item.rotated) {
  // Dimensions are SWAPPED in item (item.width = original height)
  const x = item.x * pixelsPerInch;
  const y = item.y * pixelsPerInch;
  const drawWidth = item.height * pixelsPerInch;   // UNSWAP: use height as width
  const drawHeight = item.width * pixelsPerInch;   // UNSWAP: use width as height
  
  // Rotate around top-left of rotated space
  ctx.translate(x + drawHeight, y);
  ctx.rotate(Math.PI / 2);  // 90 degrees
  
  // Draw image in original orientation
  ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
}
```

**Key Differences:**
- Uses context `translate()` and `rotate()`
- Translates to `(x + drawHeight, y)` - moves right by the height amount
- Rotates 90° (`Math.PI / 2`)
- Draws at position `(0, 0)` in rotated space

---

### 3. Export Method 2: Generate Gang Sheet API
**File:** `src/app/api/generate-gang-sheet/route.ts` (lines 81-177)

**Method:** Sharp Image Processing Library

```typescript
// Image dimensions in original orientation
const imageWidth = Math.round(img.width * dpi);
const imageHeight = Math.round(img.height * dpi);

// Process image
let processedImage = sharp(buffer).resize(imageWidth, imageHeight, { fit: 'fill' });

// If rotated, rotate -90 degrees with transparent background
if (isRotated) {
  processedImage = processedImage.rotate(-90, { 
    background: { r: 0, g: 0, b: 0, alpha: 0 } 
  });
}

// Extract exact dimensions (Sharp expands canvas during rotation)
const expectedWidth = isRotated ? imageHeight : imageWidth;
const expectedHeight = isRotated ? imageWidth : imageHeight;

if (tempMeta.width !== expectedWidth || tempMeta.height !== expectedHeight) {
  imageBuffer = await sharp(tempBuffer)
    .extract({
      left: 0,
      top: 0,
      width: Math.min(expectedWidth, tempMeta.width || expectedWidth),
      height: Math.min(expectedHeight, tempMeta.height || expectedHeight)
    })
    .png()
    .toBuffer();
}

// Composite onto canvas at position
return { input: imageBuffer, left, top };
```

**Key Details:**
- Uses Sharp library for rotation
- Rotates `-90` degrees (opposite direction from preview)
- Background set to transparent: `{ r: 0, g: 0, b: 0, alpha: 0 }`
- Extracts exact region after rotation (to remove Sharp's canvas expansion)
- Places at `(left, top)` position on canvas
- Position is NOT adjusted for rotation - uses raw `img.x` and `img.y`

---

### 4. Export Method 3: Print Export (node-canvas)
**File:** `src/lib/print-export.ts` (lines 99-112)

**Method:** Node Canvas API + Context Rotation

```typescript
if (imgData.rotated) {
  // Replicate CSS rotate(90deg) transform around center of frame
  ctx.save();
  ctx.translate(posX + frameW / 2, posY + frameH / 2);  // Move to center
  ctx.rotate(Math.PI / 2);  // 90 degrees
  // Draw centered in rotated space
  ctx.drawImage(image, -frameW / 2, -frameH / 2, frameW, frameH);
  ctx.restore();
} else {
  // Non-rotated: draw directly at position
  ctx.drawImage(image, posX, posY, frameW, frameH);
}
```

**Key Details:**
- Uses canvas context rotation
- Translates to CENTER of frame: `(posX + frameW/2, posY + frameH/2)`
- Rotates 90° (`Math.PI / 2`)
- Draws centered: `(-frameW/2, -frameH/2)`
- Uses ORIGINAL width/height (`frameW`, `frameH` from `imgData.width` and `imgData.height`)

---

## Critical Findings

### Finding 1: Three Different Rotation Methods
The application uses THREE different methods for rotating images:

1. **Preview:** CSS `rotate(90deg) translateY(-100%)` with `transformOrigin: top-left`
2. **Admin Download:** Canvas `translate(x + drawHeight, y)` + `rotate(Math.PI/2)` + draw at `(0,0)`
3. **Gang Sheet API:** Sharp `rotate(-90)` + extract + composite at raw position
4. **Print Export:** Canvas `translate(center)` + `rotate(Math.PI/2)` + draw centered

### Finding 2: Inconsistent Rotation Direction
- **Preview & Admin Download:** +90° rotation (counter-clockwise)
- **Gang Sheet API:** -90° rotation (clockwise)
- **Print Export:** +90° rotation (counter-clockwise)

### Finding 3: Inconsistent Position Handling
- **Preview:** Position at `(x, y)` with CSS transform
- **Admin Download:** Translate to `(x + drawHeight, y)`
- **Gang Sheet API:** Position at `(x, y)` with pre-rotated image
- **Print Export:** Translate to `(x + width/2, y + height/2)`

### Finding 4: Dimension Handling Differences
- **Preview:** Container uses SWAPPED dims, inner div uses ORIGINAL dims
- **Admin Download:** UNSWAPS dimensions before drawing (`height` as width)
- **Gang Sheet API:** Uses ORIGINAL dimensions, rotates image itself
- **Print Export:** Uses ORIGINAL dimensions (`frameW`, `frameH`)

---

## Root Cause Analysis

### Why Transparent Images Fail

**Hypothesis 1: Alpha Channel Handling in Sharp**
When Sharp rotates an image with `alpha: 0` background, the rotation may be creating artifacts or not preserving the alpha channel correctly. Images with solid backgrounds don't show this issue because there's no transparency to corrupt.

**Hypothesis 2: Position Calculation Mismatch**
The Gang Sheet API rotates the image -90° but doesn't adjust the position. For transparent images, this may cause the visible content to be positioned incorrectly within the frame, while opaque images "fill" the frame making the issue less visible.

**Hypothesis 3: Extract Region Misalignment**
After Sharp rotates the image, the `extract()` call may be cutting the wrong region for transparent images. The algorithm assumes the rotated content is at `(0, 0)` but Sharp may be placing it differently when alpha channels are involved.

**Hypothesis 4: Composite Blend Mode**
The composite operation uses `blend: 'over'` which should respect alpha channels, but there may be a mismatch between how Sharp handles pre-multiplied alpha vs straight alpha for rotated images.

---

## Data Model: NestedImage

```typescript
interface NestedImage {
  id: string;
  url: string;
  x: number;        // Position in inches
  y: number;        // Position in inches
  width: number;    // Dimension in inches (ALWAYS ORIGINAL width, never swapped)
  height: number;   // Dimension in inches (ALWAYS ORIGINAL height, never swapped)
  rotated: boolean; // Flag indicating 90° rotation needed
}
```

**CRITICAL FINDING:** The `width` and `height` in `NestedImage` **ALWAYS** represent the **ORIGINAL image dimensions**, NOT the rotated dimensions. 

When `rotated: true`:
- Image occupies a `height × width` space on the sheet
- But the data structure stores `width × height`
- **Export code MUST swap dimensions when processing rotated images**

**Confirmed in code:** `src/lib/ga-nesting.ts` lines 473-479:
```typescript
placedItems.push({
  ...
  width: img.width,      // ORIGINAL width (NOT swapped)
  height: img.height,    // ORIGINAL height (NOT swapped)
  rotated: isRotated
});
```

---

## Rotation Mathematics

### CSS Transform (Preview - Working)
```
Container: height × width (swapped)
Image: width × height (original)
Transform: rotate(90deg) translateY(-100%)
Origin: top-left

Visual Effect:
  1. Image rotates 90° around top-left corner
  2. Translate moves image back down by 100% of its height
  3. Result: Image fits within swapped container
```

### Canvas Center Rotation (Print Export)
```
Translate to: (x + width/2, y + height/2)
Rotate: 90° (Math.PI/2)
Draw at: (-width/2, -height/2)

Visual Effect:
  1. Move to center of intended frame
  2. Rotate 90° around that center point
  3. Draw image centered in rotated space
```

### Canvas Corner + Offset (Admin Download)
```
Translate to: (x + height, y)  // Note: uses height as offset
Rotate: 90° (Math.PI/2)  
Draw at: (0, 0)

Visual Effect:
  1. Move right by rotated height amount
  2. Rotate 90° around that point
  3. Draw at origin of rotated space
```

### Sharp Pre-Rotation (Gang Sheet API)
```
1. Resize to: width × height
2. Rotate: -90° with transparent background
3. Extract: height × width region (swapped) from (0, 0)
4. Composite at: (x, y) on main canvas

Visual Effect:
  Image is physically rotated before placement
  No transform needed at composite time
```

---

## The Mismatch Problem

### Expected Behavior (from Preview)
```
Item: { x: 2, y: 3, width: 4, height: 6, rotated: true }

Visual Result:
  - Occupies space from (2, 3) to (2+6, 3+4) = (8, 7)
  - Image appears rotated 90° clockwise
  - Width and height visually swapped
```

### What Gang Sheet API Does
```
Item: { x: 2, y: 3, width: 4, height: 6, rotated: true }

Process:
  1. Resize image to 1200×1800px (4"×6" at 300dpi)
  2. Rotate -90° → now 1800×1200px
  3. Extract 1800×1200px from (0,0)
  4. Place at (600, 900) on canvas  // 2"×3" at 300dpi
  
Issue:
  - Position (600, 900) is correct for top-left corner
  - BUT: Rotated image may have content positioned differently
  - Transparent areas may cause visible content to appear offset
```

---

## Specific Issue with Transparent Images

### With Opaque Background
```
Original Image: [======IMAGE======]
After -90° rotation: 
     ┌─────┐
     │     │
     │IMAGE│
     │     │
     └─────┘
Extract from (0,0): Gets entire rotated image
Result: Content fills the frame, looks correct
```

### With Transparent Background  
```
Original Image: ░░░[IMAGE]░░░  (░ = transparent)
After -90° rotation:
     ┌───────┐
     │ ░░░░░ │
     │ IMAGE │  
     │ ░░░░░ │
     └───────┘
Extract from (0,0): Gets full region but...
Result: Transparent padding may cause visible content to be offset!
```

**Key Insight:** When Sharp rotates with `alpha: 0` background and then extracts, transparent padding may not be distributed evenly. The visible content might be positioned incorrectly within the extracted region.

---

## Comparison: Why Admin Download Works

The Admin Download (nesting-tool page) works better because:

1. Uses Canvas API with actual image rotation (not pre-rotated)
2. Loads the ORIGINAL image (not pre-processed)
3. Applies rotation transform at draw time
4. Canvas rotation respects the original image's alpha channel
5. No intermediate buffer/extract steps to introduce misalignment

**However:** Admin Download uses different math than preview:
- Preview: `rotate(90deg) translateY(-100%)`
- Admin: `translate(x + drawHeight, y)` + `rotate(90°)` + `draw(0, 0)`

This suggests the Admin Download is ALSO incorrect but in a different way!

---

## Testing Observations from Attached Image

Looking at the side-by-side comparison:

**Left Panel (Preview):** Images appear correctly positioned
**Right Panel (Export):** Rotated images are offset/misaligned

**Specific Observations:**
1. Non-rotated images appear identical in both panels
2. Rotated images show displacement
3. The displacement appears to be in a consistent direction
4. Transparent backgrounds make the issue obvious (no "filler" content)

---

## Recommended Next Steps for Investigation

### 1. Verify Rotation Direction
- [ ] Confirm preview uses +90° (counter-clockwise)
- [ ] Confirm export should use +90° or -90°
- [ ] Test if changing Sharp rotation from -90 to +90 helps

### 2. Test Position Calculation
- [ ] Log actual pixel positions in gang-sheet API
- [ ] Compare to expected positions from preview
- [ ] Check if position needs adjustment for rotated items

### 3. Examine Sharp Rotation Behavior
- [ ] Test Sharp rotation with transparent PNG
- [ ] Check if `rotate(-90)` expands canvas differently for transparent images
- [ ] Verify extract region is correct after rotation

### 4. Compare Canvas vs Sharp Methods
- [ ] Create test with same image in both methods
- [ ] Compare pixel-by-pixel output
- [ ] Identify where divergence occurs

### 5. Check Alpha Channel Preservation
- [ ] Verify Sharp maintains alpha channel through rotation
- [ ] Check if composite blend mode affects alpha
- [ ] Test with different `premultiplied` settings

---

## THE ACTUAL ROOT CAUSE - DIMENSION STRETCHING

### Problem: Resizing with Unswapped Dimensions

Looking at `generate-gang-sheet/route.ts` lines 99-117:

```typescript
// Image dimensions in its original orientation
const imageWidth = Math.round(img.width * dpi);    // e.g., 800px
const imageHeight = Math.round(img.height * dpi);  // e.g., 400px

// Resize to exact dimensions first
let processedImage = sharp(buffer).resize(imageWidth, imageHeight, { fit: 'fill' });

// If rotated, rotate -90 degrees
if (isRotated) {
  processedImage = processedImage.rotate(-90, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
}
```

**THE BUG:**
1. Code resizes image to `imageWidth × imageHeight` (e.g., 800×400)
2. Then rotates -90°
3. After rotation, image becomes 400×800
4. But code expects it to be placed in a space that's... **what size?**

### The Space vs Image Mismatch

When `rotated: true`, the item occupies `height × width` space on sheet (swapped).
- Space on sheet: 400 × 800 (height×width swapped)
- Image after resize+rotate: 400 × 800
- **This looks correct!**

BUT WAIT... Let's trace through an actual example:

**Example:** Car image 800px wide × 400px tall (2:1 ratio)

**Preview rendering:**
```
1. Container: 400×800 (swapped)
2. Inner image: 800×400 (original) 
3. CSS transform: rotate(90deg) translateY(-100%)
4. Result: 800px image height becomes container 800px width ✓
```

**Gang Sheet export:**
```
1. Resize to: 800×400 (original dimensions)
2. Rotate -90°: becomes 400×800
3. Place in space: 400×800 (swapped dimensions from nesting)
4. Result: Should work... but doesn't!
```

### Why Transparent Images Reveal the Problem

**Hypothesis:** The issue is that Sharp's `resize()`  with `fit: 'fill'` is stretching the original image to fit the ORIGINAL dimensions, but the actual image content might have a different aspect ratio or transparent padding.

**For images WITH opaque backgrounds:**
- Entire rectangle is filled with content
- Stretching is less noticeable
- Background color hides any artifacts

**For images WITHOUT backgrounds (transparent):**
- Only visible content matters
- Any stretching is VERY obvious
- Transparent areas reveal the distortion
- Image becomes "blurred" from stretching

### The Real Culprit: `fit: 'fill'`

```typescript
sharp(buffer).resize(imageWidth, imageHeight, { fit: 'fill' });
```

**`fit: 'fill'`** forces the image to fill the exact dimensions, ignoring aspect ratio!

If the original image file has a slightly different aspect ratio than `img.width / img.height`, this causes stretching/distortion.

### The Correct Solution

The code should:
1. Respect the original aspect ratio
2. Use `fit: 'contain'` or `fit: 'inside'` instead of `fit: 'fill'`
3. OR: Don't resize at all before rotation if dimensions already match
4. OR: Calculate dimensions accounting for rotation BEFORE resizing

---

## Solution Approaches to Consider

### Option A: Match Preview CSS Transform
Replicate the exact CSS transform math in Sharp:
- Rotate +90° (not -90°)
- Apply equivalent of `translateY(-100%)`
- Adjust position calculation accordingly

### Option B: Use Canvas API for Export
Replace Sharp rotation with node-canvas:
- Load original image
- Apply canvas context rotation (like Admin Download)
- Use exact same math as preview
- More consistent across all export methods

### Option C: Fix Sharp Extract Region
After rotation, calculate correct extract region:
- Account for transparent padding
- Find bounding box of visible content
- Extract only that region
- Adjust position for offset

### Option D: Pre-calculate Rotated Position
Before rotating image:
- Calculate where content will be after rotation
- Adjust `left` and `top` composite position
- Compensate for rotation transform offset

---

## Files Requiring Investigation

1. ✅ `/workspaces/TransferNest/src/components/sheet-preview.tsx` - REFERENCE (working correctly)
2. 🔍 `/workspaces/TransferNest/src/app/api/generate-gang-sheet/route.ts` - PRIMARY SUSPECT
3. 🔍 `/workspaces/TransferNest/src/lib/print-export.ts` - SECONDARY SUSPECT  
4. ⚠️ `/workspaces/TransferNest/src/app/admin/nesting-tool/page.tsx` - May also have issues

---

## Questions to Answer

1. **Why does the preview work correctly?**
   - Uses CSS transforms that browser handles natively
   - No intermediate processing of alpha channels
   - Transform origin and translation are well-defined

2. **Why do images with backgrounds work in export?**
   - Opaque backgrounds fill the entire frame
   - Position misalignment hidden by solid color
   - No transparent areas to reveal offset

3. **What is the exact pixel offset in failed exports?**
   - Need to measure displacement in attached image
   - Calculate if offset matches rotation transform error
   - Determine if offset is consistent across all rotated images

4. **Is the rotation direction correct?**
   - Preview: +90° (CCW)
   - Export: -90° (CW)
   - This is a 180° difference in final orientation!

5. **Does Sharp handle alpha differently than Canvas?**
   - Premultiplied vs straight alpha
   - Edge handling during rotation
   - Background fill behavior

---

## Conclusion - STRETCHING NOT ROTATION

**THE REAL PROBLEM IS NOT ROTATION DIRECTION - IT'S IMAGE STRETCHING**

The export rotation issue stems from:

1. **`fit: 'fill'` in Sharp resize** - Forces images to fill exact dimensions, ignoring aspect ratio
2. **Dimension calculation timing** - Resizes to original dimensions BEFORE considering rotation
3. **Transparent images reveal distortion** - Opaque backgrounds hide the stretching artifacts
4. **Result:** Images are "stretched to blur" and "spill outside the page"

### What's Actually Happening:

```
Original image: 900×400 (actual file dimensions, 2.25:1 ratio)
Algorithm thinks: 800×400 (stored dimensions, 2:1 ratio)

Export process:
1. Resize 900×400 → 800×400 with fit:'fill'  ← STRETCHES IMAGE
2. Rotate -90° → 400×800
3. Place in 400×800 space

Result: Image stretched by 12.5% horizontally, causing blur
```

### Why Opaque Images "Work":
- Solid background fills entire frame
- Stretching is less noticeable on uniform colors
- Background "anchors" the image boundaries
- User focuses on central content, not edges

### Why Transparent Images Fail:
- No background to hide artifacts
- Stretching very obvious on transparent edges
- Blur becomes immediately visible
- Transparent "spill" shows the dimensional mismatch

### The Fix:

Replace `fit: 'fill'` with `fit: 'inside'` or `fit: 'contain'` to preserve aspect ratio, OR remove the resize entirely and let Sharp handle the image at its natural dimensions.
