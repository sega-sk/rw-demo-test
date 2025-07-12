import { authService } from './auth';

interface LeadAppendices {
  product_id?: string;
  rental_period?: string;
  start_date?: string;
  duration?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  comments?: string;
}

interface Lead {
  id: string;
  status: string;
  reports: Record<string, any>;
  form_slug: 'rent_a_product' | 'contact_us';
  appendices: LeadAppendices;
  created_at?: string;
  updated_at?: string;
}

interface LeadCreate {
  form_slug: 'rent_a_product' | 'contact_us';
  appendices: LeadAppendices;
}

interface LeadsListResponse {
  limit: number;
  offset: number;
  search?: string;
  sort?: string;
  total: number;
  rows: Lead[];
  available_filters?: Array<{
    label: string;
    name: string;
    values: Array<{
      label: string;
      value: string;
      count: number;
    }>;
  }>;
}

class LeadsService {
  private readonly API_BASE_URL = 'https://reel-wheel-api-x92jj.ondigitalocean.app';

  // Submit a new lead without authentication (public endpoint)
  async submitLead(data: LeadCreate): Promise<Lead> {
    try {
      console.log('Submitting lead:', data);
      
      const response = await fetch(`${this.API_BASE_URL}/v1/leads/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': '24fb20f2-d743-4ab0-a9c0-597203aea92f-f747e6cc-112f-493c-856d-1888b5b63e8f'
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to submit lead:', error);
      throw error;
    }
  }

  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.API_BASE_URL}${endpoint}`;
    
    try {
      let response = await fetch(url, {
        ...options,
        headers: {
          ...authService.getAuthHeaders(),
          'X-API-Key': '24fb20f2-d743-4ab0-a9c0-597203aea92f-f747e6cc-112f-493c-856d-1888b5b63e8f',
          ...options.headers,
        },
      });

      // Handle token refresh for 401 errors
      if (response.status === 401 && authService.isAuthenticated()) {
        try {
          await authService.refreshAccessToken();
          // Retry the request with new token
          response = await fetch(url, {
            ...options,
            headers: {
              ...authService.getAuthHeaders(),
              'X-API-Key': '24fb20f2-d743-4ab0-a9c0-597203aea92f-f747e6cc-112f-493c-856d-1888b5b63e8f',
              ...options.headers,
            },
          });
        } catch (refreshError) {
          authService.logout();
          throw new Error('Session expired. Please login again.');
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.warn(`Leads API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all leads (Admin only)
  async getLeads(params: {
    limit?: number;
    offset?: number;
    search?: string;
    sort?: string;
  } = {}): Promise<LeadsListResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    return this.makeAuthenticatedRequest(`/v1/leads/?${searchParams.toString()}`);
  }

  // Get a specific lead (Admin only)
  async getLead(leadId: string): Promise<Lead> {
    return this.makeAuthenticatedRequest(`/v1/leads/${leadId}`);
  }

  // Update lead status (Admin only)
  async updateLeadStatus(leadId: string, status: string): Promise<Lead> {
    return this.makeAuthenticatedRequest(`/v1/leads/${leadId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const leadsService = new LeadsService();
export type { Lead, LeadCreate, LeadAppendices, LeadsListResponse };