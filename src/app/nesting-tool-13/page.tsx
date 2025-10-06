
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import NestingTool from '@/components/nesting-tool';
import { Suspense } from 'react';

function NestingToolFallback() {
  return <div>Loading...</div>
}

export default function NestingTool13Page() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<NestingToolFallback/>}>
          <NestingTool sheetWidth={13} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
