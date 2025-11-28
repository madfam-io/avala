/**
 * API Client for AVALA Backend
 * Handles authentication, tenant context, and request/response formatting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export class ApiClient {
  private baseUrl: string;
  private tenantId: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set tenant context for all requests
   */
  setTenantId(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Clear tenant context
   */
  clearTenantId() {
    this.tenantId = null;
  }

  /**
   * Make authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    // Add tenant header if available
    if (this.tenantId) {
      headers["X-Tenant-Id"] = this.tenantId;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include", // Include cookies for JWT
    };

    const url = `${this.baseUrl}/v1${endpoint}`;

    try {
      const response = await fetch(url, config);

      // Handle non-OK responses
      if (!response.ok) {
        const error: ApiError = await response.json().catch(() => ({
          message: response.statusText,
          statusCode: response.status,
        }));
        throw error;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      // Re-throw ApiError or convert to ApiError
      if ((error as ApiError).statusCode) {
        throw error;
      }
      throw {
        message: (error as Error).message || "Network error",
        statusCode: 0,
      } as ApiError;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Singleton instance
export const apiClient = new ApiClient();
