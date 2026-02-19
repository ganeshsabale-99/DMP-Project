import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => apiClient.post('/auth/register', data),
  
  logout: () => apiClient.post('/auth/logout'),
  
  getMe: () => apiClient.get('/auth/me'),
  
  updateProfile: (data: Partial<any>) =>
    apiClient.put('/auth/profile', data),
  
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put('/auth/change-password', { currentPassword, newPassword }),
};

// Users API
export const usersApi = {
  getUsers: (params?: any) => apiClient.get('/users', { params }),
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  createUser: (data: any) => apiClient.post('/users', data),
  updateUser: (id: string, data: any) => apiClient.put(`/users/${id}`, data),
  deleteUser: (id: string) => apiClient.delete(`/users/${id}`),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/users/${id}/status`, { status }),
  getStats: () => apiClient.get('/users/stats'),
};

// Posts API
export const postsApi = {
  getPosts: (params?: any) => apiClient.get('/posts', { params }),
  getPost: (id: string) => apiClient.get(`/posts/${id}`),
  createPost: (data: any) => apiClient.post('/posts', data),
  updatePost: (id: string, data: any) => apiClient.put(`/posts/${id}`, data),
  deletePost: (id: string) => apiClient.delete(`/posts/${id}`),
  submitForApproval: (id: string) => apiClient.post(`/posts/${id}/submit`),
  approvePost: (id: string) => apiClient.post(`/posts/${id}/approve`),
  publishPost: (id: string) => apiClient.post(`/posts/${id}/publish`),
  getCalendar: (params?: any) => apiClient.get('/posts/calendar', { params }),
};

// Leads API
export const leadsApi = {
  getLeads: (params?: any) => apiClient.get('/leads', { params }),
  getLead: (id: string) => apiClient.get(`/leads/${id}`),
  createLead: (data: any) => apiClient.post('/leads', data),
  updateLead: (id: string, data: any) => apiClient.put(`/leads/${id}`, data),
  deleteLead: (id: string) => apiClient.delete(`/leads/${id}`),
  assignLead: (id: string, userId: string) =>
    apiClient.post(`/leads/${id}/assign`, { userId }),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/leads/${id}/status`, { status }),
  updateScore: (id: string, score: number) =>
    apiClient.patch(`/leads/${id}/score`, { score }),
  addActivity: (id: string, data: any) =>
    apiClient.post(`/leads/${id}/activities`, data),
  bulkImport: (leads: any[]) => apiClient.post('/leads/bulk-import', { leads }),
};

// Campaigns API
export const campaignsApi = {
  getCampaigns: (params?: any) => apiClient.get('/campaigns', { params }),
  getCampaign: (id: string) => apiClient.get(`/campaigns/${id}`),
  createCampaign: (data: any) => apiClient.post('/campaigns', data),
  updateCampaign: (id: string, data: any) => apiClient.put(`/campaigns/${id}`, data),
  deleteCampaign: (id: string) => apiClient.delete(`/campaigns/${id}`),
  addPost: (id: string, postId: string) =>
    apiClient.post(`/campaigns/${id}/posts`, { postId }),
  addLead: (id: string, leadId: string) =>
    apiClient.post(`/campaigns/${id}/leads`, { leadId }),
  updateStatus: (id: string, status: string) =>
    apiClient.patch(`/campaigns/${id}/status`, { status }),
  updateMetrics: (id: string, metrics: any) =>
    apiClient.patch(`/campaigns/${id}/metrics`, { metrics }),
};

// Analytics API
export const analyticsApi = {
  getOverview: (params?: any) => apiClient.get('/analytics/overview', { params }),
  getTimeSeries: (params?: any) => apiClient.get('/analytics/time-series', { params }),
  getPlatformBreakdown: (params?: any) =>
    apiClient.get('/analytics/platforms', { params }),
  getTopContent: (params?: any) => apiClient.get('/analytics/top-content', { params }),
  getCampaignPerformance: (campaignId: string) =>
    apiClient.get(`/analytics/campaigns/${campaignId}`),
  createAnalytics: (data: any) => apiClient.post('/analytics', data),
};

// AI API
export const aiApi = {
  generateContent: (data: any) => apiClient.post('/ai/generate', data),
  generateImage: (data: any) => apiClient.post('/ai/generate-image', data),
  analyzeContent: (data: any) => apiClient.post('/ai/analyze', data),
  getBestTimes: (params?: any) => apiClient.get('/ai/best-times', { params }),
};

// SEO API
export const seoApi = {
  getPages: (params?: any) => apiClient.get('/seo', { params }),
  getPage: (id: string) => apiClient.get(`/seo/${id}`),
  createPage: (data: any) => apiClient.post('/seo', data),
  updatePage: (id: string, data: any) => apiClient.put(`/seo/${id}`, data),
  deletePage: (id: string) => apiClient.delete(`/seo/${id}`),
  analyzePage: (id: string) => apiClient.post(`/seo/${id}/analyze`),
  getKeywords: (params?: any) => apiClient.get('/seo/keywords', { params }),
  bulkAnalyze: () => apiClient.post('/seo/bulk-analyze'),
};

// Messages API
export const messagesApi = {
  getMessages: (params?: any) => apiClient.get('/messages', { params }),
  getMessage: (id: string) => apiClient.get(`/messages/${id}`),
  createMessage: (data: any) => apiClient.post('/messages', data),
  updateMessage: (id: string, data: any) => apiClient.put(`/messages/${id}`, data),
  deleteMessage: (id: string) => apiClient.delete(`/messages/${id}`),
  markAsRead: (id: string) => apiClient.patch(`/messages/${id}/read`),
  reply: (id: string, reply: string) =>
    apiClient.post(`/messages/${id}/reply`, { reply }),
  assign: (id: string, userId: string) =>
    apiClient.post(`/messages/${id}/assign`, { userId }),
  getStats: () => apiClient.get('/messages/stats'),
};

// Dashboard API
export const dashboardApi = {
  getCEO: () => apiClient.get('/dashboard/ceo'),
  getMarketing: () => apiClient.get('/dashboard/marketing'),
  getLeads: () => apiClient.get('/dashboard/leads'),
  getAnalytics: (params?: any) => apiClient.get('/dashboard/analytics', { params }),
};

export default apiClient;
