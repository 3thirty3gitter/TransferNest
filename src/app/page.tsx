import Header from '@/components/layout/header';
import NestingTool from '@/components/nesting-tool';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        <NestingTool />
      </main>
    </div>
  );
}
