import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../../utils/logger';
import PageLoader from '../Loading/PageLoader';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryTimer: number | null = null;
  private retryCount = 0;
  private maxRetries = 2; // Reduced to 2 retries

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error silently in background for developers
    logger.error('ErrorBoundary', 'Application error caught:', error.message);
    logger.debug('ErrorBoundary', 'Error details:', { error, errorInfo });
    
    // Attempt to recover silently with limited retries
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.retryTimer = window.setTimeout(() => {
        this.setState({ hasError: false });
      }, 1000 * this.retryCount); // 1s, 2s delays
    } else {
      // After max retries, show the app anyway
      logger.warn('ErrorBoundary', 'Max retries reached, showing app');
      this.retryTimer = window.setTimeout(() => {
        this.setState({ hasError: false });
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