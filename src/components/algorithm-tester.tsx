'use client';

import React, { useState } from 'react';
import { executeNesting, ManagedImage } from '@/lib/nesting-algorithm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SheetPreview from './sheet-preview';

interface TestResult {
  sheetWidth: 13 | 17;
  utilization: number;
  placedCount: number;
  failedCount: number;
  sheetLength: number;
  sortStrategy: string;
  packingMethod: string;
  testName: string;
  imageCount: number;
}

export default function AlgorithmTester() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<{
    images: ManagedImage[];
    result13?: any;
    result17?: any;
  } | null>(null);

  // Generate test scenarios
  const generateTestScenario = (scenario: 'mixed' | 'small' | 'large' | 'vertical' | 'horizontal'): ManagedImage[] => {
    const images: ManagedImage[] = [];
    // Use placeholder image service for test data
    const placeholderUrl = (w: number, h: number, id: string) => 
      `https://placehold.co/${Math.round(w * 50)}x${Math.round(h * 50)}/png?text=${id}`;
    
    switch (scenario) {
      case 'mixed':
        // Mix of sizes and aspect ratios
        images.push(
          { id: 'm1', url: placeholderUrl(8, 6, 'm1'), width: 8, height: 6, aspectRatio: 8/6, copies: 2, dataAiHint: 'text' },
          { id: 'm2', url: placeholderUrl(4, 3, 'm2'), width: 4, height: 3, aspectRatio: 4/3, copies: 3, dataAiHint: 'logo' },
          { id: 'm3', url: placeholderUrl(6, 2, 'm3'), width: 6, height: 2, aspectRatio: 6/2, copies: 2, dataAiHint: 'banner' },
          { id: 'm4', url: placeholderUrl(3, 5, 'm4'), width: 3, height: 5, aspectRatio: 3/5, copies: 2, dataAiHint: 'vertical text' },
          { id: 'm5', url: placeholderUrl(10, 4, 'm5'), width: 10, height: 4, aspectRatio: 10/4, copies: 1, dataAiHint: 'wide banner' }
        );
        break;
      
      case 'small':
        // Many small items
        for (let i = 0; i < 20; i++) {
          const w = 2 + Math.random() * 2;
          const h = 2 + Math.random() * 2;
          images.push({
            id: `s${i}`,
            url: placeholderUrl(w, h, `s${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'small item'
          });
        }
        break;
      
      case 'large':
        // Fewer large items
        for (let i = 0; i < 5; i++) {
          const w = 8 + Math.random() * 4;
          const h = 6 + Math.random() * 4;
          images.push({
            id: `l${i}`,
            url: placeholderUrl(w, h, `l${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'large image'
          });
        }
        break;
      
      case 'vertical':
        // Tall/vertical items
        for (let i = 0; i < 10; i++) {
          const w = 3 + Math.random();
          const h = 6 + Math.random() * 3;
          images.push({
            id: `v${i}`,
            url: placeholderUrl(w, h, `v${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'vertical text'
          });
        }
        break;
      
      case 'horizontal':
        // Wide/horizontal items
        for (let i = 0; i < 10; i++) {
          const w = 8 + Math.random() * 3;
          const h = 3 + Math.random();
          images.push({
            id: `h${i}`,
            url: placeholderUrl(w, h, `h${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'banner'
          });
        }
        break;
    }
    
    return images;
  };

  const runTest = async (scenarioName: string, scenario: 'mixed' | 'small' | 'large' | 'vertical' | 'horizontal') => {
    setIsRunning(true);
    const images = generateTestScenario(scenario);
    
    console.log(`\n🧪 Running Test: ${scenarioName}`);
    console.log(`📦 Images: ${images.length} items`);
    
    // Test 13" algorithm
    console.log('\n--- Testing 13" Sheet ---');
    const result13 = await executeNesting(images, 13);
    
    // Test 17" algorithm
    console.log('\n--- Testing 17" Sheet ---');
    const result17 = await executeNesting(images, 17);
    
    // Store results
    const newResults: TestResult[] = [
      {
        sheetWidth: 13,
        utilization: result13.areaUtilizationPct * 100,
        placedCount: result13.placedItems.length,
        failedCount: result13.failedCount,
        sheetLength: result13.sheetLength,
        sortStrategy: result13.sortStrategy,
        packingMethod: result13.packingMethod,
        testName: scenarioName,
        imageCount: images.length
      },
      {
        sheetWidth: 17,
        utilization: result17.areaUtilizationPct * 100,
        placedCount: result17.placedItems.length,
        failedCount: result17.failedCount,
        sheetLength: result17.sheetLength,
        sortStrategy: result17.sortStrategy,
        packingMethod: result17.packingMethod,
        testName: scenarioName,
        imageCount: images.length
      }
    ];
    
    setTestResults(prev => [...prev, ...newResults]);
    setCurrentTest({ images, result13, result17 });
    setIsRunning(false);
    
    // Log comparison
    console.log(`\n📊 Comparison:`);
    console.log(`13": ${result13.areaUtilizationPct.toFixed(3)} util, ${result13.sheetLength.toFixed(2)}" length`);
    console.log(`17": ${result17.areaUtilizationPct.toFixed(3)} util, ${result17.sheetLength.toFixed(2)}" length`);
  };

  const runAllTests = async () => {
    setTestResults([]);
    await runTest('Mixed Sizes', 'mixed');
    await runTest('Many Small Items', 'small');
    await runTest('Few Large Items', 'large');
    await runTest('Vertical Items', 'vertical');
    await runTest('Horizontal Items', 'horizontal');
  };

  const clearResults = () => {
    setTestResults([]);
    setCurrentTest(null);
  };

  const getUtilizationColor = (util: number) => {
    if (util >= 90) return 'bg-green-500';
    if (util >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Performance Tester</CardTitle>
          <p className="text-sm text-muted-foreground">
            Compare 13" vs 17" nesting algorithms across different scenarios
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={isRunning}>
              Run All Tests
            </Button>
            <Button onClick={() => runTest('Mixed Sizes', 'mixed')} variant="outline" disabled={isRunning}>
              Test Mixed
            </Button>
            <Button onClick={() => runTest('Many Small', 'small')} variant="outline" disabled={isRunning}>
              Test Small Items
            </Button>
            <Button onClick={() => runTest('Few Large', 'large')} variant="outline" disabled={isRunning}>
              Test Large Items
            </Button>
            <Button onClick={() => runTest('Vertical', 'vertical')} variant="outline" disabled={isRunning}>
              Test Vertical
            </Button>
            <Button onClick={() => runTest('Horizontal', 'horizontal')} variant="outline" disabled={isRunning}>
              Test Horizontal
            </Button>
            <Button onClick={clearResults} variant="destructive" disabled={isRunning}>
              Clear Results
            </Button>
          </div>

          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              Running tests...
            </div>
          )}
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test Name</TableHead>
                  <TableHead>Sheet</TableHead>
                  <TableHead>Utilization</TableHead>
                  <TableHead>Placed/Total</TableHead>
                  <TableHead>Sheet Length</TableHead>
                  <TableHead>Strategy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testResults.map((result, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{result.testName}</TableCell>
                    <TableCell>
                      <Badge variant={result.sheetWidth === 13 ? 'default' : 'secondary'}>
                        {result.sheetWidth}"
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-20 rounded-full bg-gray-200`}>
                          <div
                            className={`h-full rounded-full ${getUtilizationColor(result.utilization)}`}
                            style={{ width: `${Math.min(result.utilization, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-mono">{result.utilization.toFixed(1)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.placedCount}/{result.imageCount}
                      {result.failedCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {result.failedCount} failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">{result.sheetLength.toFixed(2)}"</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{result.sortStrategy}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {currentTest && currentTest.result13 && currentTest.result17 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>13" Sheet Preview</span>
                <Badge>{(currentTest.result13.areaUtilizationPct * 100).toFixed(1)}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SheetPreview
                nestedLayout={currentTest.result13.placedItems}
                sheetWidth={13}
                sheetLength={currentTest.result13.sheetLength}
                isLoading={false}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>17" Sheet Preview</span>
                <Badge>{(currentTest.result17.areaUtilizationPct * 100).toFixed(1)}%</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SheetPreview
                nestedLayout={currentTest.result17.placedItems}
                sheetWidth={17}
                sheetLength={currentTest.result17.sheetLength}
                isLoading={false}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
