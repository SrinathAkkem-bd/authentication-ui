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
  private maxRetries = 2; // Reduced to 2 retries
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

    // Auto-retry silently for network errors (limited attempts)
    if (this.state.isNetworkError && this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info('NetworkErrorBoundary', `Silent auto-retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      const delay = 1000 * (this.retryCount + 1); // Simple linear delay: 2s, 3s
      this.retryTimer = window.setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, delay);
    } else {
      // After max retries, show the children (main app) instead of loading
      logger.warn('NetworkErrorBoundary', 'Max retries reached, showing main app');
      setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError && this.retryCount < this.maxRetries) {
      // Show loading only during retry attempts
      return <PageLoader message="Loading..." />;
    }

    // Always show children after retries are exhausted
    return this.props.children;
  }
}

export default NetworkErrorBoundary;