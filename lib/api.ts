import { ApiResponse } from '@/types';
import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';

// Configure base URL - replace with your actual API URL
// For mobile development, you'll need to use your machine's IP address
// instead of localhost since localhost on mobile refers to the device itself
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.104.107.221:3000/api'; // Default to localhost for development

// Add retry configuration
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second
const CONFIG = {
    baseURL: BASE_URL,
      timeout: 15000, // Increased timeout for mobile networks
      headers: {
        'Content-Type': 'application/json',
      },
  }

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create(CONFIG);

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync('authToken');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Added auth token to request');
          } else {
            console.log('No auth token found');
          }
          
          // Add additional headers for mobile app identification
          config.headers['X-Client-Type'] = 'mobile';
          config.headers['X-App-Version'] = '1.0.0';
          
          // Don't override Content-Type for FormData (let browser set it with boundary)
          if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
          }
          
          console.log(`Making request to: ${config?.baseURL ?? "/" + config?.url}`);
          console.log('Request headers:', config.headers);
          
          return config;
        } catch (error) {
          console.error('Error setting auth token:', error);
          return config;
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling and retry logic
    this.client.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        console.log('API Error:', error.response?.status, error.response?.data, error.config?.url);
        
        // Handle authentication errors
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Check if this is an "Authentication required" error
          if (!originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
              // Try to refresh the token if we have one stored
              const storedToken = await SecureStore.getItemAsync('authToken');
              if (storedToken) {
                // Attempt to refresh or re-validate token with backend
                const refreshResponse = await this.attemptTokenRefresh();
                if (refreshResponse) {
                  // Retry the original request with new token
                  return this.client(originalRequest);
                }
              }
            } catch (refreshError) {
              console.error('Token refresh failed:', refreshError);
            }
          }
          
          // Token refresh failed or no token available, clear auth data
          await this.clearAuthData();
          // You might want to navigate to login screen here
        }
        
        // Handle network errors with retry
        if (this.shouldRetry(error) && !originalRequest._retryCount) {
          originalRequest._retryCount = 0;
        }
        
        if (this.shouldRetry(error) && originalRequest._retryCount < MAX_RETRY_ATTEMPTS) {
          originalRequest._retryCount++;
          const delay = RETRY_DELAY * originalRequest._retryCount;
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client(originalRequest);
        }
        
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: { params?: any }): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async post<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return this.handleError(error);
    }
  }

  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      // Try to call a token refresh endpoint or re-validate current token
      const response = await this.client.post('/auth/refresh');
      if (response.data?.token) {
        await SecureStore.setItemAsync('authToken', response.data.token);
        return true;
      }
    } catch (error) {
      console.error('Token refresh attempt failed:', error);
    }
    return false;
  }

  private async clearAuthData(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('authToken');
      await SecureStore.deleteItemAsync('user');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  }

  private shouldRetry(error: AxiosError): boolean {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }

  private handleError(error: any): ApiResponse<any> {
    let message = 'An unexpected error occurred';
    
    if (error.response) {
      // Server responded with error status
      const statusCode = error.response.status;
      const responseData = error.response.data;
      
      if (statusCode === 401 || statusCode === 403) {
        message = 'Authentication failed. Please log in again.';
      } else if (statusCode === 404) {
        message = 'The requested resource was not found.';
      } else if (statusCode >= 500) {
        message = 'Server error. Please try again later.';
      } else {
        message = responseData?.message || responseData?.error || error.response.statusText;
      }
    } else if (error.request) {
      // Request was made but no response received
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        message = 'Network connection failed. Please check your internet connection.';
      } else {
        message = 'Network error - please check your connection';
      }
    } else {
      // Something else happened
      message = error.message || 'An unexpected error occurred';
    }

    console.error('API Error:', {
      message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });

    return {
      success: false,
      error: message,
    };
  }
}

export const apiClient = new ApiClient();

// Test and utility functions
export const testApi = {
  // Test basic API connectivity
  testConnection: () => apiClient.get('/test'),
  
  // Test authentication
  testAuth: () => apiClient.get('/test/auth'),
  
  // Test mobile authentication
  testMobileAuth: () => apiClient.get('/test/mobile-auth'),
  
  // Health check
  health: () => apiClient.get('/health'),
  
  // Test writing exercises endpoint
  testWritingExercises: () => apiClient.get('/writing/exercises', {
    params: {
      type: 'SENTENCE',
      level: 'Beginner',
      pageSize: 5
    }
  }),
};

// Authentication API functions
export const authApi = {
  // Login
  login: (credentials: any) => apiClient.post('/auth/login', credentials),
  
  // Register
  register: (data: any) => apiClient.post('/auth/register', data),
  
  // Logout
  logout: () => apiClient.post('/auth/logout'),
  
  // Refresh token
  refresh: () => apiClient.post('/auth/refresh'),
  
  // Get current user profile
  getProfile: () => apiClient.get('/user/profile'),
  
  // Update profile
  updateProfile: (data: any) => apiClient.put('/user/profile', data),
};

