export const ENDPOINTS = {
  auth: {
    login: `/auth/login`,
    register: `/auth/register`,
  },
  members: {
    base: `/member`,
    list: () => `/member`,
    get: (id: string | number) => `/member/${id}`,
    create: () => `/member`,
    update: (id: string | number) => `/member/${id}`,
    remove: (id: string | number) => `/member/${id}`,
  },
  logs: {
    base: `/logs`,
    byId: (id: string | number) => `/logs/${id}`,
  },
  users: {
    base: `/user`,
    getAll: () => `/user/get-all-users`,
    byId: (id: string | number) => `/user/${id}`,
    update: (id: string | number) => `/user/${id}`,
    current: () => `/user`,
  },
} as const;
