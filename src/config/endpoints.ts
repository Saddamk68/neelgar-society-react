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
    reactivate: (memberCode: string) => `/members/${memberCode}/reactivate`,
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
    reassignHead: (familyCode: string) => `/families/${familyCode}/head`,
    clans: () => `/families/clans`,
    reassign: () => `/families/reassign`,
  },

  users: {
    list: () => `/users`,
    me: () => `/users/me`,
    byId: (id: number) => `/users/${id}`,
    approve: (id: number) => `/users/${id}/approve`,
    reject: (id: number) => `/users/${id}/reject`,
    updateRole: (id: number) => `/users/${id}/role`,
    deactivate: (id: number) => `/users/${id}/deactivate`,
    reactivate: (id: number) => `/users/${id}/reactivate`,
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

  gotras: {
    list: () => `/gotras`,
    create: () => `/gotras`,
    update: (id: number) => `/gotras/${id}`,
    deactivate: (id: number) => `/gotras/${id}`,
  },

  relationships: {
    // GET /relationships/person/{memberCode} — full summary (father, mother, spouse, children, siblings)
    forPerson: (memberCode: string) => `/relationships/person/${memberCode}`,
    // POST /relationships/parent — link a parent
    linkParent: () => `/relationships/parent`,
    // POST /relationships/spouse — link a spouse
    linkSpouse: () => `/relationships/spouse`,
    // PATCH /relationships/{id}/end — end a relationship
    end: (id: number) => `/relationships/${id}/end`,
    // PATCH /relationships/{id}/deactivate — soft delete
    deactivate: (id: number) => `/relationships/${id}/deactivate`,
  },

} as const;
