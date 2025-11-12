// Domain Entity - Session
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface ActiveSession {
  userId: string;
  userName: string;
  userAvatar?: string;
  locationId?: string;
  isOnline: boolean;
  lastSeen: Date;
}