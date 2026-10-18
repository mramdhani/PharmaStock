import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: Inject JWT token dari localStorage
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pharmastock_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Helper: Ekstraksi pesan error API yang ramah pengguna
export function getApiErrorMessage(err: unknown, fallback = 'Terjadi kesalahan sistem'): string {
  const axiosErr = err as {
    response?: {
      data?: {
        message?: string | string[];
        errors?: string | string[];
      };
    };
  };

  const data = axiosErr.response?.data;
  if (!data) return fallback;

  // 1. Pesan validasi array dari DTO (misal: ['name must be a string'])
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(', ');
  }
  // 2. Pesan spesifik dari backend (misal: "Input pada field 'name' mengandung kata kasar/dilarang...")
  if (typeof data.message === 'string' && data.message.trim()) {
    if (data.message !== 'Validation failed') {
      return data.message;
    }
  }
  if (Array.isArray(data.message) && data.message.length > 0) {
    return data.message.join(', ');
  }
  // 3. String errors yang bukan nama status HTTP generik
  if (
    typeof data.errors === 'string' &&
    !['Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Internal Server Error'].includes(
      data.errors,
    )
  ) {
    return data.errors;
  }

  return (typeof data.message === 'string' && data.message) || fallback;
}

// ============ Auth ============
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
};

// ============ Dashboard ============
export const dashboardApi = {
  getSummary: () => api.get('/dashboard/summary'),
};

// ============ Categories ============
export const categoriesApi = {
  getAll: (params?: any) => api.get('/categories', { params }),
  getOne: (id: string) => api.get(`/categories/${id}`),
  create: (data: { name: string }) => api.post('/categories', data),
  update: (id: string, data: { name: string }) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// ============ Products ============
export const productsApi = {
  getAll: (params?: any) => api.get('/products', { params }),
  getOne: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// ============ Batches ============
export const batchesApi = {
  getAll: (params?: any) => api.get('/batches', { params }),
  getExpiring: (days?: number) => api.get('/batches/expiring', { params: { days } }),
  create: (data: any) => api.post('/batches', data),
  update: (id: string, data: any) => api.patch(`/batches/${id}`, data),
};

// ============ Stock ============
export const stockApi = {
  stockIn: (data: any) => api.post('/stock/in', data),
  stockOut: (data: any) => api.post('/stock/out', data),
  getMovements: (params?: any) => api.get('/stock/movements', { params }),
};

// ============ Users ============
export const usersApi = {
  getAll: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
};

// ============ System ============
export const systemApi = {
  resetDemo: () => api.post('/system/reset-demo'),
};

export default api;
