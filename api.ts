const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    const response = await this.request<{
      token: string;
      user: any;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    brandId?: string;
  }) {
    const response = await this.request<{
      token: string;
      user: any;
      message: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    return response;
  }

  async logout() {
    await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async getProfile() {
    return this.request<{ user: any }>('/auth/profile');
  }

  async updateProfile(updates: { name?: string; preferences?: any }) {
    return this.request<{ user: any; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Clothing methods
  async getClothingItems(params: {
    page?: number;
    limit?: number;
    category?: string;
    style?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    brandId?: string;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request<{
      items: any[];
      pagination: any;
    }>(`/clothing${queryString ? `?${queryString}` : ''}`);
  }

  async getClothingItem(id: string) {
    return this.request<{ item: any }>(`/clothing/${id}`);
  }

  async createClothingItem(itemData: any) {
    return this.request<{ item: any; message: string }>('/clothing', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateClothingItem(id: string, updates: any) {
    return this.request<{ item: any; message: string }>(`/clothing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteClothingItem(id: string) {
    return this.request<{ message: string }>(`/clothing/${id}`, {
      method: 'DELETE',
    });
  }

  // Try-on methods
  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('photo', file);

    return this.request<{ photoUrl: string; message: string }>('/try-on/upload-photo', {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    });
  }

  async createTryOnSession(sessionData: {
    userPhotoUrl: string;
    clothingItems: any[];
    lightingSettings: any;
  }) {
    return this.request<{ session: any; message: string }>('/try-on/session', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getTryOnSessions(page = 1, limit = 20) {
    return this.request<{
      sessions: any[];
      pagination: any;
    }>(`/try-on/sessions?page=${page}&limit=${limit}`);
  }

  async getTryOnSession(id: string) {
    return this.request<{ session: any }>(`/try-on/sessions/${id}`);
  }

  async markSessionAsConverted(id: string) {
    return this.request<{ message: string }>(`/try-on/sessions/${id}/convert`, {
      method: 'POST',
    });
  }

  // User methods
  async updatePreferences(preferences: any) {
    return this.request<{ preferences: any; message: string }>('/users/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  }

  async getTryOnHistory(page = 1, limit = 20) {
    return this.request<{
      sessions: any[];
      pagination: any;
    }>(`/users/try-on-history?page=${page}&limit=${limit}`);
  }

  async getFavorites() {
    return this.request<{ favorites: any[] }>('/users/favorites');
  }

  async getRecommendations() {
    return this.request<{ recommendations: any[] }>('/users/recommendations');
  }

  // Analytics methods
  async getAnalyticsDashboard(params: {
    startDate?: string;
    endDate?: string;
    brandId?: string;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request<{
      metrics: any;
      trends: any[];
      categories: any[];
      engagement: any;
      dateRange: any;
    }>(`/analytics/dashboard${queryString ? `?${queryString}` : ''}`);
  }

  async getConversionFunnel(params: {
    startDate?: string;
    endDate?: string;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request<{ funnel: any[] }>(`/analytics/funnel${queryString ? `?${queryString}` : ''}`);
  }

  async getRealtimeAnalytics() {
    return this.request<{
      activity: any[];
      activeUsers: number;
      lastUpdated: string;
    }>('/analytics/realtime');
  }

  // Admin methods
  async getBrands(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request<{
      brands: any[];
      pagination: any;
    }>(`/admin/brands${queryString ? `?${queryString}` : ''}`);
  }

  async createBrand(brandData: {
    name: string;
    logoUrl?: string;
    subscriptionPlan?: string;
  }) {
    return this.request<{ brand: any; message: string }>('/admin/brands', {
      method: 'POST',
      body: JSON.stringify(brandData),
    });
  }

  async updateBrand(id: string, updates: any) {
    return this.request<{ brand: any; message: string }>(`/admin/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getUsers(params: {
    page?: number;
    limit?: number;
    role?: string;
    brandId?: string;
  } = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    ).toString();

    return this.request<{
      users: any[];
      pagination: any;
    }>(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async updateUser(id: string, updates: any) {
    return this.request<{ user: any; message: string }>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getPlatformStats() {
    return this.request<{
      overview: any;
      growth: any;
    }>('/admin/stats');
  }

  // Health check
  async healthCheck() {
    return this.request<{
      status: string;
      timestamp: string;
      uptime: number;
    }>('/health');
  }
}

export const apiService = new ApiService();
export default apiService;