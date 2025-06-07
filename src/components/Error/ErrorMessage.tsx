import { FC } from 'react';
import Button from '../Buttons/Button';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

const ErrorMessage: FC<ErrorMessageProps> = ({ 
  message, 
  onRetry, 
  showRetry = true 
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 bg-red-900/20 border border-red-500/30 rounded-lg">
      <div className="text-red-400 text-4xl">❌</div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-red-400 mb-2">Error</h3>
        <p className="text-gray-300 text-sm">{message}</p>
      </div>
      {showRetry && onRetry && (
        <Button onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorMessage;