'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { reportError, getBrowserInfo, detectBrowserIssues } from '@/lib/error-telemetry';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  component?: string; // Name of the component/feature being wrapped
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  browserIssues: string[];
}

/**
 * Error Boundary Component
 * Catches React errors in child components and reports them to telemetry
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      browserIssues: [],
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const browserInfo = getBrowserInfo();
    const browserIssues = detectBrowserIssues(browserInfo);
    
    this.setState({ errorInfo, browserIssues });

    // Report to telemetry
    reportError(error, {
      component: this.props.component || 'ErrorBoundary',
      action: 'react-render',
      metadata: {
        componentStack: errorInfo.componentStack,
        browserIssues,
      },
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to console
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      browserIssues: [],
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-card border border-destructive/20 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            
            <p className="text-muted-foreground mb-4">
              We've logged this error and will look into it. In the meantime, you can try:
            </p>

            {/* Browser compatibility warnings */}
            {this.state.browserIssues.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-left">
                <p className="text-sm font-medium text-amber-400 mb-1">Possible browser issues detected:</p>
                <ul className="text-sm text-amber-300/80 list-disc list-inside">
                  {this.state.browserIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button onClick={this.handleReload} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button asChild variant="default">
                <Link href="/">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>

            {/* Technical details (collapsed by default) */}
            <details className="mt-6 text-left">
              <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-48">
                <p className="text-destructive">{this.state.error?.message}</p>
                {this.state.error?.stack && (
                  <pre className="mt-2 text-muted-foreground whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                )}
              </div>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap a component with error boundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary component={componentName || WrappedComponent.displayName || WrappedComponent.name}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  WithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  
  return WithErrorBoundary;
}

/**
 * Specialized error boundary for the nesting tool
 */
export function NestingErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      component="NestingTool"
      fallback={
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-card border border-destructive/20 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Gang Sheet Builder Error</h2>
            
            <p className="text-muted-foreground mb-4">
              The gang sheet builder encountered an error. This has been logged for our team to investigate.
            </p>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-left">
              <p className="text-sm font-medium text-blue-400 mb-1">Try these steps:</p>
              <ul className="text-sm text-blue-300/80 list-disc list-inside space-y-1">
                <li>Refresh the page and try again</li>
                <li>Use fewer or smaller images</li>
                <li>Try a different browser (Chrome recommended)</li>
                <li>Clear your browser cache</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => window.location.reload()} variant="default">
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Builder
              </Button>
              <Button asChild variant="outline">
                <Link href="/contact">
                  Contact Support
                </Link>
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
