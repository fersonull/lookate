// Domain Entity - Location
export interface Location {
  id: string;
  userId: string;
  coordinates: [number, number] | {
    latitude: number;
    longitude: number;
  };
  address: {
    city: string;
    country: string;
    countryCode: string;
  };
  accuracy?: number; // GPS accuracy in meters
  timestamp: Date;
}

export interface UserLocation {
  userId: string;
  userName: string;
  userAvatar?: string;
  userEmail?: string;
  location: Location;
  isOnline: boolean;
  lastSeen: Date;
}