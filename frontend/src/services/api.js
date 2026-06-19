import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  // baseURL: '/api/v1' ,
  baseURL:'https://debox.ditbilling.store/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem('billflow-auth');
    if (stored) {
      try {
        const { state } = JSON.parse(stored);
        if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
      } catch {}
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';
    if (error.response?.status === 401) {
      localStorage.removeItem('billflow-auth');
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again');
    }
    return Promise.reject(error);
  }
);

export default api;

export const clientService = {
  getAll:    (params) => api.get('/clients', { params }),
  getOne:    (id)     => api.get(`/clients/${id}`),
  create:    (data)   => api.post('/clients', data),
  update:    (id, data) => api.put(`/clients/${id}`, data),
  delete:    (id)     => api.delete(`/clients/${id}`),
  getLedger: (id)     => api.get(`/clients/${id}/ledger`),
};

export const quotationService = {
  getAll:       (params)    => api.get('/quotations', { params }),
  getOne:       (id, config)=> api.get(`/quotations/${id}`, config),
  create:       (data)      => api.post('/quotations', data),
  update:       (id, data)  => api.put(`/quotations/${id}`, data),
  delete:       (id)        => api.delete(`/quotations/${id}`),
  updateStatus: (id, s)     => api.patch(`/quotations/${id}/status`, { status: s }),
  downloadPdf:  (id)        => api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
  email:        (id)        => api.post(`/quotations/${id}/email`),
};

export const purchaseOrderService = {
  getAll:       (params)   => api.get('/purchase-orders', { params }),
  getOne:       (id)       => api.get(`/purchase-orders/${id}`),
  create:       (data)     => api.post('/purchase-orders', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:       (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete:       (id)       => api.delete(`/purchase-orders/${id}`),
  updateStatus: (id, status) => api.patch(`/purchase-orders/${id}/status`, { status }),
  convertToPI:  (id)       => api.post(`/purchase-orders/${id}/convert-to-pi`),
};

export const proformaService = {
  getAll:           (params)   => api.get('/proforma-invoices', { params }),
  getOne:           (id)       => api.get(`/proforma-invoices/${id}`),
  create:           (data)     => api.post('/proforma-invoices', data),
  update:           (id, data) => api.put(`/proforma-invoices/${id}`, data),
  delete:           (id)       => api.delete(`/proforma-invoices/${id}`),
  updateStatus:     (id, status) => api.patch(`/proforma-invoices/${id}/status`, { status }),
  downloadPdf:      (id)       => api.get(`/proforma-invoices/${id}/pdf`, { responseType: 'blob' }),
  email:            (id)       => api.post(`/proforma-invoices/${id}/email`),
  convertToInvoice: (id)       => api.post(`/proforma-invoices/${id}/convert-to-invoice`),
};

export const invoiceService = {
  getAll:       (params)   => api.get('/final-invoices', { params }),
  getOne:       (id)       => api.get(`/final-invoices/${id}`),
  create:       (data)     => api.post('/final-invoices', data),
  update:       (id, data) => api.put(`/final-invoices/${id}`, data),
  delete:       (id)       => api.delete(`/final-invoices/${id}`),
  updateStatus: (id, status) => api.patch(`/final-invoices/${id}/status`, { status }),
  downloadPdf:  (id)       => api.get(`/final-invoices/${id}/pdf`, { responseType: 'blob' }), // fixed: was /email
  email:        (id)       => api.post(`/final-invoices/${id}/email`),                        // added: was missing
};

export const paymentService = {
  getAll:          (params) => api.get('/payments', { params }),
  getOne:          (id)     => api.get(`/payments/${id}`),
  create:          (data)   => api.post('/payments', data),
  delete:          (id)     => api.delete(`/payments/${id}`),
  downloadReceipt: (id)     => api.get(`/payments/${id}/receipt`, { responseType: 'blob' }),
};

export const productService = {
  getAll:  (params)   => api.get('/products', { params }),
  create:  (data)     => api.post('/products', data),
  update:  (id, data) => api.put(`/products/${id}`, data),
  delete:  (id)       => api.delete(`/products/${id}`),
};

export const dashboardService = {
  get: () => api.get('/dashboard'),
};

export const reportService = {
  getRevenue:     (params) => api.get('/reports/revenue', { params }),
  getGST:         (params) => api.get('/reports/gst', { params }),
  getOutstanding: ()       => api.get('/reports/outstanding'),
};

export const settingsService = {
  get:        ()         => api.get('/settings'),
  update:     (data)     => api.put('/settings', data),             // ✅ PUT not PATCH
  uploadLogo: (formData) => api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};