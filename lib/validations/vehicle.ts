// lib/validations/vehicle.ts
import { z } from "zod";

export const vehicleSchema = z.object({
  registrationNumber: z.string()
    .min(1, "Registration number is required")
    .max(20, "Registration number too long"),
  vehicleName: z.string()
    .min(1, "Vehicle name is required")
    .max(100, "Vehicle name too long"),
  vehicleType: z.enum(["TRUCK", "VAN", "MINI_TRUCK", "PICKUP", "TRAILER", "BUS", "OTHER"]),
  manufacturer: z.string()
    .min(1, "Manufacturer is required"),
  model: z.string()
    .min(1, "Model is required"),
  year: z.number()
    .min(1900, "Year must be 1900 or later")
    .max(new Date().getFullYear() + 1, "Year cannot be in the future"),
  fuelType: z.string()
    .min(1, "Fuel type is required"),
  maximumLoadCapacity: z.number()
    .min(0, "Capacity must be 0 or greater"),
  odometer: z.number()
    .min(0, "Odometer must be 0 or greater"),
  acquisitionCost: z.number()
    .min(0, "Cost must be 0 or greater"),
  purchaseDate: z.coerce.date(),
  insuranceExpiry: z.coerce.date(),
  fitnessExpiry: z.coerce.date(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).default("AVAILABLE"),
  currentLocation: z.string().optional(),
  notes: z.string().optional(),
});

export type VehicleFormValues = z.infer<typeof vehicleSchema>;
