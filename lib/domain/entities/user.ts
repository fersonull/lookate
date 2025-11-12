// Domain Entity - User
export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash?: string; // Optional for OAuth users
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}