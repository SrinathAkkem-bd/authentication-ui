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

class ErrorBoundary extends Component<Props, State> {
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
    // Log error silently in background for developers
    logger.error('ErrorBoundary', 'Application error caught:', error.message);
    logger.debug('ErrorBoundary', 'Error details:', { error, errorInfo });
    
    this.setState({ errorInfo });
    
    // Attempt to recover silently with limited retries
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logger.info('ErrorBoundary', `Silent auto-retry attempt ${this.retryCount}/${this.maxRetries}`);
      
      const delay = 1000 * this.retryCount; // 1s, 2s delays
      this.retryTimer = window.setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, delay);
    } else {
      // After max retries, show the app anyway
      logger.warn('ErrorBoundary', 'Max retries reached, showing app');
      this.retryTimer = window.setTimeout(() => {
        this.setState({ hasError: false, error: null, errorInfo: null });
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError && this.retryCount <= this.maxRetries) {
      // Show loading briefly during recovery
      return <PageLoader message="Loading..." />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;