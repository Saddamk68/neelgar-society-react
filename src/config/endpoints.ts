/**
 * All API endpoint paths.
 * The base URL is handled by apiClient — these are just the path part.
 */
export const ENDPOINTS = {

  dashboard: {
    stats: () => `/dashboard/stats`,
  },

  members: {
    list: () => `/members`,
    get: (memberCode: string) => `/members/${memberCode}`,
    create: () => `/members`,
    update: (memberCode: string) => `/members/${memberCode}`,
    deactivate: (memberCode: string) => `/members/${memberCode}/deactivate`,
    checkDuplicate: () => `/members/check-duplicates`,
    search: () => `/members/search`,
    uploadPhoto: (memberCode: string) => `/members/${memberCode}/photo`,
    deletePhoto: (memberCode: string) => `/members/${memberCode}/photo`,
    photoThumb: (memberCode: string) => `/members/${memberCode}/photo/thumb`,
  },

  families: {
    list: () => `/families`,
    get: (familyCode: string) => `/families/${familyCode}`,
    create: () => `/families`,
    search: () => `/families/search`,
    members: (familyCode: string) => `/families/${familyCode}/members`,
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

  importMembers: {
    upload: () => `/import/members`,
    template: () => `/import/template`,
  },

  logs: {
    list: () => `/logs`,
    byId: (id: string | number) => `/logs/${id}`,
  },

} as const;
