import { ApiResponse, ErrorResponse, ExternalServiceResponse, RateLimitInfo } from '../../types/api-responses';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retryAttempts?: number;
  apiKey?: string;
  rateLimit?: {
    maxRequests: number;
    timeWindowMs: number;
  };
}

export class ApiClient {
  private config: ApiClientConfig;
  private rateLimitInfo: RateLimitInfo | null = null;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      rateLimit: {
        maxRequests: 100,
        timeWindowMs: 60000,
      },
      ...config,
    };
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<ExternalServiceResponse<T>> {
    const url = new URL(endpoint, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    return this.makeRequest<T>('GET', url.toString());
  }

  async post<T>(endpoint: string, data?: unknown): Promise<ExternalServiceResponse<T>> {
    const url = new URL(endpoint, this.config.baseUrl);
    return this.makeRequest<T>('POST', url.toString(), data);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<ExternalServiceResponse<T>> {
    const url = new URL(endpoint, this.config.baseUrl);
    return this.makeRequest<T>('PUT', url.toString(), data);
  }

  async delete<T>(endpoint: string): Promise<ExternalServiceResponse<T>> {
    const url = new URL(endpoint, this.config.baseUrl);
    return this.makeRequest<T>('DELETE', url.toString());
  }

  private async makeRequest<T>(
    method: string,
    url: string,
    data?: unknown
  ): Promise<ExternalServiceResponse<T>> {
    await this.checkRateLimit();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'ParallelDevelopment-ApiClient/1.0',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const requestOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    };

    if (data && method !== 'GET') {
      requestOptions.body = JSON.stringify(data);
    }

    let attempt = 0;
    while (attempt < (this.config.retryAttempts || 3)) {
      try {
        const response = await fetch(url, requestOptions);
        
        // Update rate limit info from response headers
        this.updateRateLimitInfo(response);

        if (!response.ok) {
          if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            if (retryAfter && attempt < (this.config.retryAttempts || 3) - 1) {
              await this.delay(parseInt(retryAfter) * 1000);
              attempt++;
              continue;
            }
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
        }

        const responseData = await response.json();
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          status: response.status,
          data: responseData,
          headers: responseHeaders,
          rateLimitInfo: this.rateLimitInfo || undefined,
        };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout');
        }
        
        if (attempt === (this.config.retryAttempts || 3) - 1) {
          throw error;
        }
        
        await this.delay(Math.pow(2, attempt) * 1000);
        attempt++;
      }
    }

    throw new Error('All retry attempts failed');
  }

  private async checkRateLimit(): Promise<void> {
    if (!this.rateLimitInfo) return;

    const now = Date.now();
    if (this.rateLimitInfo.remaining <= 0 && this.rateLimitInfo.reset > now) {
      const waitTime = this.rateLimitInfo.reset - now;
      await this.delay(waitTime);
    }
  }

  private updateRateLimitInfo(response: Response): void {
    const limit = response.headers.get('X-RateLimit-Limit');
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');
    const retryAfter = response.headers.get('Retry-After');

    if (limit && remaining && reset) {
      this.rateLimitInfo = {
        limit: parseInt(limit),
        remaining: parseInt(remaining),
        reset: parseInt(reset) * 1000,
        retryAfter: retryAfter ? parseInt(retryAfter) : undefined,
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getRateLimitInfo(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}