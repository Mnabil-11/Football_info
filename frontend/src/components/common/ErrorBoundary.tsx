import { Component, ErrorInfo, ReactNode } from 'react';
import ErrorState from './ErrorState';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere below it so a single bad component can't
 * blank the whole page. Must stay a class component — React has no hook
 * equivalent for `componentDidCatch`.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Render error:', error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return (
        <div className="mx-auto max-w-6xl px-4 py-8">
          <ErrorState
            message="حدث خطأ غير متوقع في الصفحة."
            onRetry={() => {
              // A full reload is the safest recovery: the component tree that
              // threw may have left inconsistent state behind.
              window.location.reload();
            }}
          />
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
