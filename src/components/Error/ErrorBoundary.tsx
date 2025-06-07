import { Component, ReactNode, ErrorInfo } from 'react';
import Layout from '../Layout/Layout';
import Button from '../Buttons/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Layout>
          <div className="flex flex-col items-center justify-center gap-6 bg-[#131313] p-8 rounded-lg max-w-md">
            <div className="text-red-500 text-6xl">⚠️</div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-100 mb-2">Something went wrong</h2>
              <p className="text-gray-400 text-sm mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
            </div>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </Layout>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;