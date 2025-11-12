export type UserRole = "admin" | "member";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
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
