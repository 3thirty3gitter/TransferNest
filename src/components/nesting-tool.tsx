
'use client';

import { useState, useReducer, useCallback, useMemo } from 'react';
import ImageManager from '@/components/image-manager';
import SheetConfig from '@/components/sheet-config';
import SheetPreview from '@/components/sheet-preview';
import type { NestedLayout } from '@/app/schema';
import { saveToCart } from '@/app/actions';
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { uploadImage } from '@/services/storage';
import { ImageEditDialog } from './image-edit-dialog';
import { nestImages } from '@/lib/nesting-algorithm';

export type ManagedImage = {
  id: string;
  url: string;
  dataAiHint: string;
  width: number; // in inches
  height: number; // in inches
  aspectRatio: number;
};

type State = {
  images: ManagedImage[];
  sheetWidth: 13 | 17;
  nestedLayout: NestedLayout;
  sheetLength: number;
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
  editingImageId: string | null;
};

type Action =
  | { type: 'ADD_IMAGE'; payload: ManagedImage }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'UPDATE_IMAGE_AND_ADD_COPIES'; payload: { id: string, copies: number, width: number, height: number } }
  | { type: 'DUPLICATE_IMAGE'; payload: string }
  | { type: 'SET_SHEET_WIDTH'; payload: 13 | 17 }
  | { type: 'START_NESTING' }
  | { type: 'SET_LAYOUT'; payload: { layout: NestedLayout; length: number } }
  | { type: 'START_SAVING' }
  | { type: 'SET_SAVE_SUCCESS' }
  | { type: 'START_UPLOADING' }
  | { type: 'SET_UPLOAD_COMPLETE' }
  | { type: 'SET_EDITING_IMAGE'; payload: string | null }
  | { type: 'SET_ERROR'; payload: string };

const initialState: State = {
  images: [],
  sheetWidth: 13,
  nestedLayout: [],
  sheetLength: 0,
  isLoading: false,
  isSaving: false,
  isUploading: false,
  editingImageId: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, action.payload] };
    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter((img) => img.id !== action.payload), nestedLayout: [] };
    case 'UPDATE_IMAGE_AND_ADD_COPIES': {
        const { id, copies, width, height } = action.payload;
        const imageToUpdate = state.images.find(img => img.id === id);
        if (!imageToUpdate) return state;

        const updatedImages = state.images.map(img => img.id === id ? { ...img, width, height } : img);

        const newCopies = [];
        for (let i = 0; i < copies - 1; i++) {
            newCopies.push({
            ...imageToUpdate,
            id: `${new Date().getTime()}-${Math.random()}`,
            width,
            height,
            });
        }
        
        return { ...state, images: [...updatedImages, ...newCopies], nestedLayout: [] };
    }
    case 'DUPLICATE_IMAGE': {
        const imageToDuplicate = state.images.find(img => img.id === action.payload);
        if (!imageToDuplicate) return state;
        
        const newImage: ManagedImage = {
            ...imageToDuplicate,
            id: `${new Date().getTime()}-${Math.random()}`,
        };
        
        return { ...state, images: [...state.images, newImage] };
    }
    case 'SET_SHEET_WIDTH':
      return { ...state, sheetWidth: action.payload, nestedLayout: [], sheetLength: 0 };
    case 'START_NESTING':
      return { ...state, isLoading: true };
    case 'SET_LAYOUT':
      return { ...state, nestedLayout: action.payload.layout, sheetLength: action.payload.length, isLoading: false };
    case 'START_SAVING':
      return { ...state, isSaving: true };
    case 'SET_SAVE_SUCCESS':
      return { ...state, isSaving: false };
    case 'START_UPLOADING':
      return { ...state, isUploading: true };
    case 'SET_UPLOAD_COMPLETE':
        return { ...state, isUploading: false };
    case 'SET_EDITING_IMAGE':
      return { ...state, editingImageId: action.payload };
    case 'SET_ERROR':
      return { ...state, isLoading: false, isSaving: false, isUploading: false };
    default:
      return state;
  }
}

