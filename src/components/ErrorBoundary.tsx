import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 bg-red-50 text-red-900 h-screen w-screen overflow-auto">
            <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
            <pre className="p-4 bg-red-100 rounded text-sm font-mono whitespace-pre-wrap">
                {this.state.error?.toString()}
            </pre>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
                Reload App
            </button>
        </div>
      );
    }

    return this.props.children;
  }
}
