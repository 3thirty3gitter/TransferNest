'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { WizardState, GarmentType, LocationSelection, PrintLocation } from '@/types/wizard';
import { GARMENT_OPTIONS, getRecommendedSize, LOCATION_INFO } from '@/lib/wizard-config';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import GarmentSelectionStep from './wizard/garment-selection-step';
import ImageUploadStep from './wizard/image-upload-step';
import LocationSelectionStep from './wizard/location-selection-step';
import WizardSummary from './wizard/wizard-summary';

interface DTFSizeWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (selections: LocationSelection[], imageFile: File) => void;
}

export default function DTFSizeWizard({ open, onClose, onComplete }: DTFSizeWizardProps) {
  const [state, setState] = useState<WizardState>({
    step: 1,
    garmentType: null,
    garmentSize: null,
    uploadedImage: null,
    imagePreviewUrl: null,
    selections: []
  });

  const handleGarmentSelect = (garment: GarmentType) => {
    setState(prev => ({
      ...prev,
      garmentType: garment,
      garmentSize: garment === 'tshirt' ? 'M' : null, // default to Medium for t-shirts
      step: 2
    }));
  };

  const handleSizeSelect = (size: string) => {
    setState(prev => ({
      ...prev,
      garmentSize: size as any
    }));
  };

  const handleImageUpload = (file: File, previewUrl: string) => {
    setState(prev => ({
      ...prev,
      uploadedImage: file,
      imagePreviewUrl: previewUrl,
      step: 3
    }));
  };

  const handleLocationToggle = (location: string, quantity: number) => {
    if (!state.garmentType) return;

    setState(prev => {
      const existingIndex = prev.selections.findIndex(s => s.location === location);
      
      if (existingIndex >= 0) {
        // Update or remove existing selection
        if (quantity === 0) {
          return {
            ...prev,
            selections: prev.selections.filter((_, i) => i !== existingIndex)
          };
        } else {
          const newSelections = [...prev.selections];
          newSelections[existingIndex] = {
            ...newSelections[existingIndex],
            quantity
          };
          return { ...prev, selections: newSelections };
        }
      } else {
        // Add new selection
        const recommendedSize = getRecommendedSize(state.garmentType!, location as any, state.garmentSize);
        return {
          ...prev,
          selections: [
            ...prev.selections,
            {
              location: location as any,
              quantity,
              recommendedSize
            }
          ]
        };
      }
    });
  };

  const handleUpdateSelection = (location: PrintLocation, updates: Partial<LocationSelection>) => {
    setState(prev => {
      const existingIndex = prev.selections.findIndex(s => s.location === location);
      if (existingIndex < 0) return prev;
      
      const newSelections = [...prev.selections];
      newSelections[existingIndex] = {
        ...newSelections[existingIndex],
        ...updates
      };
      
      return { ...prev, selections: newSelections };
    });
  };

  const handleComplete = () => {
    if (state.uploadedImage && state.selections.length > 0) {
      onComplete(state.selections, state.uploadedImage);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setState({
      step: 1,
      garmentType: null,
      garmentSize: null,
      uploadedImage: null,
      imagePreviewUrl: null,
      selections: []
    });
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: Math.max(1, prev.step - 1) }));
  };

  const canProceedToNext = () => {
    switch (state.step) {
      case 1:
        return state.garmentType !== null;
      case 2:
        return state.uploadedImage !== null;
      case 3:
        return state.selections.length > 0;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[60vw] w-[60vw] max-h-[85vh] h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">DTF Size Helper</DialogTitle>
          <DialogDescription className="sr-only">
            A step-by-step wizard to help you choose the right DTF print sizes for your garments
          </DialogDescription>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map(stepNum => (
              <div
                key={stepNum}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  stepNum <= state.step ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="py-6">
          {state.step === 1 && (
            <GarmentSelectionStep
              onSelect={handleGarmentSelect}
              selected={state.garmentType}
            />
          )}

          {state.step === 2 && (
            <ImageUploadStep
              onUpload={handleImageUpload}
              currentImage={state.imagePreviewUrl}
            />
          )}

          {state.step === 3 && state.garmentType && (
            <LocationSelectionStep
              garmentType={state.garmentType}
              garmentSize={state.garmentSize}
              imagePreviewUrl={state.imagePreviewUrl!}
              selections={state.selections}
              onToggleLocation={handleLocationToggle}
              onSizeSelect={handleSizeSelect}
              onUpdateSelection={handleUpdateSelection}
            />
          )}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <Button
            variant="outline"
            onClick={state.step === 1 ? handleReset : handleBack}
            disabled={state.step === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <div className="text-sm text-muted-foreground">
            Step {state.step} of 3
          </div>

          {state.step === 3 && state.selections.length > 0 ? (
            <Button onClick={handleComplete} className="bg-green-600 hover:bg-green-700">
              Add to Nesting Tool
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => setState(prev => ({ ...prev, step: prev.step + 1 }))}
              disabled={!canProceedToNext()}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* Summary sidebar */}
        {state.selections.length > 0 && (
          <WizardSummary selections={state.selections} />
        )}
      </DialogContent>
    </Dialog>
  );
}
