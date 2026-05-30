import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('lms_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('lms_token');
      localStorage.removeItem('lms_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const authAPI = {
  signup: (data: any) => api.post('/auth/signup', data),
  login: (data: any) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Profile
export const profileAPI = {
  get: () => api.get('/profile'),
  save: (data: any) => api.post('/profile', data),
};

// Documents
export const documentAPI = {
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/documents/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  list: () => api.get('/documents'),
};

// Loans
export const loanAPI = {
  apply: (data: any) => api.post('/loans/apply', data),
  myLoans: () => api.get('/loans/my'),
  getById: (id: string) => api.get(`/loans/${id}`),
  // Sanction
  getApplied: (params?: any) => api.get('/loans/applied', { params }),
  sanction: (id: string, data: any) => api.put(`/loans/${id}/sanction`, data),
  // Disbursement
  getSanctioned: (params?: any) => api.get('/loans/sanctioned', { params }),
  disburse: (id: string, data: any) => api.put(`/loans/${id}/disburse`, data),
  // Collection
  getActive: (params?: any) => api.get('/loans/active', { params }),
  recordPayment: (id: string, data: any) => api.post(`/loans/${id}/payment`, data),
};

// Dashboard
export const dashboardAPI = {
  getLeads: (params?: any) => api.get('/dashboard/leads', { params }),
  getStats: () => api.get('/dashboard/stats'),
};
