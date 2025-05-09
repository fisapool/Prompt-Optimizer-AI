import { errorHandler } from '../error-handling';

interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
  isApiError?: boolean;
}

export class ApiService {
  private static instance: ApiService;
  private config: ApiConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private readonly RATE_LIMIT = 10; // requests per minute
  private readonly RATE_WINDOW = 60 * 1000; // 1 minute
  private requestTimestamps: number[] = [];

  private constructor(config: ApiConfig) {
    this.config = config;
  }

  static getInstance(config: ApiConfig): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService(config);
    }
    return ApiService.instance;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return errorHandler.withRetry(
      'api-request',
      async () => {
        // Check rate limit
        await this.checkRateLimit();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
          const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
            ...options,
            signal: controller.signal,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw this.createApiError(
              errorData.message || `HTTP error! status: ${response.status}`,
              response.status,
              errorData
            );
          }

          return await response.json();
        } catch (error) {
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              throw this.createApiError('Request timeout', 408);
            }
            throw this.createApiError(error.message, 500);
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      {
        endpoint,
        method: options.method || 'GET',
        config: this.config
      }
    );
  }

  private createApiError(message: string, status?: number, data?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.data = data;
    error.isApiError = true;
    return error;
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.RATE_WINDOW
    );

    if (this.requestTimestamps.length >= this.RATE_LIMIT) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = this.RATE_WINDOW - (now - oldestTimestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestTimestamps.push(now);
  }

  // Convenience methods for common HTTP methods
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
} 