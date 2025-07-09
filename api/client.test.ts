import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ApiClient } from '../lib/api/client';

// Mock fetch for testing
global.fetch = vi.fn();

describe('ApiClient', () => {
  let client: ApiClient;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retryAttempts: 3,
      apiKey: 'test-api-key',
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data: 'test' });
    });

    it('should handle GET request with query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await client.get('/test', { param1: 'value1', param2: 'value2' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test?param1=value1&param2=value2',
        expect.any(Object)
      );
    });
  });

  describe('POST requests', () => {
    it('should make successful POST request', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1, name: 'test' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const postData = { name: 'test' };
      const result = await client.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
        })
      );
      expect(result.status).toBe(201);
      expect(result.data).toEqual({ id: 1, name: 'test' });
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ message: 'Resource not found' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(client.get('/nonexistent')).rejects.toThrow('HTTP 404: Resource not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      const abortError = new Error('Request timeout');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(client.get('/test')).rejects.toThrow('Request timeout');
    });
  });

  describe('Rate limiting', () => {
    it('should handle rate limit headers', async () => {
      const headers = new Headers();
      headers.set('X-RateLimit-Limit', '100');
      headers.set('X-RateLimit-Remaining', '50');
      headers.set('X-RateLimit-Reset', '1609459200');

      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers,
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await client.get('/test');

      expect(result.rateLimitInfo).toEqual({
        limit: 100,
        remaining: 50,
        reset: 1609459200000,
      });
    });

    it('should handle 429 Too Many Requests', async () => {
      const headers = new Headers();
      headers.set('Retry-After', '60');

      const mockResponse = {
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: () => Promise.resolve({ message: 'Rate limit exceeded' }),
        headers,
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(client.get('/test')).rejects.toThrow('HTTP 429: Rate limit exceeded');
    });
  });

  describe('Retry mechanism', () => {
    it('should retry on failure', async () => {
      const failureResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
        headers: new Headers(),
      };
      
      const successResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success' }),
        headers: new Headers(),
      };

      mockFetch
        .mockResolvedValueOnce(failureResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data: 'success' });
    });
  });

  describe('Health check', () => {
    it('should return true for healthy service', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/health',
        expect.any(Object)
      );
    });

    it('should return false for unhealthy service', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      const isHealthy = await client.healthCheck();

      expect(isHealthy).toBe(false);
    });
  });
});