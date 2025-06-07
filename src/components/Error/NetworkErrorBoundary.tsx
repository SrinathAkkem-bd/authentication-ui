import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../../utils/logger';
import PageLoader from '../Loading/PageLoader';

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
  private maxRetries = 5;
  private retryTimer: number | null = null;

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

    // Auto-retry silently for network errors
    if (this.state.isNetworkError && this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info('NetworkErrorBoundary', `Silent auto-retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000); // Max 10 seconds
      this.retryTimer = window.setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, delay);
    } else if (this.retryCount >= this.maxRetries) {
      // After max retries, just show loading indefinitely
      logger.warn('NetworkErrorBoundary', 'Max retries reached, showing loading state');
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Always show loading state instead of error messages
      return <PageLoader message="Loading..." />;
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;