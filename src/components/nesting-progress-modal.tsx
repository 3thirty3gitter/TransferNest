'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, Package, Layers, Zap } from 'lucide-react';

interface NestingProgressModalProps {
  isOpen: boolean;
  stage: 'preparing' | 'genetic-algorithm' | 'optimizing' | 'complete';
  progress: number;
  currentGeneration?: number;
  totalGenerations?: number;
  bestUtilization?: number;
  itemCount?: number;
  elapsedSeconds?: number;
}

export default function NestingProgressModal({
  isOpen,
  stage,
  progress,
  currentGeneration = 0,
  totalGenerations = 40,
  bestUtilization = 0,
  itemCount = 0,
  elapsedSeconds = 0
}: NestingProgressModalProps) {
  
  const getStageInfo = () => {
    switch (stage) {
      case 'preparing':
        return {
          icon: <Package className="h-8 w-8 text-blue-500 animate-pulse" />,
          title: 'Preparing Images',
          description: `Processing ${itemCount} design${itemCount !== 1 ? 's' : ''}...`
        };
      case 'genetic-algorithm':
        return {
          icon: <Layers className="h-8 w-8 text-purple-500 animate-spin" />,
          title: 'Arranging Designs',
          description: 'Optimizing your layout...'
        };
      case 'optimizing':
        return {
          icon: <Zap className="h-8 w-8 text-yellow-500 animate-bounce" />,
          title: 'Finalizing Layout',
          description: 'Almost done...'
        };
      case 'complete':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
          title: 'Layout Complete!',
          description: 'Your gang sheet is ready'
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {stageInfo.icon}
            <DialogTitle className="text-2xl text-center">
              {stageInfo.title}
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              {stageInfo.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-3" />
            <p className="text-xs text-center text-muted-foreground">
              {progress.toFixed(0)}% Complete
            </p>
          </div>

          {/* Progress Details */}
          {stage === 'genetic-algorithm' && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Designs:</span>
                <span className="font-semibold">{itemCount}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {stage === 'complete' && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Successfully arranged {itemCount} design{itemCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Processing Info */}
          {stage !== 'complete' && (
            <div className="space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                Creating your optimized gang sheet...
              </p>
              
              {/* Warning not to navigate away */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2 text-center">
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  ⚠️ Please don&apos;t navigate away from this page
                </p>
              </div>
              
              {/* Extended processing message after 30 seconds */}
              {elapsedSeconds >= 30 && (
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center animate-pulse">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    🎯 Still optimizing - hang tight!
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    We&apos;re maximizing your sheet space for the best value. Won&apos;t be much longer!
                  </p>
                </div>
              )}
              {/* Extra encouragement after 45 seconds */}
              {elapsedSeconds >= 45 && (
                <p className="text-xs text-center text-muted-foreground">
                  Large orders take a bit longer to optimize perfectly ✨
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
