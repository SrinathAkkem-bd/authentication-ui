import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../../utils/logger';
import Button from '../Buttons/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isNetworkError: boolean;
}

class NetworkErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      isNetworkError: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isNetworkError = error.message.includes('fetch') || 
                          error.message.includes('network') ||
                          error.message.includes('timeout') ||
                          error.name === 'TypeError';

    return { 
      hasError: true, 
      error,
      isNetworkError
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('NetworkErrorBoundary', 'Network error caught:', error.message);
    logger.debug('NetworkErrorBoundary', 'Error details:', { error, errorInfo });
    
    this.setState({ errorInfo });

    // Auto-retry for network errors
    if (this.state.isNetworkError && this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info('NetworkErrorBoundary', `Auto-retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 2000 * this.retryCount); // Exponential backoff
    }
  }

  handleRetry = () => {
    logger.info('NetworkErrorBoundary', 'Manual retry triggered');
    this.retryCount = 0;
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleRefresh = () => {
    logger.info('NetworkErrorBoundary', 'Page refresh triggered');
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.isNetworkError) {
      return (
        <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-4">
          <div className="bg-[#131313] p-8 rounded-lg max-w-md w-full text-center">
            <div className="text-red-400 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
              Connection Problem
            </h2>
            <p className="text-gray-300 mb-6">
              We're having trouble connecting to our servers. This might be due to:
            </p>
            <ul className="text-gray-400 text-sm mb-6 text-left space-y-1">
              <li>• Network connectivity issues</li>
              <li>• Server maintenance</li>
              <li>• Temporary service disruption</li>
            </ul>
            
            <div className="space-y-3">
              <Button onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button 
                onClick={this.handleRefresh}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Refresh Page
              </Button>
            </div>
            
            {this.retryCount > 0 && (
              <p className="text-yellow-400 text-sm mt-4">
                Retry attempts: {this.retryCount}/{this.maxRetries}
              </p>
            )}
          </div>
        </div>
      );
    }

    if (this.state.hasError) {
      // For non-network errors, show minimal error UI
      return (
        <div className="min-h-screen bg-[#0e0e10] flex items-center justify-center p-4">
          <div className="bg-[#131313] p-8 rounded-lg max-w-md w-full text-center">
            <div className="text-red-400 text-4xl mb-4">❌</div>
            <h2 className="text-lg font-semibold text-gray-100 mb-4">
              Something went wrong
            </h2>
            <Button onClick={this.handleRefresh}>
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;