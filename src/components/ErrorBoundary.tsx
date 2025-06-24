import { Component, ErrorInfo, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { captureError } from "@/lib/analytics/posthog";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to PostHog
    captureError(error, "React Error Boundary", {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Also log to console for development
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600">
                We've encountered an unexpected error. The error has been logged
                and we'll look into it.
              </p>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <details className="mt-4 p-4 bg-red-50 rounded-lg">
                <summary className="cursor-pointer text-sm font-medium text-red-800">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-3 justify-center">
              <Button onClick={this.handleReset} variant="outline">
                Try Again
              </Button>
              <Button onClick={this.handleReload}>Reload Page</Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
