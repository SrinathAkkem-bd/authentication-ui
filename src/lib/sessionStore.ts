import { QueryClient } from '@tanstack/react-query';
import { BaseComponent } from '../utils/logger';

export type SessionData = {
  name: string;
  // Add other session data fields as needed
};

class SessionStore extends BaseComponent {
  private queryClient: QueryClient;

  constructor(queryClient: QueryClient) {
    super('SessionStore');
    this.queryClient = queryClient;
  }

  setSession(data: SessionData) {
    this.log.debug('Setting session data:', data);
    this.queryClient.setQueryData(['session'], data);
  }

  getSession(): SessionData | undefined {
    return this.queryClient.getQueryData(['session']);
  }

  clearSession() {
    this.log.debug('Clearing session data');
    this.queryClient.removeQueries({ queryKey: ['session'] });
  }
}

export default SessionStore;