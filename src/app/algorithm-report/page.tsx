import AlgorithmReporter from '@/components/algorithm-reporter';

export default function AlgorithmReportPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Algorithm Performance Reporter</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive analysis, diagnostics, and optimization recommendations for nesting algorithms
        </p>
      </div>
      <AlgorithmReporter />
    </div>
  );
}
