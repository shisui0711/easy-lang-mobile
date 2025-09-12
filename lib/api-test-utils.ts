import { apiClient } from './api';

/**
 * Utility functions for testing API connectivity and authentication
 */

export const apiTestUtils = {
  /**
   * Test basic API connectivity
   */
  async testConnectivity(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await apiClient.get('/test');
      if (response.success) {
        return {
          success: true,
          message: 'API connection successful',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: `API connection failed: ${response.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Network error: ${error.message}`
      };
    }
  },

  /**
   * Test authentication status
   */
  async testAuthentication(): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const response = await apiClient.get('/test/auth');
      if (response.success) {
        return {
          success: true,
          message: 'Authentication successful',
          user: response.data?.user
        };
      } else {
        return {
          success: false,
          message: `Authentication failed: ${response.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Auth test error: ${error.message}`
      };
    }
  },

  /**
   * Test mobile-specific authentication
   */
  async testMobileAuthentication(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await apiClient.get('/test/mobile-auth');
      if (response.success) {
        return {
          success: true,
          message: 'Mobile authentication successful',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: `Mobile authentication failed: ${response.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Mobile auth test error: ${error.message}`
      };
    }
  },

  /**
   * Test writing exercises endpoint
   */
  async testWritingExercises(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await apiClient.get('/writing/exercises', {
        params: {
          type: 'SENTENCE',
          level: 'Beginner',
          pageSize: 5
        }
      });
      if (response.success) {
        return {
          success: true,
          message: 'Writing exercises endpoint working',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: `Writing exercises failed: ${response.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Writing exercises error: ${error.message}`
      };
    }
  },

  /**
   * Test writing submissions endpoint
   */
  async testWritingSubmissions(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await apiClient.get('/writing/submissions');
      if (response.success) {
        return {
          success: true,
          message: 'Writing submissions endpoint working',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: `Writing submissions failed: ${response.error}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Writing submissions error: ${error.message}`
      };
    }
  },

  /**
   * Run all tests
   */
  async runAllTests(): Promise<any> {
    const results: any = {};
    
    results.connectivity = await this.testConnectivity();
    results.authentication = await this.testAuthentication();
    results.mobileAuth = await this.testMobileAuthentication();
    results.writingExercises = await this.testWritingExercises();
    results.writingSubmissions = await this.testWritingSubmissions();
    
    return results;
  },

  /**
   * Get detailed information about the current API setup
   */
  async getApiInfo(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      userAgent: 'Mobile App',
      clientType: 'React Native Expo',
      // Add more info as needed
    };
  }
};