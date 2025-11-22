import { Role } from "@/constants/roles";

export type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: Role;
  createdAt?: string;
};

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  role: string;
  active: boolean;
  userImage?: string | null;
  createdAt?: string;
  updatedAt?: string;
};
