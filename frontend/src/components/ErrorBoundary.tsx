import React, { Component, ReactNode } from "react";
import { ErrorFallback } from "./pages/ErrorFallback";
import { logError } from "../services/loggingService";

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // console.error("React Error Boundary caught an error:", error, errorInfo);
    logError(error, {
      source: 'ErrorBoundary',
      extra: {componentStack: errorInfo.componentStack}
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
