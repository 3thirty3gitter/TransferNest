
'use client';

import { useState, useReducer, useCallback, useMemo, useEffect } from 'react';
import ImageManager from '@/components/image-manager';
import SheetConfig from '@/components/sheet-config';
import SheetPreview from '@/components/sheet-preview';
import type { NestedLayout, CartItem, NestingAgentOutput } from '@/app/schema';
import { saveToCartAction, runNestingAgentAction } from '@/app/actions';
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { uploadImage } from '@/services/storage';
import { generateAndUploadPrintSheet } from '@/lib/print-sheet-generator';

export type ManagedImage = {
  id: string;
  url: string;
  dataAiHint: string;
  width: number; // in inches
  height: number; // in inches
  aspectRatio: number;
  copies: number;
};

type State = {
  images: ManagedImage[];
  nestedLayout: NestedLayout;
  sheetLength: number;
  sheetWidth: 13 | 17;
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  nestingStrategy?: string;
  efficiency: number;
};

type Action =
  | { type: 'ADD_IMAGE'; payload: Omit<ManagedImage, 'copies'> }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE'; payload: { id: string; updates: Partial<Omit<ManagedImage, 'id' | 'url' | 'aspectRatio'>> } }
  | { type: 'DUPLICATE_IMAGE'; payload: string }
  | { type: 'START_NESTING' }
  | { type: 'SET_LAYOUT'; payload: NestingAgentOutput }
  | { type: 'START_SAVING' }
  | { type: 'SET_SAVE_SUCCESS' }
  | { type: 'START_UPLOADING' }
  | { type: 'SET_UPLOAD_COMPLETE' }
  | { type: 'TRIM_IMAGE', payload: { id: string; newUrl: string; newWidth: number; newHeight: number; newAspectRatio: number } }
  | { type: 'SET_SHEET_WIDTH', payload: 13 | 17 }
  | { type: 'SET_ERROR'; payload: string };

function getInitialState(initialSheetWidth: 13 | 17): State {
    return {
        images: [],
        nestedLayout: [],
        sheetLength: 0,
        sheetWidth: initialSheetWidth,
        isLoading: false,
        isSaving: false,
        isUploading: false,
        efficiency: 0,
    };
}


function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, { ...action.payload, copies: 1 }], nestedLayout: [], sheetLength: 0, efficiency: 0 };
    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter((img) => img.id !== action.payload), nestedLayout: [], sheetLength: 0, efficiency: 0 };
    case 'UPDATE_IMAGE': {
        return {
          ...state,
          images: state.images.map(img => 
            img.id === action.payload.id ? { ...img, ...action.payload.updates } : img
          ),
          nestedLayout: [],
          sheetLength: 0,
          efficiency: 0,
        };
    }
    case 'SET_SHEET_WIDTH': {
        const newWidth = action.payload;
        if (newWidth === state.sheetWidth) return state;

        const newImages = state.images.map(img => {
            if (img.width > newWidth) {
                return {
                    ...img,
                    width: newWidth - 0.5,
                    height: (newWidth - 0.5) / img.aspectRatio,
                };
            }
            return img;
        });
        return { ...state, images: newImages, sheetWidth: newWidth, nestedLayout: [], sheetLength: 0, efficiency: 0 };
    }
    case 'TRIM_IMAGE':
      return {
        ...state,
        images: state.images.map(img =>
          img.id === action.payload.id
            ? {
                ...img,
                url: action.payload.newUrl,
                width: action.payload.newWidth,
                height: action.payload.newHeight,
                aspectRatio: action.payload.newAspectRatio,
              }
            : img
        ),
        nestedLayout: [],
        sheetLength: 0,
        efficiency: 0,
      };
    case 'DUPLICATE_IMAGE': {
        const imageToDuplicate = state.images.find(img => img.id === action.payload);
        if (!imageToDuplicate) return state;
        
        const newImage: ManagedImage = {
            ...imageToDuplicate,
            id: `${new Date().getTime()}-${Math.random()}`,
        };
        
        const index = state.images.findIndex(img => img.id === action.payload);
        const newImages = [...state.images];
        newImages.splice(index + 1, 0, newImage);
        
        return { ...state, images: newImages, nestedLayout: [], sheetLength: 0, efficiency: 0 };
    }
    case 'START_NESTING':
      return { ...state, isLoading: true };
    case 'SET_LAYOUT':
      return { ...state, nestedLayout: action.payload.placedItems, sheetLength: action.payload.sheetLength, nestingStrategy: action.payload.strategy, efficiency: action.payload.areaUtilizationPct, isLoading: false };
    case 'START_SAVING':
      return { ...state, isSaving: true };
    case 'SET_SAVE_SUCCESS':
      return { ...state, isSaving: false };
    case 'START_UPLOADING':
      return { ...state, isUploading: true };
    case 'SET_UPLOAD_COMPLETE':
        return { ...state, isUploading: false };
    case 'SET_ERROR':
      return { ...state, isLoading: false, isSaving: false, isUploading: false };
    default:
      return state;
  }
}

