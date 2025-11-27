'use client';

import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import NestingTool from '@/components/nesting-tool';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function NestingToolFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="glass-strong rounded-2xl p-8">
        <div className="animate-pulse text-white">Loading your workspace...</div>
      </div>
    </div>
  )
}

function NestingToolContent() {
  const searchParams = useSearchParams();
  const [shouldOpenWizard, setShouldOpenWizard] = useState(false);

  useEffect(() => {
    if (searchParams.get('openWizard') === 'true') {
      setShouldOpenWizard(true);
    }
  }, [searchParams]);

  return <NestingTool sheetWidth={13} openWizard={shouldOpenWizard} />;
}

export default function NestingTool13Page() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      <Header />
      {/* Spacer for fixed header */}
      <div className="h-40"></div>
      <main className="flex-1">
        <Suspense fallback={<NestingToolFallback/>}>
          <NestingToolContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
