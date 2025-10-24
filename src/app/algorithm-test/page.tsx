import AlgorithmTester from '@/components/algorithm-tester';

export default function AlgorithmTestPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Nesting Algorithm Test Suite</h1>
        <p className="text-muted-foreground mt-2">
          Compare performance of 13" vs 17" sheet algorithms across different scenarios
        </p>
      </div>
      <AlgorithmTester />
    </div>
  );
}
