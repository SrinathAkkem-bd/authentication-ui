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
    
    // Attempt to recover silently after a short delay
    this.retryTimer = window.setTimeout(() => {
      this.setState({ hasError: false });
    }, 2000);
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      window.clearTimeout(this.retryTimer);
    }
  }

  render() {
    if (this.state.hasError) {
      // Show loading instead of error message
      return <PageLoader message="Loading..." />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;