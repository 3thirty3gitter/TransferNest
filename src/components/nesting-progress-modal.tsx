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
}

export default function NestingProgressModal({
  isOpen,
  stage,
  progress,
  currentGeneration = 0,
  totalGenerations = 40,
  bestUtilization = 0,
  itemCount = 0
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
          title: 'Running Genetic Algorithm',
          description: `Generation ${currentGeneration} of ${totalGenerations}`
        };
      case 'optimizing':
        return {
          icon: <Zap className="h-8 w-8 text-yellow-500 animate-bounce" />,
          title: 'Optimizing Layout',
          description: 'Finding best placement strategy...'
        };
      case 'complete':
        return {
          icon: <CheckCircle2 className="h-8 w-8 text-green-500" />,
          title: 'Nesting Complete!',
          description: `Achieved ${bestUtilization.toFixed(1)}% utilization`
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

          {/* Genetic Algorithm Details */}
          {stage === 'genetic-algorithm' && (
            <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Best:</span>
                <span className="font-semibold text-primary">
                  {bestUtilization.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Generation:</span>
                <span className="font-semibold">
                  {currentGeneration} / {totalGenerations}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-semibold">{itemCount}</span>
              </div>
            </div>
          )}

          {/* Success Message */}
          {stage === 'complete' && (
            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Successfully nested {itemCount} design{itemCount !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                Material utilization optimized with genetic algorithm
              </p>
            </div>
          )}

          {/* Processing Info */}
          {stage !== 'complete' && (
            <p className="text-xs text-center text-muted-foreground">
              Using state-of-the-art genetic algorithm for optimal placement...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
