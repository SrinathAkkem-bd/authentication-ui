import { QueryClient } from '@tanstack/react-query';
import { BaseComponent } from '../utils/logger';
import CryptoJS from 'crypto-js';

export type SessionData = {
  name: string;
  data?: Record<string, any>;
  lastModified?: number;
};

class SessionStore extends BaseComponent {
  private queryClient: QueryClient;
  private readonly SESSION_KEY = ['session'];
  private readonly ENCRYPTION_KEY: string;
  private readonly SESSION_TIMEOUT: number;
  private readonly SESSION_RENEWAL_THRESHOLD: number;
  private sessionTimer: number | null = null;
  private renewalTimer: number | null = null;

  constructor(queryClient: QueryClient) {
    super('SessionStore');
    this.queryClient = queryClient;
    this.ENCRYPTION_KEY = CryptoJS.lib.WordArray.random(256/8).toString();
    
    // Get configuration from environment variables
    this.SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000', 10);
    this.SESSION_RENEWAL_THRESHOLD = parseInt(import.meta.env.VITE_SESSION_RENEWAL_THRESHOLD || '300000', 10);
    
    this.log.debug(`Session timeout set to ${this.SESSION_TIMEOUT}ms`);
    this.log.debug(`Session renewal threshold set to ${this.SESSION_RENEWAL_THRESHOLD}ms`);
  }

  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      this.log.error('Failed to decrypt session data');
      this.clearSession();
      return undefined;
    }
  }

  private async renewSession() {
    try {
      const currentSession = this.getSession();
      if (!currentSession) return;

      // Attempt to renew the session with the server
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/renew`, {
        credentials: 'include'
      });

      if (response.ok) {
        // Update the session timestamp
        this.updateSession(currentSession);
        this.log.debug('Session renewed successfully');
      } else {
        this.log.warn('Failed to renew session');
        this.clearSession();
        window.location.href = '/';
      }
    } catch (error) {
      this.log.error('Error renewing session:', error);
    }
  }

  private startSessionTimer() {
    if (this.sessionTimer) {
      window.clearTimeout(this.sessionTimer);
    }
    if (this.renewalTimer) {
      window.clearTimeout(this.renewalTimer);
    }

    // Set timer for session expiration
    this.sessionTimer = window.setTimeout(() => {
      this.log.info('Session timeout reached');
      this.clearSession();
      window.location.href = '/';
    }, this.SESSION_TIMEOUT);

    // Set timer for session renewal
    const timeUntilRenewal = this.SESSION_TIMEOUT - this.SESSION_RENEWAL_THRESHOLD;
    this.renewalTimer = window.setTimeout(() => {
      this.renewSession();
    }, timeUntilRenewal);
  }

  private updateSession(sessionData: SessionData) {
    try {
      const encryptedData = this.encrypt({
        ...sessionData,
        lastModified: Date.now()
      });
      
      this.queryClient.setQueryData(this.SESSION_KEY, {
        data: encryptedData,
        timestamp: Date.now()
      });
      
      this.startSessionTimer();
      this.log.debug('Session updated successfully');
      return true;
    } catch (error) {
      this.log.error('Failed to update session:', error);
      return false;
    }
  }

  setSession(data: SessionData) {
    try {
      const encryptedData = this.encrypt({
        ...data,
        data: data.data || {},
        lastModified: Date.now()
      });
      
      const sessionData = {
        data: encryptedData,
        timestamp: Date.now()
      };
      
      this.queryClient.setQueryData(this.SESSION_KEY, sessionData);
      this.startSessionTimer();
      this.log.debug('Session data encrypted and stored');
      return true;
    } catch (error) {
      this.log.error('Failed to set session data:', error);
      this.clearSession();
      return false;
    }
  }

  getSession(): SessionData | undefined {
    try {
      const sessionData = this.queryClient.getQueryData<{ data: string, timestamp: number }>(this.SESSION_KEY);
      
      if (!sessionData) {
        return undefined;
      }

      const timeElapsed = Date.now() - sessionData.timestamp;
      if (timeElapsed > this.SESSION_TIMEOUT) {
        this.log.warn('Session expired');
        this.clearSession();
        return undefined;
      }

      // If approaching timeout, trigger renewal
      if (timeElapsed > (this.SESSION_TIMEOUT - this.SESSION_RENEWAL_THRESHOLD)) {
        this.renewSession();
      }

      const decryptedData = this.decrypt(sessionData.data);
      this.startSessionTimer();
      return decryptedData;
    } catch (error) {
      this.log.error('Failed to get session data:', error);
      this.clearSession();
      return undefined;
    }
  }

  // CRUD Operations for session data
  create(key: string, value: any): boolean {
    try {
      const session = this.getSession();
      if (!session) return false;

      if (session.data?.[key] !== undefined) {
        this.log.warn(`Key "${key}" already exists in session`);
        return false;
      }

      return this.updateSession({
        ...session,
        data: {
          ...session.data,
          [key]: value
        }
      });
    } catch (error) {
      this.log.error('Failed to create session data:', error);
      return false;
    }
  }

  read(key: string): any {
    try {
      const session = this.getSession();
      return session?.data?.[key];
    } catch (error) {
      this.log.error('Failed to read session data:', error);
      return undefined;
    }
  }

  update(key: string, value: any): boolean {
    try {
      const session = this.getSession();
      if (!session) return false;

      if (session.data?.[key] === undefined) {
        this.log.warn(`Key "${key}" not found in session`);
        return false;
      }

      return this.updateSession({
        ...session,
        data: {
          ...session.data,
          [key]: value
        }
      });
    } catch (error) {
      this.log.error('Failed to update session data:', error);
      return false;
    }
  }

  delete(key: string): boolean {
    try {
      const session = this.getSession();
      if (!session || !session.data?.[key]) return false;

      const { [key]: _, ...remainingData } = session.data;
      return this.updateSession({
        ...session,
        data: remainingData
      });
    } catch (error) {
      this.log.error('Failed to delete session data:', error);
      return false;
    }
  }

  clearSession() {
    if (this.sessionTimer) {
      window.clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.renewalTimer) {
      window.clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }
    this.queryClient.removeQueries({ queryKey: this.SESSION_KEY });
    this.log.debug('Session cleared');
  }

  hasActiveSession(): boolean {
    try {
      return this.getSession() !== undefined;
    } catch {
      return false;
    }
  }
}

export default SessionStore;