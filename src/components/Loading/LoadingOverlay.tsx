import { FC, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingOverlayProps {
  isLoading: boolean;
  children: ReactNode;
  message?: string;
  overlay?: boolean;
}

const LoadingOverlay: FC<LoadingOverlayProps> = ({ 
  isLoading, 
  children, 
  message = 'Loading...',
  overlay = true 
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  if (overlay) {
    return (
      <div className="relative">
        {children}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-white text-sm font-medium">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-gray-300 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;