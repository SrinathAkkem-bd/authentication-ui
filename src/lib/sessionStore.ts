import { QueryClient } from '@tanstack/react-query';
import { BaseComponent } from '../utils/logger';

export type SessionData = {
  name: string;
  // Add other session data fields as needed
};

class SessionStore extends BaseComponent {
  private queryClient: QueryClient;
  private readonly SESSION_KEY = ['session'];

  constructor(queryClient: QueryClient) {
    super('SessionStore');
    this.queryClient = queryClient;
  }

  setSession(data: SessionData) {
    this.log.debug('Setting session data:', data);
    this.queryClient.setQueryData(this.SESSION_KEY, data);
  }

  getSession(): SessionData | undefined {
    const data = this.queryClient.getQueryData<SessionData>(this.SESSION_KEY);
    this.log.debug('Getting session data:', data);
    return data;
  }

  clearSession() {
    this.log.debug('Clearing session data');
    this.queryClient.removeQueries({ queryKey: this.SESSION_KEY });
  }

  hasActiveSession(): boolean {
    return this.getSession() !== undefined;
  }
}

export default SessionStore;