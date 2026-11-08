import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 bg-surface dark:bg-stone-950 text-on-surface dark:text-stone-100">
          <div className="max-w-md w-full p-8 rounded-3xl bg-surface-container-lowest dark:bg-stone-900 border border-surface-container-highest dark:border-stone-800 shadow-2xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">restaurant</span>
            </div>
            <h1 className="font-headline text-3xl font-medium mb-3">Kitchen Update</h1>
            <p className="text-sm text-outline dark:text-stone-400 mb-6 leading-relaxed">
              We encountered an unexpected issue while preparing the page. Please refresh to return to the culinary atelier.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-6 py-3 rounded-full bg-primary text-on-primary font-bold text-sm hover:bg-primary-container transition-all active:scale-95 shadow-md shadow-primary/20"
              >
                Refresh Page
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/';
                }}
                className="px-6 py-3 rounded-full bg-surface-container-high dark:bg-stone-800 text-on-surface dark:text-stone-200 font-bold text-sm hover:bg-surface-container-highest transition-all active:scale-95"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
