import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { sessionStore } from '../routes/__root';
import useToken, { UserData } from '../lib/useToken';
import Axios from '../lib/Axios';
import { BaseComponent } from '../utils/logger';

class AuthHook extends BaseComponent {
  constructor() {
    super('AuthHook');
  }

  createAuthQuery() {
    return useQuery({
      queryKey: ['auth', 'user'],
      queryFn: async (): Promise<UserData> => {
        this.log.info('Fetching user authentication data');
        
        // Check if we have an active session first
        if (sessionStore.hasActiveSession()) {
          const sessionData = sessionStore.getSession();
          if (sessionData) {
            this.log.debug('Using existing session data');
            return sessionData;
          }
        }

        // If no session, fetch from server
        const userData = await useToken();
        sessionStore.setSession(userData);
        this.log.success('User authenticated and session created');
        return userData;
      },
      retry: (failureCount, error: any) => {
        // Don't retry on 401 errors (unauthorized)
        if (error?.response?.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    });
  }

  createLogoutMutation() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    return useMutation({
      mutationFn: async () => {
        this.log.info('Initiating logout process');
        await Axios.get('/auth/logout');
      },
      onSuccess: () => {
        sessionStore.clearSession();
        queryClient.clear();
        this.log.success('User logged out successfully');
        navigate({ to: '/' });
      },
      onError: (error) => {
        this.log.error('Error during logout:', error);
        // Even if logout fails on server, clear local session
        sessionStore.clearSession();
        queryClient.clear();
        navigate({ to: '/' });
      },
    });
  }
}

const authHook = new AuthHook();

export const useAuth = () => {
  return authHook.createAuthQuery();
};

export const useLogout = () => {
  return authHook.createLogoutMutation();
};