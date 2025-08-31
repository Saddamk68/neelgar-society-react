// Central registry for backend endpoints (no hardcoded URLs in components/services).
export const ENDPOINTS = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
  },
  members: {
    root: "/members",
    list: () => "/members",
    get: (id: string | number) => `/members/${id}`,
    create: () => "/members",
    update: (id: string | number) => `/members/${id}`,
    remove: (id: string | number) => `/members/${id}`,
  },
  logs: {
    base: "/logs",
    byId: (id: string | number) => `/logs/${id}`,
  },
  users: {
    base: "/users",
    byId: (id: string | number) => `/users/${id}`,
  },
  // add logs/users later here
} as const;
