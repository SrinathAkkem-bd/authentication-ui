import { QueryClient } from '@tanstack/react-query';
import { BaseComponent } from '../utils/logger';
import CryptoJS from 'crypto-js';

export type SessionData = {
  name: string;
  data?: Record<string, any>;
  lastModified?: number;
  sessionId?: string;
  lastValidated?: number;
};

class SessionStore extends BaseComponent {
  private queryClient: QueryClient;
  private readonly SESSION_KEY = ['session'];
  private readonly LOCAL_STORAGE_KEY = 'auth_session_backup';
  private readonly ENCRYPTION_KEY: string;
  private readonly SESSION_TIMEOUT: number;
  private readonly SESSION_RENEWAL_THRESHOLD: number;
  private readonly VALIDATION_INTERVAL: number = 5 * 60 * 1000; // 5 minutes instead of 30 seconds
  private sessionTimer: number | null = null;
  private renewalTimer: number | null = null;
  private validationTimer: number | null = null;
  private isRenewing = false;
  private retryCount = 0;
  private readonly MAX_RETRIES = 2; // Reduced from 3
  private lastValidationTime = 0;

  constructor(queryClient: QueryClient) {
    super('SessionStore');
    this.queryClient = queryClient;
    
    // Generate or retrieve encryption key from localStorage
    const storedKey = localStorage.getItem('session_encryption_key');
    if (storedKey) {
      this.ENCRYPTION_KEY = storedKey;
    } else {
      this.ENCRYPTION_KEY = CryptoJS.lib.WordArray.random(256/8).toString();
      localStorage.setItem('session_encryption_key', this.ENCRYPTION_KEY);
    }
    
    // Get configuration from environment variables
    this.SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000', 10);
    this.SESSION_RENEWAL_THRESHOLD = parseInt(import.meta.env.VITE_SESSION_RENEWAL_THRESHOLD || '300000', 10);
    
    this.log.debug(`Session timeout set to ${this.SESSION_TIMEOUT}ms`);
    this.log.debug(`Session renewal threshold set to ${this.SESSION_RENEWAL_THRESHOLD}ms`);
    this.log.debug(`Validation interval set to ${this.VALIDATION_INTERVAL}ms`);

    // Initialize session recovery on startup
    this.initializeSessionRecovery();
    
    // Listen for storage events (session changes in other tabs)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
    
    // Listen for online/offline events
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Listen for visibility changes (tab focus/blur)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Listen for beforeunload to save session state
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private encrypt(data: any): string {
    return CryptoJS.AES.encrypt(JSON.stringify(data), this.ENCRYPTION_KEY).toString();
  }

  private decrypt(encryptedData: string): any {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.ENCRYPTION_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption failed');
      }
      return JSON.parse(decrypted);
    } catch (error) {
      this.log.error('Failed to decrypt session data:', error);
      this.clearSession();
      return undefined;
    }
  }

  private initializeSessionRecovery() {
    try {
      // Try to recover session from localStorage on page load
      const backupSession = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (backupSession) {
        const sessionData = this.decrypt(backupSession);
        if (sessionData && this.isSessionValid(sessionData)) {
          this.log.info('Recovering session from localStorage');
          this.setSession(sessionData, false); // Don't save to localStorage again
          return;
        } else {
          this.log.warn('Backup session invalid, clearing');
          localStorage.removeItem(this.LOCAL_STORAGE_KEY);
        }
      }
    } catch (error) {
      this.log.error('Failed to recover session:', error);
      localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    }
  }

  private isSessionValid(sessionData: SessionData): boolean {
    if (!sessionData || !sessionData.lastModified) return false;
    
    const timeElapsed = Date.now() - sessionData.lastModified;
    return timeElapsed < this.SESSION_TIMEOUT;
  }

  private needsValidation(sessionData: SessionData): boolean {
    if (!sessionData.lastValidated) return true;
    
    const timeSinceValidation = Date.now() - sessionData.lastValidated;
    return timeSinceValidation > this.VALIDATION_INTERVAL;
  }

  private saveToLocalStorage(sessionData: SessionData) {
    try {
      const encryptedData = this.encrypt(sessionData);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, encryptedData);
    } catch (error) {
      this.log.error('Failed to save session to localStorage:', error);
    }
  }

  private handleStorageChange(event: StorageEvent) {
    if (event.key === this.LOCAL_STORAGE_KEY) {
      if (event.newValue === null) {
        // Session was cleared in another tab
        this.log.info('Session cleared in another tab');
        this.clearSession();
        this.redirectToLogin();
      } else if (event.newValue !== event.oldValue) {
        // Session was updated in another tab
        this.log.info('Session updated in another tab');
        this.initializeSessionRecovery();
      }
    }
  }

  private handleOnline() {
    this.log.info('Connection restored');
    // Only validate if we haven't validated recently
    const session = this.getSession();
    if (session && this.needsValidation(session)) {
      this.validateSessionWithServer();
    }
  }

  private handleOffline() {
    this.log.warn('Connection lost, session validation paused');
    this.stopValidationTimer();
  }

  private handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.log.debug('Tab became visible');
      // Only validate if we haven't validated recently
      const session = this.getSession();
      if (session && this.needsValidation(session)) {
        this.validateSessionWithServer();
      }
    }
  }

  private handleBeforeUnload() {
    // Save current session state before page unload
    const session = this.getSession();
    if (session) {
      this.saveToLocalStorage(session);
    }
  }

  private async validateSessionWithServer() {
    if (this.isRenewing || !navigator.onLine) return;

    // Prevent duplicate validation calls
    const now = Date.now();
    if (now - this.lastValidationTime < 10000) { // 10 second cooldown
      this.log.debug('Skipping validation - too recent');
      return;
    }
    this.lastValidationTime = now;

    try {
      this.log.debug('Validating session with server');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/validate`, {
        credentials: 'include',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (response.ok) {
        this.retryCount = 0;
        // Update last validated time
        const session = this.getSession();
        if (session) {
          this.updateSession({
            ...session,
            lastValidated: Date.now()
          });
        }
        this.startValidationTimer();
      } else if (response.status === 401) {
        this.log.warn('Session invalid on server');
        this.handleSessionExpired();
      } else {
        this.log.warn(`Session validation failed with status: ${response.status}`);
        this.handleValidationError();
      }
    } catch (error) {
      this.log.error('Session validation error:', error);
      this.handleValidationError();
    }
  }

  private handleValidationError() {
    this.retryCount++;
    if (this.retryCount >= this.MAX_RETRIES) {
      this.log.error('Max validation retries reached, clearing session');
      this.handleSessionExpired();
    } else {
      // Retry with exponential backoff
      const delay = Math.pow(2, this.retryCount) * 2000; // 2s, 4s
      setTimeout(() => this.validateSessionWithServer(), delay);
    }
  }

  private handleSessionExpired() {
    this.log.info('Session expired, clearing and redirecting');
    this.clearSession();
    this.redirectToLogin();
  }

  private redirectToLogin() {
    // Use a small delay to ensure cleanup is complete
    setTimeout(() => {
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }, 100);
  }

  private startValidationTimer() {
    this.stopValidationTimer();
    
    // Validate session every 5 minutes instead of 30 seconds
    this.validationTimer = window.setInterval(() => {
      if (navigator.onLine && this.hasActiveSession()) {
        const session = this.getSession();
        if (session && this.needsValidation(session)) {
          this.validateSessionWithServer();
        }
      }
    }, this.VALIDATION_INTERVAL);
  }

  private stopValidationTimer() {
    if (this.validationTimer) {
      window.clearInterval(this.validationTimer);
      this.validationTimer = null;
    }
  }

  private async renewSession() {
    if (this.isRenewing || !navigator.onLine) return;

    this.isRenewing = true;
    
    try {
      const currentSession = this.getSession();
      if (!currentSession) {
        this.isRenewing = false;
        return;
      }

      this.log.info('Attempting to renew session');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/renew`, {
        credentials: 'include',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const renewedData = await response.json();
        // Update session with new data if provided, otherwise just update timestamp
        const updatedSession = renewedData ? { ...currentSession, ...renewedData } : currentSession;
        updatedSession.lastValidated = Date.now(); // Mark as validated
        this.updateSession(updatedSession);
        this.log.success('Session renewed successfully');
        this.retryCount = 0;
      } else if (response.status === 401) {
        this.log.warn('Session renewal failed - unauthorized');
        this.handleSessionExpired();
      } else {
        this.log.warn(`Session renewal failed with status: ${response.status}`);
        this.handleRenewalError();
      }
    } catch (error) {
      this.log.error('Error renewing session:', error);
      this.handleRenewalError();
    } finally {
      this.isRenewing = false;
    }
  }

  private handleRenewalError() {
    this.retryCount++;
    if (this.retryCount >= this.MAX_RETRIES) {
      this.log.error('Max renewal retries reached, session expired');
      this.handleSessionExpired();
    } else {
      // Retry renewal with exponential backoff
      const delay = Math.pow(2, this.retryCount) * 2000; // 2s, 4s
      setTimeout(() => this.renewSession(), delay);
    }
  }

  private startSessionTimer() {
    this.clearTimers();

    // Set timer for session expiration
    this.sessionTimer = window.setTimeout(() => {
      this.log.info('Session timeout reached');
      this.handleSessionExpired();
    }, this.SESSION_TIMEOUT);

    // Set timer for session renewal
    const timeUntilRenewal = this.SESSION_TIMEOUT - this.SESSION_RENEWAL_THRESHOLD;
    this.renewalTimer = window.setTimeout(() => {
      this.renewSession();
    }, timeUntilRenewal);

    // Start validation timer (much less frequent)
    this.startValidationTimer();
  }

  private clearTimers() {
    if (this.sessionTimer) {
      window.clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    if (this.renewalTimer) {
      window.clearTimeout(this.renewalTimer);
      this.renewalTimer = null;
    }
    this.stopValidationTimer();
  }

  private updateSession(sessionData: SessionData) {
    try {
      const updatedData = {
        ...sessionData,
        lastModified: Date.now(),
        sessionId: sessionData.sessionId || CryptoJS.lib.WordArray.random(128/8).toString()
      };

      const encryptedData = this.encrypt(updatedData);
      
      const queryData = {
        data: encryptedData,
        timestamp: Date.now()
      };
      
      this.queryClient.setQueryData(this.SESSION_KEY, queryData);
      this.saveToLocalStorage(updatedData);
      this.startSessionTimer();
      
      this.log.debug('Session updated successfully');
      return true;
    } catch (error) {
      this.log.error('Failed to update session:', error);
      return false;
    }
  }

  setSession(data: SessionData, saveToStorage = true) {
    try {
      const sessionData = {
        ...data,
        data: data.data || {},
        lastModified: Date.now(),
        lastValidated: Date.now(), // Mark as validated when setting
        sessionId: CryptoJS.lib.WordArray.random(128/8).toString()
      };

      const encryptedData = this.encrypt(sessionData);
      
      const queryData = {
        data: encryptedData,
        timestamp: Date.now()
      };
      
      this.queryClient.setQueryData(this.SESSION_KEY, queryData);
      
      if (saveToStorage) {
        this.saveToLocalStorage(sessionData);
      }
      
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
        this.handleSessionExpired();
        return undefined;
      }

      const decryptedData = this.decrypt(sessionData.data);
      if (!decryptedData) {
        return undefined;
      }

      // Only trigger renewal if session is approaching expiration AND we're not already renewing
      if (timeElapsed > (this.SESSION_TIMEOUT - this.SESSION_RENEWAL_THRESHOLD) && !this.isRenewing) {
        this.renewSession();
      }

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
    this.clearTimers();
    this.queryClient.removeQueries({ queryKey: this.SESSION_KEY });
    localStorage.removeItem(this.LOCAL_STORAGE_KEY);
    this.retryCount = 0;
    this.isRenewing = false;
    this.lastValidationTime = 0;
    this.log.debug('Session cleared completely');
  }

  hasActiveSession(): boolean {
    try {
      const session = this.getSession();
      return session !== undefined && this.isSessionValid(session);
    } catch {
      return false;
    }
  }

  // Force session refresh from server - only when explicitly needed
  async refreshSession(): Promise<boolean> {
    try {
      this.log.info('Forcing session refresh from server');
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/user_info`, {
        credentials: 'include',
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const userData = await response.json();
        userData.lastValidated = Date.now(); // Mark as validated
        this.setSession(userData);
        this.log.success('Session refreshed from server');
        return true;
      } else {
        this.log.warn('Failed to refresh session from server');
        if (response.status === 401) {
          this.handleSessionExpired();
        }
        return false;
      }
    } catch (error) {
      this.log.error('Error refreshing session:', error);
      return false;
    }
  }

  // Get session info for debugging
  getSessionInfo() {
    const session = this.getSession();
    if (!session) return null;

    return {
      sessionId: session.sessionId,
      lastModified: new Date(session.lastModified || 0).toISOString(),
      lastValidated: session.lastValidated ? new Date(session.lastValidated).toISOString() : 'Never',
      timeRemaining: Math.max(0, this.SESSION_TIMEOUT - (Date.now() - (session.lastModified || 0))),
      isValid: this.isSessionValid(session),
      needsValidation: this.needsValidation(session),
      retryCount: this.retryCount,
      isRenewing: this.isRenewing
    };
  }
}

export default SessionStore;