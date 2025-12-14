'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2 } from 'lucide-react';
import SimpleDTFWizard from './simple-dtf-wizard';
import { GarmentType } from '@/types/wizard';
import { ManagedImage } from '@/lib/nesting-algorithm';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { uploadImage } from '@/services/storage';

interface ImagePlacement {
  imageId: string;
  imageName: string;
  imageFile: File;
  imagePreview: string;
  location: string;
  quantity: number;
  recommendedWidth: number;
  customWidth?: number;
  productType: string;
}

interface WizardTriggerProps {
  onImagesAdded: (images: ManagedImage[]) => void;
  autoOpen?: boolean;
}

export default function WizardTrigger({ onImagesAdded, autoOpen = false }: WizardTriggerProps) {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (autoOpen) {
      setIsWizardOpen(true);
    }
  }, [autoOpen]);

  const processImageFile = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleWizardComplete = async (placements: ImagePlacement[]) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to use the wizard.',
        variant: 'destructive'
      });
      return;
    }

    if (placements.length === 0) {
      toast({
        title: 'No Placements',
        description: 'Please add at least one image placement.',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const managedImages: ManagedImage[] = [];
      
      // Group placements by image file
      const imageGroups = new Map<File, ImagePlacement[]>();
      placements.forEach(placement => {
        const existing = imageGroups.get(placement.imageFile) || [];
        existing.push(placement);
        imageGroups.set(placement.imageFile, existing);
      });

      // Process each unique image
      for (const [file, imagePlacements] of imageGroups.entries()) {
        // Upload image once
        const url = await uploadImage(file, user.uid);
        
        // Get pixel dimensions to calculate aspect ratio
        const { width: pixelWidth, height: pixelHeight } = await processImageFile(file);
        const aspectRatio = pixelWidth / pixelHeight;

        // Create ManagedImage for each placement/quantity
        for (const placement of imagePlacements) {
          // Use the custom width if set, otherwise use recommended width (in inches)
          const widthInInches = placement.customWidth || placement.recommendedWidth;
          const heightInInches = widthInInches / aspectRatio;
          
          for (let i = 0; i < placement.quantity; i++) {
            managedImages.push({
              id: `${placement.imageId}-${i}`,
              url,
              width: widthInInches,
              height: heightInInches,
              aspectRatio: aspectRatio,
              copies: 1
            });
          }
        }
      }

      // Add images to the nesting tool
      onImagesAdded(managedImages);

      // Calculate totals for toast
      const totalPrints = placements.reduce((sum, p) => sum + p.quantity, 0);

      toast({
        title: 'Success!',
        description: `Added ${totalPrints} print${totalPrints !== 1 ? 's' : ''} to your workspace.`,
      });

      setIsWizardOpen(false);

    } catch (error: any) {
      console.error('Error processing wizard output:', error);
      
      let errorMessage = 'Failed to add prints to your workspace. Please try again.';
      
      if (error.message?.includes('upload')) {
        errorMessage = 'Failed to upload image. Please check your connection and try again.';
      } else if (error.message?.includes('503') || error.message?.includes('Service Unavailable')) {
        errorMessage = 'Image upload service is temporarily unavailable. Please try again in a moment.';
      } else if (error.message?.includes('Permission denied') || error.message?.includes('unauthorized')) {
        errorMessage = 'You do not have permission to upload images. Please sign in again.';
      }
      
      toast({
        title: 'Processing Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsWizardOpen(true)}
        variant="outline"
        size="lg"
        className="bg-gradient-to-r from-purple-500 to-blue-500 text-white border-0 hover:from-purple-600 hover:to-blue-600 whitespace-nowrap"
        disabled={isProcessing}
      >
        <Wand2 className="h-5 w-5 mr-2" />
        <span className="hidden sm:inline">Need help choosing sizes?</span>
        <span className="sm:hidden">Size Helper</span>
      </Button>

      <SimpleDTFWizard
        open={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onComplete={handleWizardComplete}
      />
    </>
  );
}
