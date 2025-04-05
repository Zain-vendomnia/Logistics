export default interface IUser {
  id?: any | null;
  name?: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export enum UserRole {
  DRIVER = "driver",
  ADMIN = "admin",
  SUPER_ADMIN = "super_admin",
}

export const isSuperAdmin = (user: IUser): boolean =>
  user.role === UserRole.SUPER_ADMIN;
export const isAdmin = (user: IUser): boolean => user.role === UserRole.ADMIN;
export const isDriver = (user: IUser): boolean => user.role === UserRole.DRIVER;
