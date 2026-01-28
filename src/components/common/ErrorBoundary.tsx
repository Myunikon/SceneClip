import { Component, ErrorInfo, ReactNode } from 'react';
import { useAppStore } from '../../store';
import { translations } from '../../lib/locales';
import { AlertTriangle, RefreshCcw, Copy, Check } from 'lucide-react';

interface Props {
  children?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

class ErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private copyError = async () => {
    if (this.state.error) {
      try {
        await navigator.clipboard.writeText(this.state.error.toString() + "\n" + this.state.error.stack);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2000);
      } catch (e) {
        console.error(e)
      }
    }
  }

  public render() {
    if (this.state.hasError) {
      const { t } = this.props;
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-500/5">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>

              <h1 className="text-2xl font-bold mb-2">{t.title || "Something went wrong"}</h1>
              <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                {t.description || "The application encountered an unexpected error. Please try reloading or check the logs."}
              </p>

              <div className="w-full bg-secondary/50 rounded-lg p-3 mb-6 relative group text-left">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={this.copyError}
                    className="p-1.5 hover:bg-background rounded-md text-muted-foreground transition-colors"
                    title="Copy Error"
                  >
                    {this.state.copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <pre className="text-xs font-mono text-red-500/80 overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                  {this.state.error?.toString()}
                </pre>
              </div>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-opacity"
                >
                  <RefreshCcw className="w-4 h-4" />
                  {t.reload || "Reload"}
                </button>
              </div>
            </div>

            <div className="bg-secondary/30 px-6 py-4 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
              <span>Error Code: 0xCRASH</span>
              <button onClick={() => window.location.href = '/'} className="hover:text-foreground transition-colors">
                Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorBoundary({ children }: { children?: ReactNode }) {
  const { settings } = useAppStore();
  const t = translations[settings.language].error_boundary;

  return <ErrorBoundaryClass t={t}>{children}</ErrorBoundaryClass>;
}
