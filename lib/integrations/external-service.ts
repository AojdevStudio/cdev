import { ApiClient, ApiClientConfig } from '../api/client';
import { LinearIssueResponse, ServiceHealthResponse, ExternalServiceResponse } from '../../types/api-responses';

export interface LinearClientConfig extends ApiClientConfig {
  apiKey: string;
}

export class LinearService {
  private client: ApiClient;

  constructor(config: LinearClientConfig) {
    this.client = new ApiClient({
      ...config,
      baseUrl: 'https://api.linear.app/graphql',
    });
  }

  async getIssue(issueId: string): Promise<LinearIssueResponse> {
    const query = `
      query GetIssue($id: String!) {
        issue(id: $id) {
          id
          title
          description
          state {
            name
          }
          priority
          assignee {
            id
            name
            email
          }
          createdAt
          updatedAt
        }
      }
    `;

    const response = await this.client.post<{ data: { issue: LinearIssueResponse } }>('', {
      query,
      variables: { id: issueId },
    });

    if (!response.data.data.issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    return response.data.data.issue;
  }

  async searchIssues(query: string, limit = 10): Promise<LinearIssueResponse[]> {
    const graphqlQuery = `
      query SearchIssues($query: String!, $first: Int!) {
        issues(filter: { title: { contains: $query } }, first: $first) {
          nodes {
            id
            title
            description
            state {
              name
            }
            priority
            assignee {
              id
              name
              email
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const response = await this.client.post<{ data: { issues: { nodes: LinearIssueResponse[] } } }>('', {
      query: graphqlQuery,
      variables: { query, first: limit },
    });

    return response.data.data.issues.nodes;
  }

  async createIssue(issue: Partial<LinearIssueResponse>): Promise<LinearIssueResponse> {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          issue {
            id
            title
            description
            state {
              name
            }
            priority
            assignee {
              id
              name
              email
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const response = await this.client.post<{ data: { issueCreate: { issue: LinearIssueResponse } } }>('', {
      query: mutation,
      variables: { input: issue },
    });

    return response.data.data.issueCreate.issue;
  }
}

export class ExternalServiceIntegration {
  private services: Map<string, ApiClient> = new Map();
  private healthCheckInterval?: NodeJS.Timeout;

  registerService(name: string, config: ApiClientConfig): void {
    const client = new ApiClient(config);
    this.services.set(name, client);
  }

  getService(name: string): ApiClient | undefined {
    return this.services.get(name);
  }

  async checkServiceHealth(serviceName: string): Promise<ServiceHealthResponse> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    const startTime = Date.now();
    const isHealthy = await service.healthCheck();
    const responseTime = Date.now() - startTime;

    return {
      service: serviceName,
      status: isHealthy ? 'healthy' : 'unhealthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        main: {
          status: isHealthy ? 'online' : 'offline',
          responseTime: responseTime,
        },
      },
    };
  }

  async checkAllServicesHealth(): Promise<ServiceHealthResponse[]> {
    const healthChecks = Array.from(this.services.keys()).map(serviceName =>
      this.checkServiceHealth(serviceName)
    );

    return Promise.all(healthChecks);
  }

  startHealthMonitoring(intervalMs = 60000): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const healthResults = await this.checkAllServicesHealth();
        const unhealthyServices = healthResults.filter(result => result.status !== 'healthy');
        
        if (unhealthyServices.length > 0) {
          console.warn('Unhealthy services detected:', unhealthyServices);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, intervalMs);
  }

  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  async makeServiceCall<T>(
    serviceName: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown
  ): Promise<ExternalServiceResponse<T>> {
    const service = this.services.get(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }

    switch (method) {
      case 'GET':
        return service.get<T>(endpoint, data as Record<string, string>);
      case 'POST':
        return service.post<T>(endpoint, data);
      case 'PUT':
        return service.put<T>(endpoint, data);
      case 'DELETE':
        return service.delete<T>(endpoint);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  getRateLimitInfo(serviceName: string) {
    const service = this.services.get(serviceName);
    return service?.getRateLimitInfo();
  }
}

export const createLinearService = (apiKey: string): LinearService => {
  return new LinearService({
    baseUrl: 'https://api.linear.app/graphql',
    apiKey,
    timeout: 30000,
    retryAttempts: 3,
  });
};

export const createExternalServiceIntegration = (): ExternalServiceIntegration => {
  return new ExternalServiceIntegration();
};