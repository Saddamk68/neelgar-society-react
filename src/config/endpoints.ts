// Central registry for backend endpoints (no hardcoded URLs in components/services).
export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  members: {
    base: "/members",
    byId: (id: string | number) => `/members/${id}`,
  },
  logs: {
    base: "/logs",
    byId: (id: string | number) => `/logs/${id}`,
  },
  users: {
    base: "/users",
    byId: (id: string | number) => `/users/${id}`,
  },
} as const;
