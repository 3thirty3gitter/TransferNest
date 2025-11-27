'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, Upload, Plus, Check } from 'lucide-react';
import { useState } from 'react';

interface SimpleWizardStepProps {
  step: 'product' | 'name-product' | 'upload' | 'name-image' | 'location' | 'quantity' | 'more-locations' | 'more-images' | 'more-products';
  question: string;
  options?: Array<{ id: string; label: string; icon?: string; description?: string }>;
  onSelect: (value: string) => void;
  onUpload?: (file: File) => void;
  currentValue?: string | number;
}

export default function SimpleWizardStep({
  step,
  question,
  options,
  onSelect,
  onUpload,
  currentValue
}: SimpleWizardStepProps) {
  const [textInput, setTextInput] = useState('');

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      onSelect(textInput.trim());
      setTextInput('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6">
      {/* Question */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">{question}</h2>
      </div>

      {/* Product Selection */}
      {step === 'product' && options && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {options.map(option => (
            <Card
              key={option.id}
              className="p-5 cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-center"
              onClick={() => onSelect(option.id)}
            >
              {option.icon && <div className="text-5xl mb-2">{option.icon}</div>}
              <h3 className="font-semibold">{option.label}</h3>
            </Card>
          ))}
        </div>
      )}

      {/* Name Product or Name Image */}
      {(step === 'name-product' || step === 'name-image') && (
        <Card className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-muted-foreground mb-4 text-sm">
              {step === 'name-product' 
                ? 'Give your product a name to help you track it'
                : 'Describe this image so you can identify it later'}
            </p>
            <Input
              type="text"
              placeholder={step === 'name-product' ? 'e.g., Jeff\'s Birthday Shirt' : 'e.g., Funny Face, Hockey Player'}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
              className="h-11 mb-4"
              autoFocus
            />
            <Button
              size="lg"
              className="w-full"
              onClick={handleTextSubmit}
              disabled={!textInput.trim()}
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      )}

      {/* Upload */}
      {step === 'upload' && onUpload && (
        <Card className="p-8 border-2 border-dashed border-gray-300 hover:border-primary transition-colors text-center">
          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Upload Your Image</h3>
          <p className="text-muted-foreground mb-4 text-sm">PNG, JPG, or SVG files</p>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            className="max-w-sm mx-auto"
          />
        </Card>
      )}

      {/* Location Selection */}
      {step === 'location' && options && (
        <div className="space-y-2">
          {options.map(option => (
            <Card
              key={option.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-all flex items-center justify-between"
              onClick={() => onSelect(option.id)}
            >
              <div>
                <h3 className="font-semibold text-lg mb-0.5">{option.label}</h3>
                {option.description && (
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Card>
          ))}
        </div>
      )}

      {/* Quantity */}
      {step === 'quantity' && (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">Enter quantity</h3>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onSelect(String(Math.max(1, Number(currentValue || 1) - 1)))}
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={currentValue || 1}
              onChange={(e) => onSelect(e.target.value)}
              className="w-24 text-center text-2xl"
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => onSelect(String(Number(currentValue || 1) + 1))}
            >
              +
            </Button>
          </div>
          <Button
            size="lg"
            className="mt-8"
            onClick={() => onSelect(String(currentValue || 1))}
          >
            Continue
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      )}

      {/* More Locations / More Images / More Products - Yes/No */}
      {(step === 'more-locations' || step === 'more-images' || step === 'more-products') && (
        <div className="grid grid-cols-2 gap-4">
          <Card
            className="p-8 cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-center"
            onClick={() => onSelect('yes')}
          >
            <Plus className="w-12 h-12 mx-auto mb-3 text-green-600" />
            <h3 className="text-xl font-bold text-green-600">Yes</h3>
          </Card>
          <Card
            className="p-8 cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-center"
            onClick={() => onSelect('no')}
          >
            <Check className="w-12 h-12 mx-auto mb-3 text-blue-600" />
            <h3 className="text-xl font-bold text-blue-600">{step === 'more-products' ? 'No, Finish' : 'No, Continue'}</h3>
          </Card>
        </div>
      )}
    </div>
  );
}
