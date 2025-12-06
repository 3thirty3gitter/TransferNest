'use client';

import React, { useState } from 'react';
import { executeNesting, ManagedImage, NestingResult } from '@/lib/nesting-algorithm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';

interface DetailedTestResult {
  testName: string;
  sheetWidth: 17;
  result: NestingResult;
  images: ManagedImage[];
  timestamp: string;
  performanceMetrics: {
    totalAttempts: number;
    totalArea: number;
    usedArea: number;
    wastedArea: number;
    averageItemSize: number;
    largestItem: { width: number; height: number };
    smallestItem: { width: number; height: number };
    rotationRate: number;
    spacingEfficiency: number;
  };
}

interface ComparisonMetrics {
  utilizationDiff: number;
  lengthDiff: number;
  better: 17 | 'tie';
  recommendation: string;
}

export default function AlgorithmReporter() {
  const [results, setResults] = useState<DetailedTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showConsoleLog, setShowConsoleLog] = useState(false);

  // Generate comprehensive test data
  const generateTestScenario = (scenario: string): ManagedImage[] => {
    const placeholderUrl = (w: number, h: number, id: string) => 
      `https://placehold.co/${Math.round(w * 50)}x${Math.round(h * 50)}/png?text=${id}`;

    switch (scenario) {
      case 'realistic-mixed':
        return [
          { id: 'r1', url: placeholderUrl(8, 6, 'r1'), width: 8, height: 6, aspectRatio: 8/6, copies: 2, dataAiHint: 'text' },
          { id: 'r2', url: placeholderUrl(4, 4, 'r2'), width: 4, height: 4, aspectRatio: 1, copies: 3, dataAiHint: 'logo' },
          { id: 'r3', url: placeholderUrl(10, 3, 'r3'), width: 10, height: 3, aspectRatio: 10/3, copies: 2, dataAiHint: 'banner' },
          { id: 'r4', url: placeholderUrl(3, 8, 'r4'), width: 3, height: 8, aspectRatio: 3/8, copies: 2, dataAiHint: 'vertical' },
          { id: 'r5', url: placeholderUrl(6, 6, 'r5'), width: 6, height: 6, aspectRatio: 1, copies: 1, dataAiHint: 'square' },
          { id: 'r6', url: placeholderUrl(5, 2, 'r6'), width: 5, height: 2, aspectRatio: 5/2, copies: 4, dataAiHint: 'small banner' },
        ];
      
      case 'small-items':
        const small: ManagedImage[] = [];
        for (let i = 0; i < 25; i++) {
          const w = 1.5 + Math.random() * 2.5;
          const h = 1.5 + Math.random() * 2.5;
          small.push({
            id: `sm${i}`,
            url: placeholderUrl(w, h, `sm${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'small'
          });
        }
        return small;
      
      case 'large-items':
        const large: ManagedImage[] = [];
        for (let i = 0; i < 6; i++) {
          const w = 7 + Math.random() * 4;
          const h = 5 + Math.random() * 5;
          large.push({
            id: `lg${i}`,
            url: placeholderUrl(w, h, `lg${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'large'
          });
        }
        return large;
      
      case 'vertical-heavy':
        const vertical: ManagedImage[] = [];
        for (let i = 0; i < 12; i++) {
          const w = 2.5 + Math.random() * 1.5;
          const h = 6 + Math.random() * 4;
          vertical.push({
            id: `vt${i}`,
            url: placeholderUrl(w, h, `vt${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'vertical'
          });
        }
        return vertical;
      
      case 'horizontal-heavy':
        const horizontal: ManagedImage[] = [];
        for (let i = 0; i < 12; i++) {
          const w = 7 + Math.random() * 4;
          const h = 2 + Math.random() * 1.5;
          horizontal.push({
            id: `hz${i}`,
            url: placeholderUrl(w, h, `hz${i}`),
            width: w,
            height: h,
            aspectRatio: w / h,
            copies: 1,
            dataAiHint: 'horizontal'
          });
        }
        return horizontal;
      
      case 'edge-case-narrow':
        return [
          { id: 'n1', url: placeholderUrl(12, 2, 'n1'), width: 12, height: 2, aspectRatio: 6, copies: 3, dataAiHint: 'very wide' },
          { id: 'n2', url: placeholderUrl(11, 1.5, 'n2'), width: 11, height: 1.5, aspectRatio: 7.33, copies: 2, dataAiHint: 'extremely wide' },
        ];
      
      case 'edge-case-tall':
        return [
          { id: 't1', url: placeholderUrl(2, 12, 't1'), width: 2, height: 12, aspectRatio: 0.167, copies: 3, dataAiHint: 'very tall' },
          { id: 't2', url: placeholderUrl(1.5, 15, 't2'), width: 1.5, height: 15, aspectRatio: 0.1, copies: 2, dataAiHint: 'extremely tall' },
        ];
      
      default:
        return [];
    }
  };

  // Calculate detailed performance metrics
  const calculateMetrics = (images: ManagedImage[], result: NestingResult): DetailedTestResult['performanceMetrics'] => {
    const totalArea = result.sheetLength * (result.placedItems.length > 0 ? 
      (result.placedItems[0].width <= 13 ? 13 : 17) : 13);
    
    const usedArea = result.placedItems.reduce((sum, item) => 
      sum + (item.width * item.height), 0
    );
    
    const rotatedCount = result.placedItems.filter(item => item.rotated).length;
    const rotationRate = result.placedItems.length > 0 
      ? rotatedCount / result.placedItems.length 
      : 0;

    const itemSizes = images.map(img => img.width * img.height);
    const averageItemSize = itemSizes.reduce((a, b) => a + b, 0) / images.length;
    
    const largestItem = images.reduce((max, img) => 
      (img.width * img.height > max.width * max.height) ? img : max
    );
    
    const smallestItem = images.reduce((min, img) => 
      (img.width * img.height < min.width * min.height) ? img : min
    );

    return {
      totalAttempts: 20, // Known from algorithm (4 strategies × 5 paddings)
      totalArea,
      usedArea,
      wastedArea: totalArea - usedArea,
      averageItemSize,
      largestItem: { width: largestItem.width, height: largestItem.height },
      smallestItem: { width: smallestItem.width, height: smallestItem.height },
      rotationRate,
      spacingEfficiency: usedArea / totalArea
    };
  };

  // Run comprehensive test
  const runDetailedTest = async (testName: string, scenario: string) => {
    setIsRunning(true);
    const images = generateTestScenario(scenario);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 DETAILED TEST: ${testName}`);
    console.log(`${'='.repeat(60)}`);
    
    // Test 17" sheets only
    const size = 17;
    const newResults: DetailedTestResult[] = [];
    
    console.log(`\n--- Testing ${size}" Sheet ---`);
    const result = await executeNesting(images, size);
    const metrics = calculateMetrics(images, result);
    
    newResults.push({
      testName,
      sheetWidth: size,
      result,
      images,
      timestamp: new Date().toISOString(),
      performanceMetrics: metrics
    });
    
    // Detailed console output
    console.log(`📊 ${size}" Results:`);
    console.log(`  Utilization: ${(result.areaUtilizationPct * 100).toFixed(2)}%`);
    console.log(`  Sheet Length: ${result.sheetLength.toFixed(2)}"`);
    console.log(`  Placed/Total: ${result.placedItems.length}/${result.totalCount}`);
    console.log(`  Failed: ${result.failedCount}`);
    console.log(`  Strategy: ${result.sortStrategy}`);
    console.log(`  Rotation Rate: ${(metrics.rotationRate * 100).toFixed(1)}%`);
    console.log(`  Wasted Area: ${metrics.wastedArea.toFixed(2)} sq in`);
    console.log(`  Avg Item Size: ${metrics.averageItemSize.toFixed(2)} sq in`);
    
    setResults(prev => [...prev, ...newResults]);
    setIsRunning(false);
  };

  // Run all comprehensive tests
  const runAllTests = async () => {
    setResults([]);
    await runDetailedTest('Realistic Mixed Workload', 'realistic-mixed');
    await runDetailedTest('Many Small Items (25)', 'small-items');
    await runDetailedTest('Few Large Items (6)', 'large-items');
    await runDetailedTest('Vertical-Heavy (12 tall items)', 'vertical-heavy');
    await runDetailedTest('Horizontal-Heavy (12 wide items)', 'horizontal-heavy');
    await runDetailedTest('Edge Case: Very Wide Items', 'edge-case-narrow');
    await runDetailedTest('Edge Case: Very Tall Items', 'edge-case-tall');
  };

  // Get metrics for 17" test
  const getComparison = (testName: string): ComparisonMetrics | null => {
    const test17 = results.find(r => r.testName === testName && r.sheetWidth === 17);
    
    if (!test17) return null;
    
    return { 
      utilizationDiff: 0, 
      lengthDiff: 0, 
      better: 17, 
      recommendation: `17" sheet utilization: ${(test17.result.areaUtilizationPct * 100).toFixed(1)}%`
    };
  };

  // Export detailed report
  const exportReport = () => {
    const uniqueTests = [...new Set(results.map(r => r.testName))];
    
    let report = '# Nesting Algorithm Performance Report\n\n';
    report += `Generated: ${new Date().toLocaleString()}\n\n`;
    report += `## Executive Summary\n\n`;
    
    const avg17 = results.filter(r => r.sheetWidth === 17)
      .reduce((sum, r) => sum + r.result.areaUtilizationPct, 0) / 
      results.filter(r => r.sheetWidth === 17).length;
    
    report += `- **17" Average Utilization:** ${(avg17 * 100).toFixed(2)}%\n`;
    report += `- **Total Tests Run:** ${uniqueTests.length}\n\n`;
    
    report += `## Detailed Results\n\n`;
    
    uniqueTests.forEach(testName => {
      const comparison = getComparison(testName);
      const test17 = results.find(r => r.testName === testName && r.sheetWidth === 17);
      
      report += `### ${testName}\n\n`;
      
      if (test17) {
        report += `#### 17" Sheet\n`;
        report += `- Utilization: ${(test17.result.areaUtilizationPct * 100).toFixed(2)}%\n`;
        report += `- Sheet Length: ${test17.result.sheetLength.toFixed(2)}"\n`;
        report += `- Placed Items: ${test17.result.placedItems.length}/${test17.result.totalCount}\n`;
        report += `- Failed: ${test17.result.failedCount}\n`;
        report += `- Strategy: ${test17.result.sortStrategy}\n`;
        report += `- Rotation Rate: ${(test17.performanceMetrics.rotationRate * 100).toFixed(1)}%\n`;
        report += `- Wasted Area: ${test17.performanceMetrics.wastedArea.toFixed(2)} sq in\n\n`;
      }
      
      if (comparison) {
        report += `#### Summary\n`;
        report += `- ${comparison.recommendation}\n\n`;
      }
      
      report += `---\n\n`;
    });
    
    report += `## Recommendations\n\n`;
    
    const failures17 = results.filter(r => r.sheetWidth === 17 && r.result.failedCount > 0);
    
    if (failures17.length > 0) {
      report += `### 17" Sheet Issues\n`;
      failures17.forEach(f => {
        report += `- **${f.testName}:** ${f.result.failedCount} items failed to place\n`;
      });
      report += '\n';
    }
    
    if (avg17 < 0.85) {
      report += `- ⚠️ 17" algorithm averaging below 85% - consider optimizing rotation thresholds\n`;
    }
    
    // Download the report
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `algorithm-report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const uniqueTests = [...new Set(results.map(r => r.testName))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Algorithm Analysis & Reporting</CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed performance metrics, diagnostics, and optimization recommendations
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={runAllTests} disabled={isRunning} size="lg">
              {isRunning ? 'Running Tests...' : 'Run Full Test Suite'}
            </Button>
            <Button onClick={exportReport} disabled={results.length === 0} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Report (Markdown)
            </Button>
            <Button onClick={() => setResults([])} variant="destructive" disabled={isRunning}>
              Clear Results
            </Button>
          </div>

          {isRunning && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
              Running comprehensive tests... Check console for detailed logs
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Metrics</TabsTrigger>
            <TabsTrigger value="comparison">Comparisons</TabsTrigger>
            <TabsTrigger value="issues">Issues & Fixes</TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2">17" Sheet Performance</h3>
                    <div className="text-3xl font-bold">
                      {(results.filter(r => r.sheetWidth === 17)
                        .reduce((sum, r) => sum + r.result.areaUtilizationPct, 0) / 
                        results.filter(r => r.sheetWidth === 17).length * 100).toFixed(1)}%
                    </div>
                    <p className="text-sm text-muted-foreground">Average Utilization</p>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test Scenario</TableHead>
                      <TableHead>17" Util</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueTests.map(testName => {
                      const test17 = results.find(r => r.testName === testName && r.sheetWidth === 17);
                      const comparison = getComparison(testName);
                      
                      return (
                        <TableRow key={testName}>
                          <TableCell className="font-medium">{testName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {test17 && (
                                <>
                                  <span className="font-mono">{(test17.result.areaUtilizationPct * 100).toFixed(1)}%</span>
                                  {test17.result.failedCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {test17.result.failedCount} failed
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {comparison && (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">
                                  {comparison.recommendation}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Detailed Metrics Tab */}
          <TabsContent value="detailed">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Test</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Utilization</TableHead>
                      <TableHead>Length</TableHead>
                      <TableHead>Rotation %</TableHead>
                      <TableHead>Wasted Area</TableHead>
                      <TableHead>Strategy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{result.testName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {result.sheetWidth}"
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">
                          {(result.result.areaUtilizationPct * 100).toFixed(2)}%
                        </TableCell>
                        <TableCell className="font-mono">
                          {result.result.sheetLength.toFixed(2)}"
                        </TableCell>
                        <TableCell className="font-mono">
                          {(result.performanceMetrics.rotationRate * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="font-mono">
                          {result.performanceMetrics.wastedArea.toFixed(2)} in²
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {result.result.sortStrategy}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comparison Tab */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle>17" Sheet Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {uniqueTests.map(testName => {
                  const comparison = getComparison(testName);
                  const test17 = results.find(r => r.testName === testName && r.sheetWidth === 17);
                  
                  if (!comparison || !test17) return null;
                  
                  return (
                    <div key={testName} className="p-4 border rounded-lg">
                      <h3 className="font-semibold mb-3">{testName}</h3>
                      <div className="grid grid-cols-1 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground">17" Sheet</p>
                          <p className="text-2xl font-bold">{(test17.result.areaUtilizationPct * 100).toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">{test17.result.sheetLength.toFixed(2)}" length</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <p className="text-sm font-medium">{comparison.recommendation}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issues & Fixes Tab */}
          <TabsContent value="issues">
            <Card>
              <CardHeader>
                <CardTitle>Issues Detected & Recommended Fixes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Check for failures */}
                {results.filter(r => r.result.failedCount > 0).length > 0 && (
                  <div className="p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-950">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-red-900 dark:text-red-100">Failed Placements Detected</h3>
                        <ul className="mt-2 space-y-1 text-sm text-red-800 dark:text-red-200">
                          {results.filter(r => r.result.failedCount > 0).map((r, idx) => (
                            <li key={idx}>
                              • {r.testName} ({r.sheetWidth}"): {r.result.failedCount} items failed
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm font-medium text-red-900 dark:text-red-100">
                          💡 Fix: Items may be too large for sheet width. Consider adding width validation or increasing rotation aggressiveness.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Check for low utilization */}
                {results.filter(r => r.result.areaUtilizationPct < 0.75).length > 0 && (
                  <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Low Utilization Detected (&lt;75%)</h3>
                        <ul className="mt-2 space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                          {results.filter(r => r.result.areaUtilizationPct < 0.75).map((r, idx) => (
                            <li key={idx}>
                              • {r.testName} ({r.sheetWidth}"): {(r.result.areaUtilizationPct * 100).toFixed(1)}%
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm font-medium text-yellow-900 dark:text-yellow-100">
                          💡 Fix: Try adjusting rotation thresholds, reducing minimum padding, or changing sort strategy priority.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Success cases */}
                {results.filter(r => r.result.areaUtilizationPct >= 0.90 && r.result.failedCount === 0).length > 0 && (
                  <div className="p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-950">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-green-900 dark:text-green-100">Excellent Performance (≥90%)</h3>
                        <ul className="mt-2 space-y-1 text-sm text-green-800 dark:text-green-200">
                          {results.filter(r => r.result.areaUtilizationPct >= 0.90 && r.result.failedCount === 0).map((r, idx) => (
                            <li key={idx}>
                              • {r.testName} ({r.sheetWidth}"): {(r.result.areaUtilizationPct * 100).toFixed(1)}% - Strategy: {r.result.sortStrategy}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-sm font-medium text-green-900 dark:text-green-100">
                          ✅ These scenarios are working well! Use these strategies as reference.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Algorithm recommendations */}
                <div className="p-4 border rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2">Algorithm Optimization Recommendations</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary">1.</span>
                      <span>Review rotation thresholds for sizes with low utilization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary">2.</span>
                      <span>Consider trying WIDTH_DESC first for sheets with wide items</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary">3.</span>
                      <span>Analyze which sort strategies perform best for each scenario</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary">4.</span>
                      <span>Test tighter padding values (0.02", 0.01") for small item scenarios</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-mono text-primary">5.</span>
                      <span>Add pre-validation to reject items wider than sheet width</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
