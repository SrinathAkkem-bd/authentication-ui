import { Component, ReactNode, ErrorInfo } from 'react';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: false }; // Never show error UI to users
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error silently in background for developers
    logger.error('ErrorBoundary', 'Application error caught:', error.message);
    logger.debug('ErrorBoundary', 'Error details:', { error, errorInfo });
    
    // Attempt to recover silently
    setTimeout(() => {
      this.setState({ hasError: false });
    }, 100);
  }

  render() {
    return this.props.children;
  }
}

export default ErrorBoundary;