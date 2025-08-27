export type UserRole = "admin" | "member";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
};
