import { Component, ErrorInfo, ReactNode } from 'react';

type ErrorBoundaryProps = {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type ErrorBoundaryState = {
    hasError: boolean;
    error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Suppress specific Clerk-related errors that don't affect functionality
        if (
            error.message?.includes('Client Functions cannot be passed directly to Server Functions') ||
            error.message?.includes('React Element cannot be passed to Server Functions') ||
            error.message?.includes('React Lazy cannot be passed to Server Functions') ||
            error.message?.includes('keyless-cookie-sync')
        ) {
            // Don't trigger error boundary for these specific errors
            return {
                hasError: false,
                error: null,
            };
        }
        
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Suppress specific Clerk-related errors
        if (
            error.message?.includes('Client Functions cannot be passed directly to Server Functions') ||
            error.message?.includes('React Element cannot be passed to Server Functions') ||
            error.message?.includes('React Lazy cannot be passed to Server Functions') ||
            error.message?.includes('keyless-cookie-sync')
        ) {
            // Reset the error boundary for these specific errors
            this.setState({ hasError: false, error: null });
            return;
        }
        
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary-fallback">
                    <h2>Something went wrong</h2>
                    <details>
                        <summary>Error details</summary>
                        <pre>{this.state.error?.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}
