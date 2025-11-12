// MongoDB Location Repository Implementation
import { LocationRepository } from "@/lib/domain/repositories/location-repository";
import { Location, UserLocation } from "@/lib/domain/entities/location";
import { LocationModel, ILocation } from "../models/location-model";
import { UserModel } from "../models/user-model";
import { connectToDatabase } from "../mongodb";

export class MongooseLocationRepository implements LocationRepository {
  async findById(id: string): Promise<Location | null> {
    await connectToDatabase();
    const location = await LocationModel.findById(id);
    return location ? this.mapToEntity(location) : null;
  }

  async findByUserId(userId: string): Promise<Location | null> {
    await connectToDatabase();
    const location = await LocationModel.findOne({ userId });
    return location ? this.mapToEntity(location) : null;
  }

  async create(locationData: Omit<Location, 'id'>): Promise<Location> {
    await connectToDatabase();
    const location = new LocationModel(locationData);
    const savedLocation = await location.save();
    return this.mapToEntity(savedLocation);
  }

  async update(id: string, locationData: Partial<Location>): Promise<Location | null> {
    await connectToDatabase();
    const updatedLocation = await LocationModel.findByIdAndUpdate(
      id,
      locationData,
      { new: true }
    );
    return updatedLocation ? this.mapToEntity(updatedLocation) : null;
  }

  async delete(id: string): Promise<boolean> {
    await connectToDatabase();
    const result = await LocationModel.findByIdAndDelete(id);
    return !!result;
  }

  async findActiveUserLocations(limit: number = 100): Promise<UserLocation[]> {
    await connectToDatabase();
    
    // Find locations with users who have been active in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    try {
      // First, let's check what locations exist
      const allLocations = await LocationModel.find().limit(10);
      console.log('Total locations in DB:', await LocationModel.countDocuments());
      console.log('Sample locations:', allLocations.map(l => ({ userId: l.userId, timestamp: l.timestamp })));

      const locations = await LocationModel.aggregate([
        {
          $addFields: {
            userObjectId: { $toObjectId: '$userId' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userObjectId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: {
            path: '$user',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $match: {
            user: { $exists: true },
            $or: [
              { 'user.updatedAt': { $gte: thirtyMinutesAgo } },
              { 'timestamp': { $gte: thirtyMinutesAgo } }
            ]
          }
        },
        {
          $sort: { timestamp: -1 }
        },
        {
          $limit: limit
        }
      ]);

      console.log('Found active user locations:', locations.length);
      console.log('Sample location data:', locations[0] ? {
        userId: locations[0].userId,
        hasUser: !!locations[0].user,
        userName: locations[0].user?.name,
        coordinates: locations[0].coordinates,
        rawCoordinates: JSON.stringify(locations[0].coordinates)
      } : 'No locations');
      
      const mapped = locations.map(this.mapToUserLocation.bind(this));
      console.log('Mapped to UserLocation objects:', mapped.length);
      return mapped;
    } catch (error) {
      console.error('Error in findActiveUserLocations:', error);
      return [];
    }
  }

  async findUserLocationsInRadius(
    centerLat: number,
    centerLng: number,
    radiusKm: number
  ): Promise<UserLocation[]> {
    await connectToDatabase();
    
    // Convert radius from kilometers to radians (Earth's radius ≈ 6371 km)
    const radiusInRadians = radiusKm / 6371;
    
    const locations = await LocationModel.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [centerLng, centerLat]
          },
          distanceField: "distance",
          maxDistance: radiusKm * 1000, // Convert to meters
          spherical: true
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $sort: { distance: 1 }
      }
    ]);

    return locations.map(this.mapToUserLocation);
  }

  private mapToEntity(doc: ILocation): Location {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      coordinates: doc.coordinates,
      address: doc.address,
      accuracy: doc.accuracy,
      timestamp: doc.timestamp,
    };
  }

  private mapToUserLocation(doc: any): UserLocation {
    // Consider online if location was updated in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const lastActivity = doc.user.updatedAt || doc.timestamp;
    const isOnline = new Date(lastActivity) > thirtyMinutesAgo;

    return {
      userId: doc.user._id.toString(),
      userName: doc.user.name,
      userAvatar: doc.user.avatar,
      userEmail: doc.user.email,
      location: {
        id: doc._id.toString(),
        userId: doc.user._id.toString(),
        coordinates: doc.coordinates,
        address: doc.address,
        accuracy: doc.accuracy,
        timestamp: doc.timestamp,
      },
      isOnline,
      lastSeen: new Date(lastActivity),
    };
  }
}