import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LinearService, ExternalServiceIntegration } from '../lib/integrations/external-service';

// Mock fetch for testing
global.fetch = vi.fn();

describe('LinearService', () => {
  let linearService: LinearService;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    linearService = new LinearService({
      baseUrl: 'https://api.linear.app/graphql',
      apiKey: 'test-linear-key',
    });
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getIssue', () => {
    it('should fetch issue by ID', async () => {
      const mockIssue = {
        id: 'test-issue-id',
        title: 'Test Issue',
        description: 'Test description',
        state: { name: 'In Progress' },
        priority: 'High',
        assignee: {
          id: 'user-id',
          name: 'Test User',
          email: 'test@example.com',
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: { issue: mockIssue }
        }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await linearService.getIssue('test-issue-id');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linear.app/graphql',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-linear-key',
          }),
          body: expect.stringContaining('GetIssue'),
        })
      );
      expect(result).toEqual(mockIssue);
    });

    it('should throw error for non-existent issue', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: { issue: null }
        }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(linearService.getIssue('non-existent')).rejects.toThrow('Issue non-existent not found');
    });
  });

  describe('searchIssues', () => {
    it('should search issues by query', async () => {
      const mockIssues = [
        {
          id: 'issue-1',
          title: 'Test Issue 1',
          description: 'Description 1',
          state: { name: 'Todo' },
          priority: 'Medium',
          assignee: null,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
      ];

      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: { issues: { nodes: mockIssues } }
        }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await linearService.searchIssues('test query');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linear.app/graphql',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('SearchIssues'),
        })
      );
      expect(result).toEqual(mockIssues);
    });
  });

  describe('createIssue', () => {
    it('should create a new issue', async () => {
      const newIssue = {
        title: 'New Issue',
        description: 'New description',
        priority: 'High',
      };

      const createdIssue = {
        id: 'new-issue-id',
        ...newIssue,
        state: { name: 'Todo' },
        assignee: null,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: { issueCreate: { issue: createdIssue } }
        }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await linearService.createIssue(newIssue);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.linear.app/graphql',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('CreateIssue'),
        })
      );
      expect(result).toEqual(createdIssue);
    });
  });
});

describe('ExternalServiceIntegration', () => {
  let integration: ExternalServiceIntegration;
  const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    integration = new ExternalServiceIntegration();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    integration.stopHealthMonitoring();
  });

  describe('service registration', () => {
    it('should register and retrieve services', () => {
      integration.registerService('test-service', {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      });

      const service = integration.getService('test-service');
      expect(service).toBeDefined();
      expect(integration.getRegisteredServices()).toContain('test-service');
    });

    it('should return undefined for non-existent service', () => {
      const service = integration.getService('non-existent');
      expect(service).toBeUndefined();
    });
  });

  describe('health checks', () => {
    beforeEach(() => {
      integration.registerService('test-service', {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      });
    });

    it('should check service health', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: 'healthy' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const health = await integration.checkServiceHealth('test-service');

      expect(health.service).toBe('test-service');
      expect(health.status).toBe('healthy');
      expect(health.endpoints.main.status).toBe('online');
      expect(typeof health.endpoints.main.responseTime).toBe('number');
    });

    it('should handle unhealthy service', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Service unavailable'));

      const health = await integration.checkServiceHealth('test-service');

      expect(health.service).toBe('test-service');
      expect(health.status).toBe('unhealthy');
      expect(health.endpoints.main.status).toBe('offline');
    });

    it('should throw error for non-existent service', async () => {
      await expect(integration.checkServiceHealth('non-existent')).rejects.toThrow('Service non-existent not found');
    });
  });

  describe('service calls', () => {
    beforeEach(() => {
      integration.registerService('test-service', {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      });
    });

    it('should make GET call to service', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await integration.makeServiceCall('test-service', 'GET', '/test');

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ data: 'test' });
    });

    it('should make POST call to service', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: () => Promise.resolve({ id: 1 }),
        headers: new Headers(),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const result = await integration.makeServiceCall('test-service', 'POST', '/test', { name: 'test' });

      expect(result.status).toBe(201);
      expect(result.data).toEqual({ id: 1 });
    });

    it('should throw error for non-existent service', async () => {
      await expect(integration.makeServiceCall('non-existent', 'GET', '/test')).rejects.toThrow('Service non-existent not found');
    });

    it('should throw error for unsupported method', async () => {
      await expect(integration.makeServiceCall('test-service', 'PATCH' as any, '/test')).rejects.toThrow('Unsupported method: PATCH');
    });
  });

  describe('health monitoring', () => {
    beforeEach(() => {
      integration.registerService('test-service', {
        baseUrl: 'https://api.test.com',
        apiKey: 'test-key',
      });
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start and stop health monitoring', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      integration.startHealthMonitoring(1000);
      
      expect(integration['healthCheckInterval']).toBeDefined();
      
      integration.stopHealthMonitoring();
      
      expect(integration['healthCheckInterval']).toBeUndefined();
      
      consoleSpy.mockRestore();
    });
  });
});