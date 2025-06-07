import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { sessionStore } from '../routes/__root';
import useToken, { UserData } from '../lib/useToken';
import Axios from '../lib/Axios';
import { BaseComponent } from '../utils/logger';
import { useEffect } from 'react';

class AuthHook extends BaseComponent {
  constructor() {
    super('AuthHook');
  }

  createAuthQuery() {
    return useQuery({
      queryKey: ['auth', 'user'],
      queryFn: async (): Promise<UserData> => {
        this.log.info('Checking authentication status');
        
        // First check if we have a valid session
        if (sessionStore.hasActiveSession()) {
          const sessionData = sessionStore.getSession();
          if (sessionData) {
            this.log.debug('Using existing valid session data');
            return sessionData;
          }
        }

        // Only fetch from server if no valid session exists
        this.log.info('No valid session found, fetching from server');
        const userData = await useToken();
        sessionStore.setSession(userData);
        this.log.success('User authenticated and session created');
        return userData;
      },
      retry: (failureCount, error: any) => {
        // Log errors silently but don't show to user
        this.log.error(`Authentication attempt ${failureCount + 1} failed:`, error?.message);
        
        // Don't retry on 401 errors (unauthorized)
        if (error?.response?.status === 401) {
          this.log.info('User not authenticated (401), stopping retries');
          return false;
        }
        
        // Reduced retries - max 2 attempts
        return failureCount < 2;
      },
      retryDelay: () => 2000, // 2 second delay
      staleTime: 10 * 60 * 1000, // 10 minutes - increased from 5
      refetchOnWindowFocus: false, // Disabled to reduce calls
      refetchOnReconnect: true,
      refetchOnMount: false, // Disabled - rely on session store
      refetchInterval: false, // Disabled
      // Silent error handling - never throw errors to UI
      throwOnError: false,
    });
  }

  createLogoutMutation() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
      mutationFn: async () => {
        this.log.info('Initiating logout process');
        try {
          await Axios.get('/auth/logout');
        } catch (error) {
          // Ignore logout errors - we'll clear local session anyway
          this.log.warn('Logout request failed, clearing local session anyway');
        }
      },
      onSuccess: () => {
        sessionStore.clearSession();
        queryClient.clear();
        this.log.success('User logged out successfully');
        navigate({ to: '/' });
      },
      onError: (error) => {
        this.log.error('Error during logout:', error);
        // Even if logout fails on server, clear local session silently
        sessionStore.clearSession();
        queryClient.clear();
        navigate({ to: '/' });
      },
      // Silent error handling
      throwOnError: false,
    });
  }

  createSessionRefreshMutation() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: async () => {
        this.log.info('Manually refreshing session from server');
        return await sessionStore.refreshSession();
      },
      onSuccess: (success) => {
        if (success) {
          // Invalidate auth query to refetch with new session data
          queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
          this.log.success('Session refreshed successfully');
        }
      },
      onError: (error) => {
        this.log.error('Failed to refresh session:', error);
        // Don't show error to user, just log it
      },
      throwOnError: false,
    });
  }

  createFetchOrgQuery() {
    return useQuery({
      queryKey: ['org', 'data'],
      queryFn: async () => {
        this.log.info('Fetching organization data');
        
        // Check if we have cached org data first
        const cachedOrgData = sessionStore.read('orgData');
        if (cachedOrgData) {
          this.log.debug('Using cached organization data');
          return cachedOrgData;
        }

        // Fetch from server if no cached data
        const response = await Axios.get('/org/fetch');
        const orgData = response.data;
        
        // Store in session for future use
        sessionStore.create('orgData', orgData);
        this.log.success('Organization data fetched and cached');
        
        return orgData;
      },
      retry: (failureCount, error: any) => {
        this.log.error(`Fetch org attempt ${failureCount + 1} failed:`, error?.message);
        
        // Don't retry on 401 errors
        if (error?.response?.status === 401) {
          this.log.info('Unauthorized for org data (401), stopping retries');
          return false;
        }
        
        // Reduced retries - max 2 attempts
        return failureCount < 2;
      },
      retryDelay: () => 2000,
      staleTime: 15 * 60 * 1000, // 15 minutes for org data
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      throwOnError: false,
      enabled: false, // Only fetch when explicitly called
    });
  }
}

const authHook = new AuthHook();

export const useAuth = () => {
  const query = authHook.createAuthQuery();
  
  // Monitor for session changes and errors silently
  useEffect(() => {
    if (query.error) {
      const error = query.error as any;
      if (error?.response?.status === 401) {
        // Session expired, clear and redirect silently
        sessionStore.clearSession();
        // Use setTimeout to avoid navigation during render
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
      }
    }
  }, [query.error]);

  return query;
};

export const useLogout = () => {
  return authHook.createLogoutMutation();
};

export const useSessionRefresh = () => {
  return authHook.createSessionRefreshMutation();
};

export const useFetchOrg = () => {
  return authHook.createFetchOrgQuery();
};

// Hook for session monitoring - simplified
export const useSessionMonitor = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSessionExpired = () => {
      queryClient.clear();
      // Use setTimeout to avoid navigation during render
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    };

    const handleSessionRestored = () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
    };

    // Listen for custom session events
    window.addEventListener('session:expired', handleSessionExpired);
    window.addEventListener('session:restored', handleSessionRestored);

    return () => {
      window.removeEventListener('session:expired', handleSessionExpired);
      window.removeEventListener('session:restored', handleSessionRestored);
    };
  }, [queryClient]);
};