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
  news: {
    feed: `${API_BASE_URL}/265f74c3-c0a3-4d44-b005-9119dff641cf`,
    adminRefresh: `${API_BASE_URL}/7aa533b8-b464-4b36-bd36-9c34cb6d0b8e`,
    adminCrud: `${API_BASE_URL}/c5a1b2d3-e4f5-6789-abcd-ef0123456789`,
  },
  upload: {
    logo: `${API_BASE_URL}/upload/logo`,
    image: `${API_BASE_URL}/upload/image`,
  },
};

export default API_ENDPOINTS;
