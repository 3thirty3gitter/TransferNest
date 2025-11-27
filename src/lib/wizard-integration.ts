import { LocationSelection } from '@/types/wizard';
import { ManagedImage } from '@/lib/nesting-algorithm';
import { uploadImage } from '@/services/storage';

/**
 * Converts wizard selections into ManagedImage objects for the nesting tool
 */
export async function convertWizardToManagedImages(
  selections: LocationSelection[],
  imageFile: File,
  userId: string
): Promise<ManagedImage[]> {
  try {
    // Upload the image once to Firebase Storage with retry logic
    let imageUrl: string;
    let uploadAttempts = 0;
    const maxAttempts = 3;
    
    while (uploadAttempts < maxAttempts) {
      try {
        imageUrl = await uploadImage(imageFile, userId);
        break;
      } catch (error: any) {
        uploadAttempts++;
        if (uploadAttempts >= maxAttempts) {
          throw new Error(`Failed to upload image after ${maxAttempts} attempts. ${error.message}`);
        }
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * uploadAttempts));
      }
    }

    // Get image dimensions
    const dimensions = await getImageDimensions(imageFile);

    // Create a ManagedImage for each selection
    const managedImages: ManagedImage[] = [];

    for (const selection of selections) {
      const { width: recommendedWidth, height: recommendedHeight } = selection.recommendedSize;
      
      // Create a managed image for this selection
      const managedImage: ManagedImage = {
        id: `wizard-${Date.now()}-${selection.location}-${Math.random()}`,
        url: imageUrl!,
        width: recommendedWidth, // Keep in inches for nesting algorithm
        height: recommendedHeight,
        aspectRatio: recommendedWidth / recommendedHeight,
        copies: selection.quantity,
      };

      managedImages.push(managedImage);
    }

    return managedImages;
  } catch (error: any) {
    console.error('Error in convertWizardToManagedImages:', error);
    throw error;
  }
}

/**
 * Gets image dimensions from a file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validates wizard output before conversion
 */
export function validateWizardOutput(
  selections: LocationSelection[],
  imageFile: File | null
): { valid: boolean; error?: string } {
  if (!imageFile) {
    return { valid: false, error: 'No image file provided' };
  }

  if (!imageFile.type.startsWith('image/')) {
    return { valid: false, error: 'Invalid file type. Please upload an image.' };
  }

  if (selections.length === 0) {
    return { valid: false, error: 'No print locations selected' };
  }

  for (const selection of selections) {
    if (selection.quantity < 1) {
      return { valid: false, error: 'All selections must have quantity of at least 1' };
    }
  }

  return { valid: true };
}
