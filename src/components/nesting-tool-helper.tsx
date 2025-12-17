'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Eraser, 
  Crop, 
  Plus, 
  Sparkles, 
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  X,
  CheckCircle2
} from 'lucide-react';

const HELPER_STORAGE_KEY = 'dtf_nesting_helper_seen';

interface NestingToolHelperProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

const steps = [
  {
    title: "Welcome to the Gang Sheet Builder! 👋",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300 text-lg">
          This powerful tool helps you create custom gang sheets for your DTF transfers.
        </p>
        <p className="text-slate-400">
          This quick guide will walk you through the process. Don't worry - you can 
          access this helper anytime by clicking the <HelpCircle className="inline h-4 w-4 text-purple-400" /> button!
        </p>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 mt-4">
          <p className="text-purple-300 text-sm">
            💡 <strong>Tip:</strong> For the best results, use high-resolution PNG images with transparent backgrounds.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Step 1: Upload Your Images",
    icon: Upload,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Start by uploading your design images. You can:
        </p>
        <ul className="space-y-2 text-slate-400">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <span>Click the <strong className="text-white">"Upload Images"</strong> button</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <span>Drag and drop files directly onto the upload area</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 shrink-0" />
            <span>Upload multiple images at once!</span>
          </li>
        </ul>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-300 text-sm">
            📁 <strong>Supported formats:</strong> PNG, JPG, JPEG, WebP
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Step 2: Remove Backgrounds",
    icon: Eraser,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Does your image have a background that needs to be removed?
        </p>
        <p className="text-slate-400">
          Use our easy <strong className="text-white">background removal tool</strong>! 
          Simply click the eraser icon on any image to automatically remove the background.
        </p>
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-lg p-4">
          <p className="text-pink-300 text-sm">
            ✨ <strong>AI-Powered:</strong> Our smart background remover handles most designs automatically!
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Step 3: Trim Excess Space",
    icon: Crop,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          <strong className="text-white">Important!</strong> Trim any excess blank space around your images.
        </p>
        <p className="text-slate-400">
          Click the trim/crop icon on each image to remove unnecessary transparent areas. 
          This helps maximize your sheet usage and saves you money!
        </p>
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            💰 <strong>Pro Tip:</strong> Well-trimmed images = better nesting = more designs per sheet!
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Step 4: Add More Images",
    icon: Plus,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Continue adding all your images following the same steps:
        </p>
        <ol className="space-y-2 text-slate-400 list-decimal list-inside">
          <li>Upload the image</li>
          <li>Remove background if needed</li>
          <li>Trim excess space</li>
          <li>Set the quantity (copies) for each design</li>
          <li>Adjust the size if needed</li>
        </ol>
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
          <p className="text-green-300 text-sm">
            🔢 <strong>Copies:</strong> Use the quantity controls to specify how many of each design you need!
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Step 5: Create Your Gang Sheet",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          When you're ready, click the <strong className="text-white">"Create Gang Sheet"</strong> button!
        </p>
        <p className="text-slate-400">
          Our AI will automatically arrange your images for optimal space usage.
        </p>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
          <p className="text-orange-300 text-sm">
            ⏳ <strong>Please be patient!</strong> Depending on your order size, this can take 
            <strong> up to 3-4 minutes</strong> for large orders. The AI is working hard to give you the best layout!
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Step 6: Add to Cart & Checkout",
    icon: ShoppingCart,
    content: (
      <div className="space-y-4">
        <p className="text-slate-300">
          Happy with your gang sheet? Click <strong className="text-white">"Add to Cart"</strong>!
        </p>
        <p className="text-slate-400">
          Then click the cart icon at the top of the page to review your order and complete checkout.
        </p>
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4 mt-4">
          <p className="text-purple-300 text-sm">
            🚀 <strong>Fast Turnaround:</strong> Orders placed before 2pm ship same day!
          </p>
        </div>
        <div className="mt-6 text-center">
          <p className="text-lg text-white font-medium">You're all set! Let's create something awesome! 🎉</p>
        </div>
      </div>
    )
  }
];

export function NestingToolHelper({ forceOpen, onClose }: NestingToolHelperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if this is the first visit
    if (forceOpen) {
      setIsOpen(true);
      setCurrentStep(0);
      return;
    }

    const hasSeenHelper = localStorage.getItem(HELPER_STORAGE_KEY);
    if (!hasSeenHelper) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(HELPER_STORAGE_KEY, 'true');
    onClose?.();
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <StepIcon className="h-6 w-6 text-purple-400" />
              </div>
              <DialogTitle className="text-xl font-bold text-white">
                {currentStepData.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'w-6 bg-purple-500' 
                  : index < currentStep 
                    ? 'w-2 bg-purple-500/50' 
                    : 'w-2 bg-slate-600'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="py-4 min-h-[200px]">
          {currentStepData.content}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-700">
          <div>
            {!isFirstStep && (
              <Button 
                variant="ghost" 
                onClick={handlePrev}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {!isLastStep && (
              <Button 
                variant="ghost" 
                onClick={handleSkip}
                className="text-slate-500 hover:text-slate-300"
              >
                Skip Guide
              </Button>
            )}
            <Button 
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLastStep ? (
                <>
                  Get Started!
                  <Sparkles className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Button to reopen the helper
export function NestingToolHelperButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300"
    >
      <HelpCircle className="h-4 w-4 mr-2" />
      Help Guide
    </Button>
  );
}
