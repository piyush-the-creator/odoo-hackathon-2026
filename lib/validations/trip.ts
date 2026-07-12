// lib/validations/trip.ts
import { z } from "zod";

export const tripSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  plannedDistance: z.number()
    .min(0.1, "Distance must be greater than 0")
    .positive("Distance must be positive"),
  cargoWeight: z.number()
    .min(0, "Cargo weight must be 0 or greater")
    .default(0),
  revenue: z.number()
    .min(0, "Revenue must be 0 or greater")
    .default(0),
  departureTime: z.coerce.date().optional(),
  arrivalTime: z.coerce.date().optional(),
  remarks: z.string().optional(),
});

export const tripStatusSchema = z.object({
  status: z.enum(["DRAFT", "ASSIGNED", "DISPATCHED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EMERGENCY_HALTED"]),
});

export const tripDispatchSchema = z.object({
  departureTime: z.coerce.date(),
});

export const tripCompleteSchema = z.object({
  actualDistance: z.number()
    .min(0.1, "Distance must be greater than 0"),
  arrivalTime: z.coerce.date(),
  revenue: z.number()
    .min(0, "Revenue must be 0 or greater")
    .default(0),
});

export type TripFormValues = z.infer<typeof tripSchema>;
export type TripDispatchValues = z.infer<typeof tripDispatchSchema>;
export type TripCompleteValues = z.infer<typeof tripCompleteSchema>;
