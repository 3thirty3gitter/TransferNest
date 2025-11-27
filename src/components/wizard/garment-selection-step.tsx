'use client';

import React from 'react';
import { GarmentType } from '@/types/wizard';
import { GARMENT_OPTIONS } from '@/lib/wizard-config';
import { Card } from '@/components/ui/card';

interface GarmentSelectionStepProps {
  onSelect: (garment: GarmentType) => void;
  selected: GarmentType | null;
}

export default function GarmentSelectionStep({ onSelect, selected }: GarmentSelectionStepProps) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">What are you printing on?</h3>
        <p className="text-muted-foreground">Select the type of garment or item</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {GARMENT_OPTIONS.map((garment) => (
          <Card
            key={garment.id}
            className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
              selected === garment.id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-accent'
            }`}
            onClick={() => onSelect(garment.id)}
          >
            <div className="p-6 text-center">
              <div className="text-6xl mb-3">{garment.icon}</div>
              <h4 className="font-semibold text-lg">{garment.name}</h4>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
