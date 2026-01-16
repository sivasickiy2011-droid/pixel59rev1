// Используем относительный путь чтобы работал на любом домене
const API_BASE_URL = '/api';

export const API_ENDPOINTS = {
  auth: {
    admin: `${API_BASE_URL}/auth/admin`,
    partner: `${API_BASE_URL}/auth/partner`,
    changePassword: `${API_BASE_URL}/auth/change-password`,
    logs: `${API_BASE_URL}/auth/admin/logs`,
  },
  contact: `${API_BASE_URL}/contact`,
  portfolio: {
    list: `${API_BASE_URL}/portfolio`,
    item: (id: string) => `${API_BASE_URL}/portfolio/${id}`,
  },
  partners: {
    list: `${API_BASE_URL}/partners`,
    logos: `${API_BASE_URL}/partners/logos`,
  },
  services: {
    list: `${API_BASE_URL}/services`,
    admin: `${API_BASE_URL}/services/admin`,
  },
  analytics: {
    metrika: `${API_BASE_URL}/analytics/metrika`,
    webmaster: `${API_BASE_URL}/analytics/webmaster`,
  },
  seo: {
    analyze: `${API_BASE_URL}/seo/analyze`,
    apply: `${API_BASE_URL}/seo/apply`,
  },
  upload: {
    logo: `${API_BASE_URL}/upload/logo`,
    image: `${API_BASE_URL}/upload/image`,
  },
};

export default API_ENDPOINTS;
