// Central registry for backend endpoints (no hardcoded URLs in components/services).
const API_BASE_URL = "http://localhost:8080/api/v1";

export const ENDPOINTS = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
  },
  members: {
    base: `${API_BASE_URL}/member`,
    // root: "/members",
    list: () => `${API_BASE_URL}/member`,
    get: (id: string | number) => `${API_BASE_URL}/member/${id}`,
    create: () => `${API_BASE_URL}/member`,
    update: (id: string | number) => `${API_BASE_URL}/member/${id}`,
    remove: (id: string | number) => `${API_BASE_URL}/member/${id}`,
  },
  logs: {
    base: `${API_BASE_URL}/logs`,
    byId: (id: string | number) => `${API_BASE_URL}/logs/${id}`,
  },
  users: {
    base: `${API_BASE_URL}/users`,
    byId: (id: string | number) => `${API_BASE_URL}/users/${id}`,
  },
  // add logs/users later here
} as const;
