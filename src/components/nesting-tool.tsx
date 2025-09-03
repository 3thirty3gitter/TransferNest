
'use client';

import { useState, useReducer, useCallback, useMemo } from 'react';
import ImageManager from '@/components/image-manager';
import SheetConfig from '@/components/sheet-config';
import SheetPreview from '@/components/sheet-preview';
import type { NestedLayout } from '@/app/schema';
import { getNestedLayout, saveToCart } from '@/app/actions';
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { uploadImage } from '@/services/storage';

type Image = {
  id: string;
  url: string;
  dataAiHint: string;
  width: number;
  height: number;
};

type State = {
  images: Image[];
  sheetWidth: 13 | 17;
  nestedLayout: NestedLayout;
  sheetLength: number;
  isLoading: boolean;
  isSaving: boolean;
  isUploading: boolean;
};

type Action =
  | { type: 'ADD_IMAGE'; payload: Image }
  | { type: 'REMOVE_IMAGE'; payload: string }
  | { type: 'SET_SHEET_WIDTH'; payload: 13 | 17 }
  | { type: 'START_NESTING' }
  | { type: 'SET_LAYOUT'; payload: { layout: NestedLayout; length: number } }
  | { type: 'START_SAVING' }
  | { type: 'SET_SAVE_SUCCESS' }
  | { type: 'START_UPLOADING' }
  | { type: 'SET_UPLOAD_COMPLETE' }
  | { type: 'SET_ERROR'; payload: string };

const initialState: State = {
  images: [
    { id: '1', url: 'https://picsum.photos/300/400', dataAiHint: 'logo design', width: 3, height: 4 },
    { id: '2', url: 'https://picsum.photos/400/350', dataAiHint: 'tshirt graphic', width: 4, height: 3.5 },
    { id: '3', url: 'https://picsum.photos/200/300', dataAiHint: 'sticker illustration', width: 2, height: 3 },
  ],
  sheetWidth: 13,
  nestedLayout: [],
  sheetLength: 0,
  isLoading: false,
  isSaving: false,
  isUploading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_IMAGE':
      return { ...state, images: [...state.images, action.payload], isUploading: false };
    case 'REMOVE_IMAGE':
      return { ...state, images: state.images.filter((img) => img.id !== action.payload) };
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
      
      const id = new Date().getTime().toString();
      
      const image = new window.Image();
      image.onload = () => {
        dispatch({
          type: 'ADD_IMAGE',
          payload: {
            id: id,
            url: downloadURL,
            // Using a default of 3 inches for now. A more advanced implementation
            // could use DPI to calculate the real-world size.
            width: 3, 
            height: (image.height / image.width) * 3,
            dataAiHint: 'uploaded image',
          },
        });
        toast({
          title: 'Image Uploaded',
          description: 'Your image has been successfully added.',
        });
      };
      image.onerror = () => {
        dispatch({ type: 'SET_ERROR', payload: 'Could not load uploaded image.' });
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load the uploaded image. Please try another file.",
        });
      };
      image.src = downloadURL;
    } catch (error: any) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || 'An unexpected error occurred during upload.',
      });
    }
  };

  const handleRemoveImage = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_IMAGE', payload: id });
  }, []);

  const handleSheetWidthChange = useCallback((width: 13 | 17) => {
    dispatch({ type: 'SET_SHEET_WIDTH', payload: width });
  }, []);

  const handleArrange = async () => {
    dispatch({ type: 'START_NESTING' });
    const imageUrls = state.images.map(img => img.url);
    const result = await getNestedLayout(imageUrls, state.sheetWidth);

    if (result.error) {
      dispatch({ type: 'SET_ERROR', payload: result.error });
      toast({
        variant: "destructive",
        title: "Layout Error",
        description: result.error,
      })
    } else {
      dispatch({ type: 'SET_LAYOUT', payload: { layout: result.layout, length: result.length } });
    }
  };
  
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
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Gang Sheet Builder</h1>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
              Upload your images, choose a sheet size, and let our AI arrange them for you.
          </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 flex flex-col gap-8 lg:sticky lg:top-24">
          <ImageManager
            images={state.images}
            onFileChange={handleFileChange}
            onRemoveImage={handleRemoveImage}
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