type NestingToolProps = {
  sheetWidth: 13 | 17;
}

export default function NestingTool({ sheetWidth: initialSheetWidth }: NestingToolProps) {
  const [state, dispatch] = useReducer(reducer, getInitialState(initialSheetWidth));
  const { toast } = useToast()
  const { user } = useAuth();
  const router = useRouter();

  const handleSheetWidthChange = useCallback((newWidth: 13 | 17) => {
    dispatch({ type: 'SET_SHEET_WIDTH', payload: newWidth});
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'You must be logged in to upload images.',
      });
      router.push('/login');
      return;
    }

    const files = event.target.files;
    if (!files || files.length === 0) return;

    dispatch({ type: 'START_UPLOADING' });

    try {
        const uploadPromises = Array.from(files).map(file => uploadImage(file, user.uid));
        const downloadURLs = await Promise.all(uploadPromises);

        const imageLoadPromises = downloadURLs.map(url => {
            return new Promise<Omit<ManagedImage, 'copies'>>((resolve, reject) => {
                const image = new window.Image();
                image.onload = () => {
                    const defaultWidth = 3;
                    const aspectRatio = image.width / image.height;
                    
                    let finalWidth = defaultWidth;
                    if (image.width > (state.sheetWidth * 96)) { // Approx 96dpi for initial check
                        finalWidth = state.sheetWidth - 0.5; // give it some padding
                    }
                    
                    const finalHeight = finalWidth / aspectRatio;

                    resolve({
                        id: `${new Date().getTime()}-${Math.random()}`,
                        url: url,
                        width: finalWidth,
                        height: finalHeight,
                        aspectRatio: aspectRatio,
                        dataAiHint: 'uploaded image',
                    });
                };
                image.onerror = () => reject(new Error(`Could not load image at ${url}`));
                image.src = url;
            });
        });

        const newImages = await Promise.all(imageLoadPromises);
        newImages.forEach(img => dispatch({ type: 'ADD_IMAGE', payload: img }));

        toast({
            title: `${newImages.length} Image(s) Uploaded`,
            description: 'Your images have been successfully added.',
        });

    } catch (error: any) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error.message || 'An unexpected error occurred during upload.',
        });
    } finally {
        dispatch({ type: 'SET_UPLOAD_COMPLETE' });
        if (event.target) {
            event.target.value = '';
        }
    }
  };

  const handleRemoveImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const handleTrimImage = useCallback(async (id: string) => {
    const imageToTrim = state.images.find(img => img.id === id);
    if (!imageToTrim) return;

    try {
      const image = new window.Image();
      image.crossOrigin = 'Anonymous';

      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          throw new Error('Could not get canvas context');
        }
        ctx.drawImage(image, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let minX = canvas.width, minY = canvas.height, maxX = -1, maxY = -1;

        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const alpha = data[(y * canvas.width + x) * 4 + 3];
            if (alpha > 0) {
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        
        if (maxX === -1) { // Image is fully transparent
            toast({ variant: 'destructive', title: 'Trim Failed', description: 'Image is fully transparent.' });
            return;
        }

        const trimmedWidth = maxX - minX + 1;
        const trimmedHeight = maxY - minY + 1;

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = trimmedWidth;
        trimmedCanvas.height = trimmedHeight;
        const trimmedCtx = trimmedCanvas.getContext('2d');
        if (!trimmedCtx) return;
        
        trimmedCtx.drawImage(canvas, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);

        const newUrl = trimmedCanvas.toDataURL();
        const newAspectRatio = trimmedWidth / trimmedHeight;
        const newHeight = imageToTrim.width / newAspectRatio;

        dispatch({
          type: 'TRIM_IMAGE',
          payload: {
            id: id,
            newUrl: newUrl,
            newWidth: imageToTrim.width,
            newHeight: newHeight,
            newAspectRatio: newAspectRatio,
          },
        });
        
        toast({ title: 'Image Trimmed', description: 'Excess transparent space has been removed.' });
      };

      image.onerror = () => {
        toast({ variant: 'destructive', title: 'Trim Failed', description: 'Could not load image for trimming. It might be a cross-origin issue.' });
      };

      image.src = imageToTrim.url;

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Trim Failed', description: error.message || 'An unexpected error occurred.' });
    }
  }, [state.images, toast]);

  const handleDuplicateImage = useCallback((id:string) => {
    dispatch({ type: 'DUPLICATE_IMAGE', payload: id });
    toast({
      title: 'Image Duplicated',
      description: 'A copy of the image has been added to your list.',
    });
  }, []);

  const handleArrange = async () => {
    if (state.images.length === 0) {
      toast({
        variant: "destructive",
        title: "Layout Error",
        description: "Please add at least one image before arranging the sheet.",
      });
      return;
    }
    dispatch({ type: 'START_NESTING' });

    try {
        // Automatically resize any images that are too large for the sheet before sending to the agent
        const imagesToNest = state.images.map(img => {
            if (img.width > state.sheetWidth && img.height > state.sheetWidth) {
                toast({
                    variant: "destructive",
                    title: "Image Too Large",
                    description: `An image is too large to fit on the ${state.sheetWidth}" sheet, even when rotated. Please resize it.`
                });
                throw new Error("Image too large for sheet.");
            }
            return img;
        });


        const result = await runNestingAgentAction({
            images: imagesToNest,
            sheetWidth: state.sheetWidth
        });
        
        dispatch({ type: 'SET_LAYOUT', payload: result });

        if (result.warning) {
          toast({
            variant: "default",
            title: "Partial Layout Generated",
            description: result.warning,
            duration: 5000,
          });
        }

    } catch (e: any) {
        dispatch({ type: 'SET_ERROR', payload: e.message });
        toast({
            variant: "destructive",
            title: "Layout Error",
            description: e.message || "An unexpected error occurred while arranging images.",
        });
    }
  };

  const handleUpdateImage = (id: string, updates: Partial<Omit<ManagedImage, 'id' | 'url' | 'aspectRatio'>>) => {
    dispatch({ type: 'UPDATE_IMAGE', payload: { id, updates }});
  }
  
  const price = useMemo(() => {
    if(state.sheetLength === 0) return 0;
    const rate = state.sheetWidth === 13 ? 0.45 : 0.59;
    return state.sheetLength * rate;
  }, [state.sheetLength, state.sheetWidth]);

  const handleAddToCart = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Logged In',
        description: 'Please sign in to add items to your cart.',
      });
      router.push('/login');
      return;
    }
    if (state.nestedLayout.length === 0) {
       toast({
        variant: "destructive",
        title: "Empty Sheet",
        description: "Please arrange your images before adding to cart.",
      });
      return;
    }

    dispatch({ type: 'START_SAVING' });

    try {
      const pngUrl = await generateAndUploadPrintSheet({
        layout: state.nestedLayout,
        sheetWidth: state.sheetWidth,
        sheetLength: state.sheetLength,
        userId: user.uid,
      });

      const cartItem: Omit<CartItem, 'id' | 'createdAt'> = {
        userId: user.uid,
        sheetWidth: state.sheetWidth,
        sheetLength: state.sheetLength,
        price: price,
        pngUrl: pngUrl,
      };

      const result = await saveToCartAction({ item: cartItem });

      if (result.success) {
        dispatch({ type: 'SET_SAVE_SUCCESS' });
        toast({
          title: "Added to Cart!",
          description: `Your ${state.sheetWidth}" x ${state.sheetLength.toFixed(2)}" sheet has been saved to your cart.`,
        });
        window.dispatchEvent(new CustomEvent('cartUpdated'));
      } else {
        throw new Error(result.error || 'Could not save the item to your cart.');
      }
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        variant: "destructive",
        title: "Cart Error",
        description: error.message || "An unexpected error occurred while adding to cart.",
      });
    }
  }

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">{state.sheetWidth}" Gang Sheet Builder</h1>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
              Upload your images, and our AI agent will arrange them for you on a {state.sheetWidth}" wide sheet.
          </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col gap-8 self-start">
          <ImageManager
            images={state.images}
            onFileChange={handleFileChange}
            onRemoveImage={handleRemoveImage}
            onUpdateImage={handleUpdateImage}
            onDuplicateImage={handleDuplicateImage}
            onTrimImage={handleTrimImage}
            isUploading={state.isUploading}
          />
          <SheetConfig
            sheetWidth={state.sheetWidth}
            onSheetWidthChange={handleSheetWidthChange}
            sheetLength={state.sheetLength}
            price={price}
            onArrange={handleArrange}
            onAddToCart={handleAddToCart}
            isLoading={state.isLoading || state.isSaving}
            hasImages={state.images.length > 0}
            efficiency={state.efficiency}
            strategy={state.nestingStrategy}
          />
        </div>
        <div className="lg:col-span-2">
          <SheetPreview
            sheetWidth={state.sheetWidth}
            sheetLength={state.sheetLength}
            nestedLayout={state.nestedLayout}
            isLoading={state.isLoading}
          />
        </div>
      </div>
    </div>
  );
}
