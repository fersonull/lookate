// MongoDB Location Model
import mongoose, { Schema, Document } from "mongoose";

export interface ILocation extends Document {
  _id: string;
  userId: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    city: string;
    country: string;
    countryCode: string;
  };
  accuracy?: number;
  timestamp: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180,
      },
    },
    address: {
      city: {
        type: String,
        required: true,
        trim: true,
      },
      country: {
        type: String,
        required: true,
        trim: true,
      },
      countryCode: {
        type: String,
        required: true,
        length: 2,
        uppercase: true,
      },
    },
    accuracy: {
      type: Number,
      required: false,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We use our own timestamp field
  }
);

// Indexes for performance
LocationSchema.index({ userId: 1 }, { unique: true }); // One location per user
LocationSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 }); // Geospatial queries
LocationSchema.index({ timestamp: -1 }); // Recent locations first
LocationSchema.index({ "address.countryCode": 1 }); // Filter by country

export const LocationModel = mongoose.models.Location || mongoose.model<ILocation>("Location", LocationSchema);