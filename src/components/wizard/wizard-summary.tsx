'use client';

import React from 'react';
import { LocationSelection } from '@/types/wizard';
import { LOCATION_INFO } from '@/lib/wizard-config';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface WizardSummaryProps {
  selections: LocationSelection[];
}

export default function WizardSummary({ selections }: WizardSummaryProps) {
  const totalItems = selections.reduce((sum, sel) => sum + sel.quantity, 0);

  return (
    <Card className="p-4 mt-4 bg-blue-50 border-blue-200">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <span>Order Summary</span>
        <Badge variant="secondary">{totalItems} total prints</Badge>
      </h4>
      <div className="space-y-2">
        {selections.map((selection, idx) => {
          const locationInfo = LOCATION_INFO[selection.location];
          return (
            <div
              key={idx}
              className="flex justify-between items-center text-sm py-1 border-b border-blue-200 last:border-0"
            >
              <span className="font-medium">{locationInfo.label}</span>
              <div className="text-right">
                <div className="font-semibold">{selection.quantity}x</div>
                <div className="text-xs text-muted-foreground">
                  {selection.recommendedSize.width}" × {selection.recommendedSize.height}"
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