// Learning module specific API functions with improved error handling
export const learningApi = {
  // Vocabulary APIs
  getVocabularyReview: () => apiClient.get('/review'),
  submitVocabularyRating: (wordId: string, rating: number) => 
    apiClient.post('/review/update', { wordId, rating }),
  // Vocabulary management APIs
  getVocabularyCards: (params?: any) => apiClient.get('/vocabulary', { params }),
  addVocabularyCard: (data: any) => apiClient.post('/vocabulary', data),
  updateVocabularyCard: (id: string, data: any) => apiClient.put(`/vocabulary/${id}`, data),
  deleteVocabularyCard: (id: string) => apiClient.delete(`/vocabulary/${id}`),
  // Vocabulary practice APIs
  generatePracticeQuestions: (vocabularyCardId: string, count?: number) => 
    apiClient.post('/vocabulary/questions', { vocabularyCardId, count }),
  checkPracticeAnswer: (questionId: string, userAnswer: string, vocabularyCardId: string) => 
    apiClient.put('/vocabulary/questions', { questionId, userAnswer, vocabularyCardId }),
  
  // Writing APIs
  getWritingExercises: (params?: any) => {
    console.log('Fetching writing exercises with params:', params);
    return apiClient.get('/writing/exercises', { params });
  },
  submitWriting: (exerciseId: string, content: string, writingTime: number) =>
    apiClient.post('/writing/submissions', { exerciseId, content, writingTime }),
  getWritingSubmissions: () => 
    apiClient.get('/writing/submissions'),
  
  // Reading APIs
  getReadingExercises: (params?: any) => 
    apiClient.get('/reading/exercises', { params }),
  submitReadingAnswers: (exerciseId: string, answers: any, readingTime: number) =>
    apiClient.post('/reading/submissions', { exerciseId, answers, readingTime }),
  getReadingSubmissions: () => 
    apiClient.get('/reading/submissions'),
  
  // Listening APIs
  getListeningExercises: (params?: any) => 
    apiClient.get('/listening/exercises', { params }),
  submitListeningAnswers: (exerciseId: string, answers: any, transcription?: string, listeningTime?: number) =>
    apiClient.post('/listening/submissions', { exerciseId, answers, transcription, listeningTime }),
  getListeningSubmissions: () => 
    apiClient.get('/listening/submissions'),
  
  // Speaking APIs
  getSpeakingExercises: (params?: any) => 
    apiClient.get('/speaking/exercises', { params }),
  submitSpeakingRecording: (exerciseId: string, audioUri: string) =>
    apiClient.post('/speaking/submissions', { exerciseId, audioUri }),
  getSpeakingSubmissions: () => 
    apiClient.get('/speaking/submissions'),
  
  // Grammar APIs (if implemented on backend)
  getGrammarLessons: (params?: any) => 
    apiClient.get('/grammar/lessons', { params }),
  submitGrammarAnswers: (lessonId: string, answers: any) =>
    apiClient.post('/grammar/submissions', { lessonId, answers }),
  getGrammarSubmissions: () =>
    apiClient.get('/grammar/submissions'),
};

// AI API functions
export const aiApi = {
  // STT (Speech-to-Text) APIs
  transcribeAudio: (formData: FormData) =>
    apiClient.post('/ai/stt', formData),
  transcribeBatch: (formData: FormData) =>
    apiClient.post('/ai/stt/batch', formData),
  getSTTInfo: (params?: { type?: 'engines' | 'languages' | 'health' }) =>
    apiClient.get('/ai/stt', { params }),
  
  // Translation APIs
  translateText: (data: {
    text: string;
    target_language: string;
    source_language?: string;
    engine?: string;
    model?: string;
    confidence_threshold?: number;
  }) => apiClient.post('/ai/translation', data),
  translateBatch: (data: {
    texts: string[];
    target_language: string;
    source_language?: string;
    engine?: string;
  }) => apiClient.post('/ai/translation/batch', data),
  detectLanguage: (formData: FormData) =>
    apiClient.post('/ai/translation/detect', formData),
  quickTranslate: (formData: FormData) =>
    apiClient.post('/ai/translation/quick', formData),
  getTranslationInfo: (params?: { type?: 'engines' | 'languages' | 'pairs' }) =>
    apiClient.get('/ai/translation', { params }),
  
  // TTS (Text-to-Speech) APIs
  generateSpeech: (data: {
    text: string;
    language?: string;
    engine?: string;
    voice?: string;
    speed?: number;
  }) => apiClient.post('/ai/tts', data),
  quickTTS: (data: {
    text: string;
    language?: string;
    engine?: string;
  }) =>
    apiClient.post('/ai/tts/quick', data),
  getTTSInfo: (params?: { type?: 'voices' | 'engines' }) =>
    apiClient.get('/ai/tts', { params }),
  downloadAudio: (audioId: string) =>
    apiClient.get(`/ai/tts/download/${audioId}`),
  
  // Health and Capabilities APIs
  getAIHealth: () =>
    apiClient.get('/ai/health'),
  initializeAIServices: () =>
    apiClient.post('/ai/health'),
  getAICapabilities: () =>
    apiClient.get('/ai/capabilities'),
};