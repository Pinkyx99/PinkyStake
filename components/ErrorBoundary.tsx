
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }
  
  private handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-white p-8">
          <h1 className="text-4xl font-bebas text-red-500 mb-4">Oops! Something went wrong.</h1>
          <p className="text-lg text-gray-300 mb-6 text-center">An unexpected error occurred. Refreshing the page may fix the issue.</p>
          {this.state.error && (
            <pre className="bg-gray-900/50 p-4 rounded-lg text-left text-sm text-red-300 w-full max-w-2xl overflow-auto mb-6">
              {this.state.error.toString()}
            </pre>
          )}
          <button
            onClick={this.handleRefresh}
            className="px-8 py-3 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-md transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
