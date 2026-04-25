/**
 * All API endpoint paths.
 * The base URL is handled by apiClient — these are just the path part.
 */
export const ENDPOINTS = {
  members: {
    list: () => `/member`,
    get: (id: string | number) => `/member/${id}`,
    create: () => `/member`,
    update: (id: string | number) => `/member/${id}`,
    remove: (id: string | number) => `/member/${id}`,
  },

  users: {
    list: () => `/users`,
    me: () => `/users/me`,
    byId: (id: number) => `/users/${id}`,
    approve: (id: number) => `/users/${id}/approve`,
    reject: (id: number) => `/users/${id}/reject`,
    updateRole: (id: number) => `/users/${id}/role`,
    deactivate: (id: number) => `/users/${id}/deactivate`,
    changePassword: () => `/users/change-password`,
    resetPassword: (id: number) => `/users/${id}/reset-password`,
  },

  logs: {
    list: () => `/logs`,
    byId: (id: string | number) => `/logs/${id}`,
  },
} as const;
