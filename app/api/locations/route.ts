// Locations API Route
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth.config";
import { UpdateLocationUseCase } from "@/lib/application/use-cases/update-location";
import { MongooseLocationRepository } from "@/lib/infrastructure/database/repository/mongoose-location-repository";
import { MongooseUserRepository } from "@/lib/infrastructure/database/repository/mongoose-user-repository";
import { updateLocationSchema } from "@/lib/application/schemas/location-schemas";

const locationRepository = new MongooseLocationRepository();
const userRepository = new MongooseUserRepository();
const updateLocationUseCase = new UpdateLocationUseCase(locationRepository, userRepository);

// GET - Fetch active user locations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');

    let userLocations;

    if (lat && lng && radius) {
      // Get users within radius
      userLocations = await locationRepository.findUserLocationsInRadius(
        parseFloat(lat),
        parseFloat(lng),
        parseFloat(radius)
      );
    } else {
      // Get all active users
      userLocations = await locationRepository.findActiveUserLocations(limit);
    }

    return NextResponse.json({
      success: true,
      data: userLocations,
    });

  } catch (error) {
    console.error("Get locations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Update user location
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id || session.user.email;
    const body = await request.json();
    
    // Add user ID from session
    const locationData = {
      ...body,
      userId: userId,
    };

    // Validate input
    const validatedFields = updateLocationSchema.safeParse(locationData);
    if (!validatedFields.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validatedFields.error.format() },
        { status: 400 }
      );
    }

    // Execute update location use case
    const result = await updateLocationUseCase.execute(validatedFields.data);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update location" },
        { status: 400 }
      );
    }

    // Also update user's last active time
    await userRepository.update(userId, {
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
    });

  } catch (error) {
    console.error("Update location error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}