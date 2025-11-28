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
        <h2 className="text-2xl font-bold mb-2 text-white">{question}</h2>
      </div>

      {/* Product Selection */}
      {step === 'product' && options && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {options.map(option => (
            <Card
              key={option.id}
              className="p-5 cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-center bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50"
              onClick={() => onSelect(option.id)}
            >
              {option.icon && <div className="text-5xl mb-2">{option.icon}</div>}
              <h3 className="font-semibold text-white">{option.label}</h3>
            </Card>
          ))}
        </div>
      )}

      {/* Name Product or Name Image */}
      {(step === 'name-product' || step === 'name-image') && (
        <Card className="p-8 text-center bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <div className="max-w-md mx-auto">
            <p className="text-slate-300 mb-4 text-sm">
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
              className="h-11 mb-4 bg-slate-900/50 border-slate-600 text-white"
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
        <Card className="p-12 border-2 border-dashed border-slate-600 hover:border-primary transition-colors text-center bg-slate-800/50 backdrop-blur-sm">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
            }}
            id="wizard-file-upload"
            style={{
              position: 'absolute',
              width: '1px',
              height: '1px',
              padding: '0',
              margin: '-1px',
              overflow: 'hidden',
              clip: 'rect(0, 0, 0, 0)',
              whiteSpace: 'nowrap',
              border: '0',
              visibility: 'hidden'
            }}
          />
          <div className="flex flex-col items-center gap-6">
            <div className="p-6 bg-primary/20 rounded-full">
              <Upload className="w-16 h-16 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-white">Upload Your Image</h3>
              <p className="text-slate-300 mb-6 text-sm">PNG, JPG, or SVG files</p>
              <Button
                type="button"
                size="lg"
                onClick={() => document.getElementById('wizard-file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Location Selection */}
      {step === 'location' && options && (
        <div className="space-y-2">
          {options.map(option => (
            <Card
              key={option.id}
              className="p-4 cursor-pointer hover:shadow-lg transition-all flex items-center justify-between bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50"
              onClick={() => onSelect(option.id)}
            >
              <div>
                <h3 className="font-semibold text-lg mb-0.5 text-white">{option.label}</h3>
                {option.description && (
                  <p className="text-xs text-slate-400">{option.description}</p>
                )}
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400" />
            </Card>
          ))}
        </div>
      )}

      {/* Quantity */}
      {step === 'quantity' && (
        <Card className="p-8 text-center bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <h3 className="text-lg font-semibold mb-4 text-white">Enter quantity</h3>
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant="outline"
              onClick={() => onSelect(String(Math.max(1, Number(currentValue || 1) - 1)))}
              className="border-slate-600 bg-slate-900/50 hover:bg-slate-700/50"
            >
              -
            </Button>
            <Input
              type="number"
              min="1"
              value={currentValue || 1}
              onChange={(e) => onSelect(e.target.value)}
              className="w-24 text-center text-2xl bg-slate-900/50 border-slate-600 text-white"
            />
            <Button
              size="lg"
              variant="outline"
              onClick={() => onSelect(String(Number(currentValue || 1) + 1))}
              className="border-slate-600 bg-slate-900/50 hover:bg-slate-700/50"
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
            className="p-8 cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-center bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50"
            onClick={() => onSelect('yes')}
          >
            <Plus className="w-12 h-12 mx-auto mb-3 text-green-400" />
            <h3 className="text-xl font-bold text-green-400">Yes</h3>
          </Card>
          <Card
            className="p-8 cursor-pointer hover:shadow-lg hover:scale-105 transition-all text-center bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:bg-slate-700/50"
            onClick={() => onSelect('no')}
          >
            <Check className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-400">{step === 'more-products' ? 'No, Finish' : 'No, Continue'}</h3>
          </Card>
        </div>
      )}
    </div>
  );
}
