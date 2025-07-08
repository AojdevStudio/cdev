export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code?: string;
  timestamp: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}

export interface LinearIssueResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExternalServiceResponse<T = unknown> {
  status: number;
  data: T;
  headers: Record<string, string>;
  rateLimitInfo?: RateLimitInfo;
}

export interface ServiceHealthResponse {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  endpoints: {
    [key: string]: {
      status: 'online' | 'offline';
      responseTime?: number;
    };
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}