/**
 * All API endpoint paths.
 * The base URL is handled by apiClient — these are just the path part.
 */
export const ENDPOINTS = {

  members: {
    list: () => `/api/v1/members`,
    get: (memberCode: string) => `/api/v1/members/${memberCode}`,
    create: () => `/api/v1/members`,
    update: (memberCode: string) => `/api/v1/members/${memberCode}`,
    deactivate: (memberCode: string) => `/api/v1/members/${memberCode}/deactivate`,
    checkDuplicate: () => `/api/v1/members/check-duplicates`,
    search: () => `/api/v1/members/search`,
    uploadPhoto: (memberCode: string) => `/api/v1/members/${memberCode}/photo`,
  },

  families: {
    list: () => `/api/v1/families`,
    get: (familyCode: string) => `/api/v1/families/${familyCode}`,
    create: () => `/api/v1/families`,
    search: () => `/api/v1/families/search`,
    members: (familyCode: string) => `/api/v1/families/${familyCode}/members`,
  },

  users: {
    list: () => `/api/v1/users`,
    me: () => `/api/v1/users/me`,
    byId: (id: number) => `/api/v1/users/${id}`,
    approve: (id: number) => `/api/v1/users/${id}/approve`,
    reject: (id: number) => `/api/v1/users/${id}/reject`,
    updateRole: (id: number) => `/api/v1/users/${id}/role`,
    deactivate: (id: number) => `/api/v1/users/${id}/deactivate`,
    changePassword: () => `/api/v1/users/change-password`,
    resetPassword: (id: number) => `/api/v1/users/${id}/reset-password`,
  },

  importMembers: {
    upload: () => `/api/v1/import/members`,
    template: () => `/api/v1/import/template`,
  },

  logs: {
    list: () => `/logs`,
    byId: (id: string | number) => `/logs/${id}`,
  },

} as const;
