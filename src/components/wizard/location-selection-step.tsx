'use client';

import React from 'react';
import { GarmentType, LocationSelection, PrintLocation, TShirtSize } from '@/types/wizard';
import { GARMENT_OPTIONS, LOCATION_INFO, getRecommendedSize } from '@/lib/wizard-config';
import { T_SHIRT_MEASUREMENTS } from '@/lib/mockup-configs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Ruler, Check } from 'lucide-react';

interface LocationSelectionStepProps {
  garmentType: GarmentType;
  garmentSize: TShirtSize | null;
  imagePreviewUrl: string;
  selections: LocationSelection[];
  onToggleLocation: (location: string, quantity: number) => void;
  onSizeSelect: (size: string) => void;
  onUpdateSelection: (location: PrintLocation, updates: Partial<LocationSelection>) => void;
}

export default function LocationSelectionStep({
  garmentType,
  garmentSize,
  imagePreviewUrl,
  selections,
  onToggleLocation,
  onSizeSelect,
  onUpdateSelection
}: LocationSelectionStepProps) {
  const garment = GARMENT_OPTIONS.find(g => g.id === garmentType);
  const availableLocations = garment?.availableLocations || [];

  const getSelectionForLocation = (location: PrintLocation) => {
    return selections.find(s => s.location === location);
  };

  const handleQuantityChange = (location: PrintLocation, delta: number) => {
    const current = getSelectionForLocation(location);
    const newQuantity = Math.max(0, (current?.quantity || 0) + delta);
    onToggleLocation(location, newQuantity);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-2">What location do you need?</h3>
        <p className="text-muted-foreground">
          Select where you want your design printed
        </p>
      </div>

      {/* Garment Size Selector (T-shirts only) */}
      {garmentType === 'tshirt' && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Ruler className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-semibold text-blue-900">Garment Size</h4>
                <p className="text-xs text-blue-700">Accurate size recommendations</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 flex-1">
              {(Object.keys(T_SHIRT_MEASUREMENTS) as TShirtSize[]).map(size => {
                const measurements = T_SHIRT_MEASUREMENTS[size];
                const isSelected = garmentSize === size;
                
                return (
                  <Button
                    key={size}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onSizeSelect(size)}
                    className={`min-w-[60px] ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
                    title={`Chest: ${measurements.widthChest}", Length: ${measurements.lengthBody}", Sleeve: ${measurements.sleeveLength}"`}
                  >
                    {size}
                  </Button>
                );
              })}
            </div>
            
            {garmentSize && (
              <div className="text-xs text-blue-700 bg-white/50 px-3 py-1.5 rounded-md border border-blue-200">
                <div className="font-semibold mb-1">Size {garmentSize}:</div>
                <div>Chest: {T_SHIRT_MEASUREMENTS[garmentSize].widthChest}"</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Location List - Simple Cards */}
      <div className="space-y-3">
        <h4 className="font-semibold text-lg">Available Print Locations</h4>
        {availableLocations.map(location => {
          const locationInfo = LOCATION_INFO[location];
          const selection = getSelectionForLocation(location);
          const recommendedSize = getRecommendedSize(garmentType, location, garmentSize);
          const isSelected = selection && selection.quantity > 0;

          return (
            <Card
              key={location}
              className={`p-5 transition-all cursor-pointer hover:shadow-md ${
                isSelected ? 'ring-2 ring-primary bg-primary/5 shadow-lg' : 'hover:bg-accent'
              }`}
              onClick={() => !isSelected && onToggleLocation(location, 1)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  {/* Selection Indicator */}
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
                    isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                  }`}>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </div>
                  
                  <div className="flex-1">
                    <h5 className="font-semibold text-lg">{locationInfo.label}</h5>
                    <p className="text-sm text-muted-foreground mt-1">
                      {locationInfo.description}
                    </p>
                    <p className="text-sm text-blue-600 font-medium mt-2">
                      Recommended: {recommendedSize.width}" × {recommendedSize.height}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleQuantityChange(location, -1); }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        value={selection.quantity}
                        onChange={(e) => {
                          e.stopPropagation();
                          const value = parseInt(e.target.value) || 0;
                          onToggleLocation(location, value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 text-center"
                        min="0"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => { e.stopPropagation(); handleQuantityChange(location, 1); }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="default" size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      Select
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {selections.length > 0 && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="text-sm">
            <p className="font-semibold text-green-900 mb-2">Selected Locations:</p>
            <div className="space-y-1">
              {selections.filter(s => s.quantity > 0).map(sel => (
                <div key={sel.location} className="text-green-800">
                  • {LOCATION_INFO[sel.location].label} - {sel.quantity}× at {sel.recommendedSize.width}" × {sel.recommendedSize.height}"
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
