import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sessionStore } from '../../routes/__root';
import { BaseComponent } from '../../utils/logger';

class SessionMonitorComponent extends BaseComponent {
  constructor() {
    super('SessionMonitor');
  }

  createSessionMonitor() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const queryClient = useQueryClient();

    useEffect(() => {
      // Update online status
      const handleOnline = () => {
        this.log.info('Connection restored');
        setIsOnline(true);
      };

      const handleOffline = () => {
        this.log.warn('Connection lost');
        setIsOnline(false);
      };

      // Monitor session info in development - less frequently
      const updateSessionInfo = () => {
        if (import.meta.env.DEV) {
          setSessionInfo(sessionStore.getSessionInfo());
        }
      };

      // Set up event listeners
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Update session info less frequently in development (every 10 seconds instead of 5)
      const sessionInfoInterval = import.meta.env.DEV 
        ? setInterval(updateSessionInfo, 10000)
        : null;

      // Initial session info update
      updateSessionInfo();

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        if (sessionInfoInterval) {
          clearInterval(sessionInfoInterval);
        }
      };
    }, []);

    return { isOnline, sessionInfo };
  }
}

const sessionMonitorComponent = new SessionMonitorComponent();

const SessionMonitor = () => {
  const { isOnline, sessionInfo } = sessionMonitorComponent.createSessionMonitor();

  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-xs max-w-xs z-50">
      <div className="font-semibold mb-2">Session Monitor</div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        {sessionInfo && (
          <>
            <div className="flex justify-between">
              <span>Session:</span>
              <span className={sessionInfo.isValid ? 'text-green-400' : 'text-red-400'}>
                {sessionInfo.isValid ? 'Valid' : 'Invalid'}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span>Time Left:</span>
              <span className="text-blue-400">
                {Math.floor(sessionInfo.timeRemaining / 1000 / 60)}m
              </span>
            </div>

            <div className="flex justify-between">
              <span>Last Validated:</span>
              <span className="text-gray-400 text-xs">
                {sessionInfo.lastValidated !== 'Never' 
                  ? new Date(sessionInfo.lastValidated).toLocaleTimeString()
                  : 'Never'
                }
              </span>
            </div>

            <div className="flex justify-between">
              <span>Needs Validation:</span>
              <span className={sessionInfo.needsValidation ? 'text-yellow-400' : 'text-green-400'}>
                {sessionInfo.needsValidation ? 'Yes' : 'No'}
              </span>
            </div>
            
            {sessionInfo.isRenewing && (
              <div className="text-yellow-400">Renewing...</div>
            )}
            
            {sessionInfo.retryCount > 0 && (
              <div className="text-orange-400">
                Retries: {sessionInfo.retryCount}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SessionMonitor;