// Use Case - Update User Location
import { LocationRepository } from "@/lib/domain/repositories/location-repository";
import { UserRepository } from "@/lib/domain/repositories/user-repository";
import { UpdateLocationData } from "../schemas/location-schemas";

export class UpdateLocationUseCase {
  constructor(
    private locationRepository: LocationRepository,
    private userRepository: UserRepository
  ) {}

  async execute(data: UpdateLocationData): Promise<{ success: boolean; error?: string }> {
    // Verify user exists
    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if user already has a location
    const existingLocation = await this.locationRepository.findByUserId(data.userId);

    if (existingLocation) {
      // Update existing location
      const updatedLocation = await this.locationRepository.update(existingLocation.id, {
        coordinates: data.location.coordinates,
        address: data.location.address,
        accuracy: data.location.accuracy,
        timestamp: new Date(),
      });

      if (!updatedLocation) {
        return { success: false, error: "Failed to update location" };
      }
    } else {
      // Create new location
      await this.locationRepository.create({
        userId: data.userId,
        coordinates: data.location.coordinates,
        address: data.location.address,
        accuracy: data.location.accuracy,
        timestamp: new Date(),
      });
    }

    return { success: true };
  }
}