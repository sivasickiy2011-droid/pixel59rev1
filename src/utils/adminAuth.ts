export const getAdminAuthHeader = (): Record<string, string> | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const token = localStorage.getItem('admin_auth');
  if (!token) return undefined;

  return { 'x-admin-token': token };
};

export const requireAdminAuthHeaders = (existing?: HeadersInit) => {
  const header = getAdminAuthHeader();
  if (!header) {
    return existing;
  }
  return {
    ...(existing || {}),
    ...header,
  };
};
