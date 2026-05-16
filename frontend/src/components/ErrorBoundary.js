import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-lg w-full border-2 border-destructive bg-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-3 h-3 bg-destructive animate-pulse"></div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-destructive">
                [ SYSTEM ERROR ]
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase text-foreground mb-2">
              Something Crashed
            </h1>
            <p className="text-muted-foreground text-sm font-mono mb-6">
              An unexpected error occurred. This has been logged automatically.
            </p>
            {this.state.error && (
              <div className="bg-background border border-destructive/40 p-4 mb-6 overflow-auto max-h-32">
                <p className="text-xs font-mono text-destructive whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="brutalist-button px-6 py-2 text-xs flex-1"
              >
                [ Reload App ]
              </button>
              <button
                onClick={() => { window.location.href = "/dashboard"; }}
                className="px-6 py-2 text-xs font-mono font-bold uppercase border-2 border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors flex-1"
              >
                [ Go to Dashboard ]
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
