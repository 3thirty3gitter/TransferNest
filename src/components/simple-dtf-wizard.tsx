'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SimpleWizardStep from './wizard/simple-wizard-step';
import { GARMENT_OPTIONS, LOCATION_INFO, getRecommendedSize } from '@/lib/wizard-config';
import { GarmentType, PrintLocation } from '@/types/wizard';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import WizardReviewStep from './wizard/wizard-review-step';
import WizardLivePreview from './wizard/wizard-live-preview';

interface ImagePlacement {
  imageId: string;
  imageName: string;
  imageFile: File;
  imagePreview: string;
  location: PrintLocation;
  quantity: number;
  recommendedWidth: number;
  customWidth?: number;
  productType: GarmentType;
}

type WizardStep = 
  | 'product'
  | 'name-product'
  | 'upload'
  | 'name-image'
  | 'location'
  | 'quantity'
  | 'more-locations'
  | 'more-images'
  | 'more-products'
  | 'review';

interface SimpleDTFWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (placements: ImagePlacement[]) => void;
}

export default function SimpleDTFWizard({ open, onClose, onComplete }: SimpleDTFWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('product');
  const [productType, setProductType] = useState<GarmentType | null>(null);
  const [productName, setProductName] = useState<string>('');
  const [placements, setPlacements] = useState<ImagePlacement[]>([]);
  const [currentImage, setCurrentImage] = useState<{
    file: File | null;
    preview: string | null;
    number: number;
    name: string;
  }>({ file: null, preview: null, number: 1, name: '' });
  const [currentLocation, setCurrentLocation] = useState<PrintLocation | null>(null);
  const [currentQuantity, setCurrentQuantity] = useState<number>(1);
  const [placementCount, setPlacementCount] = useState<number>(0);

  const getQuestion = (): string => {
    switch (currentStep) {
      case 'product':
        return 'What type of product are you printing on?';
      case 'name-product':
        return `Great! What would you like to call this ${productType}?`;
      case 'upload':
        return `Perfect! Now upload your ${currentImage.number === 1 ? 'first' : getOrdinal(currentImage.number)} image for "${productName}"`;
      case 'name-image':
        return 'What would you like to call this image?';
      case 'location':
        if (placementCount === 0) {
          return `Where do you want to place "${currentImage.name}" on your ${productName}?`;
        }
        return `Where do you want to place "${currentImage.name}" Copy ${placementCount + 1}?`;
      case 'quantity':
        return 'Great! How many copies do you need?';
      case 'more-locations':
        return `Do you need "${currentImage.name}" placed anywhere else?`;
      case 'more-images':
        return `Do you need to add more images for "${productName}"?`;
      case 'more-products':
        return 'Do you need prints for another product?';
      default:
        return '';
    }
  };

  const getOrdinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const handleProductSelect = (id: string) => {
    setProductType(id as GarmentType);
    setCurrentStep('name-product');
  };

  const handleProductName = (name: string) => {
    setProductName(name);
    setCurrentStep('upload');
  };

  const handleImageUpload = (file: File) => {
    const preview = URL.createObjectURL(file);
    setCurrentImage({ ...currentImage, file, preview });
    setCurrentStep('name-image');
  };

  const handleImageName = (name: string) => {
    setCurrentImage({ ...currentImage, name });
    setCurrentStep('location');
  };

  const handleLocationSelect = (locationId: string) => {
    setCurrentLocation(locationId as PrintLocation);
    setCurrentStep('quantity');
  };

  const handleQuantitySelect = (qty: string) => {
    const quantity = parseInt(qty);
    setCurrentQuantity(quantity);
    
    // Save this placement with recommended width and proper names
    if (currentImage.file && currentLocation && productType) {
      const recommendedSize = getRecommendedSize(productType, currentLocation, null);
      const newPlacement: ImagePlacement = {
        imageId: `${productName}-${currentImage.name}-${currentLocation}-${placementCount + 1}`,
        imageName: `${productName} - ${currentImage.name}`,
        imageFile: currentImage.file,
        imagePreview: currentImage.preview!,
        location: currentLocation,
        quantity: quantity,
        recommendedWidth: recommendedSize.width,
        productType: productType
      };
      setPlacements([...placements, newPlacement]);
      setPlacementCount(placementCount + 1);
    }
    
    setCurrentStep('more-locations');
  };

  const handleMoreLocations = (answer: string) => {
    if (answer === 'yes') {
      setCurrentStep('location');
    } else {
      setCurrentStep('more-images');
    }
  };

  const handleMoreImages = (answer: string) => {
    if (answer === 'yes') {
      // Reset for new image
      setCurrentImage({ file: null, preview: null, number: currentImage.number + 1, name: '' });
      setPlacementCount(0);
      setCurrentStep('upload');
    } else {
      // Ask about other products
      setCurrentStep('more-products');
    }
  };

  const handleMoreProducts = (answer: string) => {
    if (answer === 'yes') {
      // Reset for new product
      setProductType(null);
      setProductName('');
      setCurrentImage({ file: null, preview: null, number: 1, name: '' });
      setPlacementCount(0);
      setCurrentStep('product');
    } else {
      // Go to review step
      setCurrentStep('review');
    }
  };

  const handleUpdateWidth = (placementId: string, newWidth: number) => {
    setPlacements(prev => prev.map(p => 
      p.imageId === placementId ? { ...p, customWidth: newWidth } : p
    ));
  };

  const handleCompleteReview = () => {
    if (placements.length > 0) {
      onComplete(placements);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setCurrentStep('product');
    setProductType(null);
    setProductName('');
    setPlacements([]);
    setCurrentImage({ file: null, preview: null, number: 1, name: '' });
    setCurrentLocation(null);
    setCurrentQuantity(1);
    setPlacementCount(0);
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'name-product':
        setCurrentStep('product');
        break;
      case 'upload':
        setCurrentStep('name-product');
        break;
      case 'name-image':
        setCurrentStep('upload');
        break;
      case 'location':
        setCurrentStep('name-image');
        break;
      case 'quantity':
        setCurrentStep('location');
        break;
      case 'more-locations':
        setCurrentStep('quantity');
        break;
      case 'more-images':
        setCurrentStep('more-locations');
        break;
      case 'more-products':
        setCurrentStep('more-images');
        break;
      case 'review':
        setCurrentStep('more-products');
        break;
    }
  };

  const canGoBack = currentStep !== 'product' && currentStep !== 'review';

  const getStepOptions = () => {
    switch (currentStep) {
      case 'product':
        return GARMENT_OPTIONS.map(g => ({
          id: g.id,
          label: g.name,
          icon: g.icon
        }));
      case 'location':
        if (!productType) return [];
        const garment = GARMENT_OPTIONS.find(g => g.id === productType);
        return garment?.availableLocations.map(loc => ({
          id: loc,
          label: LOCATION_INFO[loc].label,
          description: LOCATION_INFO[loc].description
        })) || [];
      default:
        return undefined;
    }
  };

  const handleStepSelect = (value: string) => {
    switch (currentStep) {
      case 'product':
        handleProductSelect(value);
        break;
      case 'name-product':
        handleProductName(value);
        break;
      case 'name-image':
        handleImageName(value);
        break;
      case 'location':
        handleLocationSelect(value);
        break;
      case 'quantity':
        handleQuantitySelect(value);
        break;
      case 'more-locations':
        handleMoreLocations(value);
        break;
      case 'more-images':
        handleMoreImages(value);
        break;
      case 'more-products':
        handleMoreProducts(value);
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-slate-700/50">
        <VisuallyHidden>
          <DialogTitle>DTF Size Helper Wizard</DialogTitle>
        </VisuallyHidden>
        
        {/* Two Column Layout - Full Width on Review Step */}
        <div className={`grid h-full ${currentStep === 'review' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr,380px]'}`}>
          {/* Left Column - Wizard Flow */}
          <div className="relative overflow-y-auto max-h-[90vh] p-8">
            {/* Back Button */}
            {canGoBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="absolute top-4 left-4 z-10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}

            {/* Progress Indicator */}
            <div className="text-center text-sm text-muted-foreground mb-6 pt-8">
              {placements.length > 0 && currentStep !== 'review' && (
                <p>{placements.length} placement{placements.length !== 1 ? 's' : ''} added</p>
              )}
            </div>

            {/* Step Content */}
            {currentStep === 'review' ? (
              <WizardReviewStep
                placements={placements}
                onUpdateWidth={handleUpdateWidth}
                onComplete={handleCompleteReview}
              />
            ) : (
              <SimpleWizardStep
                step={currentStep}
                question={getQuestion()}
                options={getStepOptions()}
                onSelect={handleStepSelect}
                onUpload={handleImageUpload}
                currentValue={currentQuantity}
              />
            )}
          </div>

          {/* Right Column - Live Preview (hidden on review step) */}
          {currentStep !== 'review' && (
            <div className="hidden lg:block border-l border-slate-700/50 bg-slate-950/40 backdrop-blur-sm overflow-y-auto max-h-[90vh]">
              <WizardLivePreview
                productType={productType}
                productName={productName}
                currentImageName={currentImage.name}
                currentImagePreview={currentImage.preview}
                placements={placements}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
