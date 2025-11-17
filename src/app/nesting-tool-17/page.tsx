
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import NestingTool from '@/components/nesting-tool';
import { Suspense } from 'react';

function NestingToolFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass-strong rounded-2xl p-8">
        <div className="animate-pulse text-white">Loading your workspace...</div>
      </div>
    </div>
  )
}

export default function NestingTool17Page() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <Header />
      {/* Spacer for fixed header */}
      <div className="h-32"></div>
      <main className="flex-1">
        <Suspense fallback={<NestingToolFallback/>}>
          <NestingTool sheetWidth={17} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
