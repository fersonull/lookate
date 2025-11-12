// Domain Repository Interface - Location
import { Location, UserLocation } from "../entities/location";

export interface LocationRepository {
  findById(id: string): Promise<Location | null>;
  findByUserId(userId: string): Promise<Location | null>;
  create(locationData: Omit<Location, 'id'>): Promise<Location>;
  update(id: string, locationData: Partial<Location>): Promise<Location | null>;
  delete(id: string): Promise<boolean>;
  findActiveUserLocations(limit?: number): Promise<UserLocation[]>;
  findUserLocationsInRadius(
    centerLat: number, 
    centerLng: number, 
    radiusKm: number
  ): Promise<UserLocation[]>;
}