interface LoginCredentials {
  email: string;
  password: string;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface User {
  id: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * AuthService handles authentication using access and refresh tokens.
 * - On login: stores access_token (short-lived) and refresh_token (long-lived).
 * - On 401 error: tries to refresh access_token using refresh_token.
 * - If refresh fails: logs out and user must login again.
 * - Tokens are stored in localStorage (for demo; use secure storage in production).
 */
class AuthService {
  private readonly API_BASE_URL = 'https://reel-wheel-api-x92jj.ondigitalocean.app';
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private onLogoutCallback: (() => void) | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    this.loadTokensFromStorage();
  }

  setOnLogout(callback: () => void) {
    this.onLogoutCallback = callback;
  }

  private loadTokensFromStorage() {
    this.accessToken = localStorage.getItem('access_token');
    this.refreshToken = localStorage.getItem('refresh_token');
  }

  private saveTokensToStorage(tokens: TokenResponse) {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  }

  private clearTokensFromStorage() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    // Clear any demo auth data
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('demo_user');
  }

  async login(credentials: LoginCredentials): Promise<TokenResponse> {
    try {
      // Login returns access_token and refresh_token
      const response = await fetch(`${this.API_BASE_URL}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: credentials.email,
          password: credentials.password,
          grant_type: 'password'
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Login failed');
      }

      // Store both tokens
      const tokens: TokenResponse = await response.json();
      this.saveTokensToStorage(tokens);
      return tokens;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async refreshAccessToken(): Promise<TokenResponse> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      // Use refresh_token to get new access_token
      const response = await fetch(`${this.API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: this.refreshToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // If refresh fails, clear tokens and logout
        this.clearTokensFromStorage();
        if (this.onLogoutCallback) {
          this.onLogoutCallback();
        }
        throw new Error(error.detail || 'Token refresh failed');
      }

      // Store new tokens
      const tokens: TokenResponse = await response.json();
      this.saveTokensToStorage(tokens);
      return tokens;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokensFromStorage();
      if (this.onLogoutCallback) {
        this.onLogoutCallback();
      }
      throw error;
    }
  }

  logout() {
    this.clearTokensFromStorage();
    // Notify AuthContext about logout
    if (this.onLogoutCallback) {
      this.onLogoutCallback();
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  // Get current user info from token (you might need to decode JWT or call API)
  getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }

    // For now, return a basic user object
    // In a real implementation, you might decode the JWT token or call an API
    return {
      id: '1',
      email: 'admin@reelwheelsexperience.com',
      role: 'admin'
    };
  }
}

export const authService = new AuthService();
export type { LoginCredentials, TokenResponse, User };