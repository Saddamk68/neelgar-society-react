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
    birthOrder: (memberCode: string) => `/members/${memberCode}/birth-order`,
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
    listByActiveStatus: (isActive: boolean) => `/users/by-active-status/${isActive}`,
    me: () => `/users/me`,
    byId: (id: number) => `/users/${id}`,
    approve: (id: number) => `/users/${id}/approve`,
    reject: (id: number) => `/users/${id}/reject`,
    updateRole: (id: number) => `/users/${id}/role`,
    deactivate: (id: number) => `/users/${id}/deactivate`,
    reactivate: (id: number) => `/users/${id}/reactivate`,
    changePassword: () => `/users/change-password`,
    resetPassword: (id: number) => `/users/${id}/reset-password`,
    provision: () => `/users/provision`,
    unlock: (username: string) => `/users/${username}/unlock`,
    lookupByMemberCode: (memberCode: string) => `/users/lookup/by-member-code/${memberCode}`,
  },

  roles: {
    list: () => `/roles`,
    allPermissions: () => `/roles/permissions`,
    userPermissions: (userId: number) => `/roles/users/${userId}/permissions`,
    updateUserPermissions: (userId: number) => `/roles/users/${userId}/permissions`,
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

  geoUnits: {
    byLevel: () => `/geo-units`,
    children: (parentId: number) => `/geo-units/${parentId}/children`,
    create: () => `/geo-units`,
    deactivate: (id: number) => `/geo-units/${id}`,
    reactivate: (id: number) => `/geo-units/${id}/reactivate`,
    ancestors: (id: number) => `/geo-units/${id}/ancestors`,
  },

  geoImport: {
    run: (dryRun: boolean) => `/admin/geo-import/run?dryRun=${dryRun}`,
    status: (jobId: number) => `/admin/geo-import/status/${jobId}`,
    cancel: (jobId: number) => `/admin/geo-import/cancel/${jobId}`,
  },

  backups: {
    list: "/admin/backups",
    trigger: "/admin/backups/trigger",
  },

  localAuthority: {
    byGeoUnit: (geoUnitId: number) => `/local-authority/geo-unit/${geoUnitId}`,
    lookupPerson: (memberCode: string) => `/local-authority/lookup-person/${memberCode}`,
    assign: () => `/local-authority`,
    revoke: (scopeId: number) => `/local-authority/${scopeId}`,
    myLeadership: () => `/local-authority/my-leadership`,
  },

  events: {
    list: () => `/events`,
    create: () => `/events`,
    update: (id: number) => `/events/${id}`,
    publish: (id: number) => `/events/${id}/publish`,
    cancel: (id: number) => `/events/${id}/cancel`,
    delete: (id: number) => `/events/${id}`,
  },

  memberApplications: {
    list: () => `/member-applications`,
    counts: () => `/member-applications/counts`,
    get: (id: number) => `/member-applications/${id}`,
    approve: (id: number) => `/member-applications/${id}/approve`,
    reject: (id: number) => `/member-applications/${id}/reject`,
    needsInfo: (id: number) => `/member-applications/${id}/needs-info`,
    markMobileVerified: (id: number) => `/member-applications/${id}/mark-mobile-verified`,
  },

  mailAccounts: {
    list: () => `/admin/mail-accounts`,
    create: () => `/admin/mail-accounts`,
    update: (id: number) => `/admin/mail-accounts/${id}`,
  },

  emailTemplates: {
    list: () => `/admin/email-templates`,
    create: () => `/admin/email-templates`,
    update: (id: number) => `/admin/email-templates/${id}`,
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
