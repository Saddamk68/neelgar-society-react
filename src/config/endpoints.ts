import { ENV } from "@/config/env";

export const ENDPOINTS = {
  auth: {
    login: `${ENV.API_BASE_URL}/auth/login`,
    register: `${ENV.API_BASE_URL}/auth/register`,
  },
  members: {
    base: `${ENV.API_BASE_URL}/member`,
    list: () => `${ENV.API_BASE_URL}/member`,
    get: (id: string | number) => `${ENV.API_BASE_URL}/member/${id}`,
    create: () => `${ENV.API_BASE_URL}/member`,
    update: (id: string | number) => `${ENV.API_BASE_URL}/member/${id}`,
    remove: (id: string | number) => `${ENV.API_BASE_URL}/member/${id}`,
  },
  logs: {
    base: `${ENV.API_BASE_URL}/logs`,
    byId: (id: string | number) => `${ENV.API_BASE_URL}/logs/${id}`,
  },
  users: {
    base: `${ENV.API_BASE_URL}/user`,
    getAll: () => `${ENV.API_BASE_URL}/user/get-all-users`,
    byId: (id: string | number) => `${ENV.API_BASE_URL}/user/${id}`,
    update: (id: string | number) => `${ENV.API_BASE_URL}/user/${id}`,
    current: () => `${ENV.API_BASE_URL}/user`,
  },
} as const;
