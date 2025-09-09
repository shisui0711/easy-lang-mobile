import * as SecureStore from 'expo-secure-store';
import { User, AuthSession, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from './api';

export class AuthManager {
  private static instance: AuthManager;
  private currentSession: AuthSession | null = null;

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/auth/login', credentials);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Store token and user data securely
        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        
        const session: AuthSession = {
          user,
          isAuthenticated: true,
          token,
        };
        
        this.currentSession = session;
        
        return { success: true, session };
      } else {
        return { success: false, error: response.error || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; session?: AuthSession; error?: string }> {
    try {
      const response = await apiClient.post<{ token: string; user: User }>('/auth/register', data);
      
      if (response.success && response.data) {
        const { token, user } = response.data;
        
        // Store token and user data securely
        await SecureStore.setItemAsync('authToken', token);
        await SecureStore.setItemAsync('user', JSON.stringify(user));
        
        const session: AuthSession = {
          user,
          isAuthenticated: true,
          token,
        };
        
        this.currentSession = session;
        
        return { success: true, session };
      } else {
        return { success: false, error: response.error || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint if needed
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }
    
    // Clear stored data
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('user');
    
    this.currentSession = null;
  }

  async getStoredSession(): Promise<AuthSession | null> {
    try {
      const token = await SecureStore.getItemAsync('authToken');
      const userJson = await SecureStore.getItemAsync('user');
      
      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        const session: AuthSession = {
          user,
          isAuthenticated: true,
          token,
        };
        
        this.currentSession = session;
        return session;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored session:', error);
      return null;
    }
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await apiClient.post<{ token: string }>('/auth/refresh');
      
      if (response.success && response.data) {
        await SecureStore.setItemAsync('authToken', response.data.token);
        if (this.currentSession) {
          this.currentSession.token = response.data.token;
        }
        return true;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async updateUser(userData: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const response = await apiClient.put<User>('/user/profile', userData);
      
      if (response.success && response.data) {
        // Update stored user data
        await SecureStore.setItemAsync('user', JSON.stringify(response.data));
        
        if (this.currentSession) {
          this.currentSession.user = response.data;
        }
        
        return { success: true, user: response.data };
      } else {
        return { success: false, error: response.error || 'Update failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error occurred' };
    }
  }
}

export const authManager = AuthManager.getInstance();