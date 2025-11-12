// Validation Schemas - Location
import { z } from "zod";

export const locationSchema = z.object({
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  address: z.object({
    city: z.string().min(1, "City is required"),
    country: z.string().min(1, "Country is required"),
    countryCode: z.string().length(2, "Country code must be 2 characters"),
  }),
  accuracy: z.number().optional(),
});

export const updateLocationSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  location: locationSchema,
});

export type LocationData = z.infer<typeof locationSchema>;
export type UpdateLocationData = z.infer<typeof updateLocationSchema>;