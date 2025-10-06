
'use client';

import { useState, useReducer, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { executeNesting, calculateOccupancy, VIRTUAL_SHEET_HEIGHT } from '@/lib/nesting-algorithm';
import SheetPreview from '@/components/sheet-preview';
import type { NestedLayout } from '@/app/schema';
import { toast } from '@/hooks/use-toast';
import { recordNestingRun } from "@/lib/nesting-telemetry";

type TestConfig = {
  iterations: number;
  sheetWidth: 13 | 17;
  numUniqueImages: number;
  minDim: number;
  maxDim: number;
  minCopies: number;
  maxCopies: number;
};

type TestStats = {
  totalIterations: number;
  currentIteration: number;
  avgEfficiency: number;
  bestEfficiency: number;
  worstEfficiency: number;
};

type TestResult = {
  efficiency: number;
  layout: NestedLayout;
  sheetLength: number;
  sheetWidth: number;
};

type State = {
  config: TestConfig;
  stats: TestStats;
  bestResult: TestResult | null;
  worstResult: TestResult | null;
  isRunning: boolean;
  isPaused: boolean;
};

const initialState: State = {
  config: {
    iterations: 1000,
    sheetWidth: 17,
    numUniqueImages: 10,
    minDim: 1,
    maxDim: 12,
    minCopies: 1,
    maxCopies: 5,
  },
  stats: {
    totalIterations: 0,
    currentIteration: 0,
    avgEfficiency: 0,
    bestEfficiency: 0,
    worstEfficiency: 1,
  },
  bestResult: null,
  worstResult: null,
  isRunning: false,
  isPaused: false,
};

function reducer(state: State, action: any): State {
  switch (action.type) {
    case 'UPDATE_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    case 'START_TEST':
      return {
        ...state,
        isRunning: true,
        isPaused: false,
        stats: {
          ...initialState.stats,
          totalIterations: state.config.iterations,
          worstEfficiency: 1,
        },
        bestResult: null,
        worstResult: null,
      };
    case 'PAUSE_TEST':
      return { ...state, isPaused: true };
    case 'RESUME_TEST':
      return { ...state, isPaused: false };
    case 'STOP_TEST':
      return { ...state, isRunning: false, isPaused: false };
    case 'RESET_TEST':
      return { ...initialState, config: state.config };
    case 'UPDATE_STATS':
      return { ...state, stats: { ...state.stats, ...action.payload } };
    case 'SET_BEST_RESULT':
      return { ...state, bestResult: action.payload };
    case 'SET_WORST_RESULT':
      return { ...state, worstResult: action.payload };
    default:
      return state;
  }
}

// Helper to generate a random number in a range
const rand = (min: number, max: number) => Math.random() * (max - min) + min;

export default function NestingTesterPage() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let animationFrameId: number;

    const runTestIteration = () => {
      if (state.isPaused || !state.isRunning) {
        return;
      }
      
      const { config, stats } = state;
      
      if (stats.currentIteration >= config.iterations) {
        dispatch({ type: 'STOP_TEST' });
        toast({ title: 'Test Complete!', description: `${config.iterations} iterations completed.`});
        return;
      }

      // 1. Generate random images
      const images = Array.from({ length: config.numUniqueImages }, (_, i) => ({
        id: `img-${i}`,
        url: 'https://placehold.co/300x300.png?bg=e2e8f0https://placehold.co/300x300/e2e8f0/e2e8f0text=%20', // Placeholder, not rendered
        width: rand(config.minDim, config.maxDim),
        height: rand(config.minDim, config.maxDim),
        copies: Math.round(rand(config.minCopies, config.maxCopies)),
        dataAiHint: 'placeholder',
        aspectRatio: 1,
      }));

      // 2. Run nesting algorithm
      const result = executeNesting(images, config.sheetWidth, VIRTUAL_SHEET_HEIGHT * 2);
      
      // 2.5 Log the result for analysis
      recordNestingRun({ context: 'tester', sheetWidth: config.sheetWidth, images, result });

      // 3. Calculate efficiency
      const efficiency = result.areaUtilizationPct;

      // 4. Update stats
      const newIteration = stats.currentIteration + 1;
      const newAvgEfficiency = (stats.avgEfficiency * stats.currentIteration + efficiency) / newIteration;
      
      let newBestResult = state.bestResult;
      if (!state.bestResult || efficiency > state.bestResult.efficiency) {
        newBestResult = { ...result, efficiency, sheetWidth: config.sheetWidth, layout: result.placedItems };
        dispatch({ type: 'SET_BEST_RESULT', payload: newBestResult });
      }

      let newWorstResult = state.worstResult;
      if (!state.worstResult || efficiency < state.worstResult.efficiency) {
        newWorstResult = { ...result, efficiency, sheetWidth: config.sheetWidth, layout: result.placedItems };
        dispatch({ type: 'SET_WORST_RESULT', payload: newWorstResult });
      }

      dispatch({
        type: 'UPDATE_STATS',
        payload: {
          currentIteration: newIteration,
          avgEfficiency: newAvgEfficiency,
          bestEfficiency: newBestResult?.efficiency ?? 0,
          worstEfficiency: newWorstResult?.efficiency ?? 1,
        },
      });

      animationFrameId = requestAnimationFrame(runTestIteration);
    };

    if (state.isRunning && !state.isPaused) {
      animationFrameId = requestAnimationFrame(runTestIteration);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state.isRunning, state.isPaused, state.config, state.stats, state.bestResult, state.worstResult]);


  const handleStart = () => dispatch({ type: 'START_TEST' });
  const handlePause = () => dispatch({ type: 'PAUSE_TEST' });
  const handleResume = () => dispatch({ type: 'RESUME_TEST' });
  const handleReset = () => dispatch({ type: 'RESET_TEST' });
  
  const handleConfigChange = (key: string, value: string | number) => {
    const numericValue = typeof value === 'string' && key !== 'method' ? parseFloat(value) : value;
    if (key !== 'method' && isNaN(numericValue as number)) return;

    dispatch({ type: 'UPDATE_CONFIG', payload: { [key]: numericValue } });
  };

  const progress = state.stats.totalIterations > 0 ? (state.stats.currentIteration / state.stats.totalIterations) * 100 : 0;

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" className="mb-4">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
      <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-headline font-bold">Nesting Algorithm Stress Tester</h1>
          <p className="mt-2 max-w-2xl mx-auto text-muted-foreground">
              Run the algorithm through thousands of random permutations to test its efficiency and find edge cases.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Config and Controls */}
        <div className="md:col-span-1 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Test Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="iterations">Iterations</Label>
                        <Input id="iterations" type="number" value={state.config.iterations} onChange={e => handleConfigChange('iterations', e.target.value)} disabled={state.isRunning}/>
                    </div>
                     <div className="space-y-2">
                        <Label>Sheet Width</Label>
                        <Select value={state.config.sheetWidth.toString()} onValueChange={v => handleConfigChange('sheetWidth', v)} disabled={state.isRunning}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="13">13 inches</SelectItem>
                                <SelectItem value="17">17 inches</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Unique Images per Iteration</Label>
                        <Input type="number" value={state.config.numUniqueImages} onChange={e => handleConfigChange('numUniqueImages', e.target.value)} disabled={state.isRunning}/>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Min Dimension</Label>
                            <Input type="number" value={state.config.minDim} onChange={e => handleConfigChange('minDim', e.target.value)} disabled={state.isRunning}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Max Dimension</Label>
                            <Input type="number" value={state.config.maxDim} onChange={e => handleConfigChange('maxDim', e.target.value)} disabled={state.isRunning}/>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Min Copies</Label>
                            <Input type="number" value={state.config.minCopies} onChange={e => handleConfigChange('minCopies', e.target.value)} disabled={state.isRunning}/>
                        </div>
                        <div className="space-y-2">
                            <Label>Max Copies</Label>
                            <Input type="number" value={state.config.maxCopies} onChange={e => handleConfigChange('maxCopies', e.target.value)} disabled={state.isRunning}/>
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Controls</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-2">
                    {!state.isRunning ? (
                         <Button onClick={handleStart} className="w-full"><Play className="mr-2"/> Start Test</Button>
                    ) : state.isPaused ? (
                        <Button onClick={handleResume} className="w-full"><Play className="mr-2"/> Resume</Button>
                    ) : (
                        <Button onClick={handlePause} variant="secondary" className="w-full"><Pause className="mr-2"/> Pause</Button>
                    )}
                   
                    <Button onClick={handleReset} variant="outline" disabled={!state.isRunning && state.stats.currentIteration === 0}><RotateCcw className="mr-2"/> Reset</Button>
                </CardContent>
            </Card>
        </div>

        {/* Results */}
        <div className="md:col-span-2 flex flex-col gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Test Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Progress</span>
                            <span>{state.stats.currentIteration} / {state.stats.totalIterations} iterations</span>
                        </div>
                        <Progress value={progress} />
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Avg. Efficiency</p>
                            <p className="text-2xl font-bold">{(state.stats.avgEfficiency * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Best Efficiency</p>
                            <p className="text-2xl font-bold text-green-500">{(state.stats.bestEfficiency * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Worst Efficiency</p>
                            <p className="text-2xl font-bold text-red-500">{(state.stats.worstEfficiency === 1 && state.stats.currentIteration === 0) ? '0.00' : (state.stats.worstEfficiency * 100).toFixed(2)}%</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Best Result</CardTitle>
                        <CardDescription>Highest packing efficiency found so far.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         {state.bestResult ? (
                            <SheetPreview 
                                sheetWidth={state.bestResult.sheetWidth}
                                sheetLength={state.bestResult.sheetLength}
                                nestedLayout={state.bestResult.layout}
                                isLoading={false}
                            />
                        ) : <p className="text-muted-foreground text-center py-8">Waiting for results...</p>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Worst Result</CardTitle>
                        <CardDescription>Lowest packing efficiency found so far.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {state.worstResult ? (
                            <SheetPreview 
                                sheetWidth={state.worstResult.sheetWidth}
                                sheetLength={state.worstResult.sheetLength}
                                nestedLayout={state.worstResult.layout}
                                isLoading={false}
                            />
                        ) : <p className="text-muted-foreground text-center py-8">Waiting for results...</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

    

    

    