export default function NestingTool() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast()
  const { user } = useAuth();
  const router = useRouter();

  const editingImage = useMemo(() => {
    return state.images.find(img => img.id === state.editingImageId) || null;
  }, [state.editingImageId, state.images]);

  const handleSetEditingImage = useCallback((id: string | null) => {
      dispatch({ type: 'SET_EDITING_IMAGE', payload: id });
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

    const file = event.target.files?.[0];
    if (!file) return;

    dispatch({ type: 'START_UPLOADING' });

    try {
        const downloadURL = await uploadImage(file, user.uid);
        
        const image = new window.Image();
        image.onload = () => {
            dispatch({
            type: 'ADD_IMAGE',
            payload: {
                id: new Date().getTime().toString(),
                url: downloadURL,
                width: 3, // default width
                height: (image.height / image.width) * 3, // maintain aspect ratio
                aspectRatio: image.width / image.height,
                dataAiHint: 'uploaded image',
            },
            });
            toast({
            title: 'Image Uploaded',
            description: 'Your image has been successfully added.',
            });
            dispatch({ type: 'SET_UPLOAD_COMPLETE' });
        };
        image.onerror = () => {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Could not load the uploaded image. Please try another file.",
            });
            dispatch({ type: 'SET_UPLOAD_COMPLETE' });
        };
        image.src = downloadURL;
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Upload Failed",
            description: error.message || 'An unexpected error occurred during upload.',
        });
        dispatch({ type: 'SET_UPLOAD_COMPLETE' });
    }
  };

  const handleRemoveImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const handleDuplicateImage = useCallback((id: string) => {
    dispatch({ type: 'DUPLICATE_IMAGE', payload: id });
    toast({
      title: 'Image Duplicated',
      description: 'A copy of the image has been added to your list.',
    });
  }, []);


  const handleSheetWidthChange = useCallback((width: 13 | 17) => {
    dispatch({ type: 'SET_SHEET_WIDTH', payload: width });
  }, []);

  const handleArrange = () => {
    if (state.images.length === 0) {
      toast({
        variant: "destructive",
        title: "Layout Error",
        description: "Please add at least one image before arranging the sheet.",
      });
      return;
    }
    dispatch({ type: 'START_NESTING' });

    setTimeout(() => {
        try {
            const imagesToNest = state.images.map(({ id, url, width, height }) => ({ id, url, width, height }));
            const result = nestImages(imagesToNest, state.sheetWidth);
            dispatch({ type: 'SET_LAYOUT', payload: { layout: result.placedItems, length: result.sheetLength } });
        } catch (e: any) {
            dispatch({ type: 'SET_ERROR', payload: e.message });
            toast({
                variant: "destructive",
                title: "Layout Error",
                description: e.message || "An unexpected error occurred while arranging images.",
            });
        }
    }, 50);
  };

  const handleUpdateImage = (id: string, copies: number, width: number, height: number) => {
    dispatch({ type: 'UPDATE_IMAGE_AND_ADD_COPIES', payload: { id, copies, width, height }});
    toast({
        title: 'Image Updated',
        description: `The image has been updated and ${copies} cop(y/ies) are now in the list.`,
    });
  }
  
  const price = useMemo(() => {
    if(state.sheetLength === 0) return 0;
    const rate = state.sheetWidth === 13 ? 2.00 : 2.50;
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

    const cartItem = {
      sheetWidth: state.sheetWidth,
      sheetLength: state.sheetLength,
      price: price,
      layout: state.nestedLayout,
    };

    const result = await saveToCart(cartItem);

    if (result.success) {
      dispatch({ type: 'SET_SAVE_SUCCESS' });
      toast({
        title: "Added to Cart!",
        description: `Your ${state.sheetWidth}" x ${state.sheetLength.toFixed(2)}" sheet has been saved to your cart.`,
      });
    } else {
      dispatch({ type: 'SET_ERROR', payload: result.error || 'An unknown error occurred.' });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Could not save the item to your cart. Please try again.',
      });
    }
  }

  return (
    <div className="container py-8">
      {editingImage && (
        <ImageEditDialog
          image={editingImage}
          isOpen={!!state.editingImageId}
          onClose={() => handleSetEditingImage(null)}
          onSave={handleUpdateImage}
        />
      )}
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Gang Sheet Builder</h1>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
              Upload your images, choose a sheet size, and our tool will arrange them for you.
          </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col gap-8 lg:sticky lg:top-24">
          <ImageManager
            images={state.images}
            onFileChange={handleFileChange}
            onRemoveImage={handleRemoveImage}
            onEditImage={handleSetEditingImage}
            onDuplicateImage={handleDuplicateImage}
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
