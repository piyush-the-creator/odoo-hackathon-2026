// lib/validations/fuel.ts
import { z } from "zod";

export const fuelSchema = z.object({
  tripId: z.string().min(1, "Trip is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  liters: z.number()
    .min(0.1, "Liters must be greater than 0")
    .positive("Liters must be positive"),
  cost: z.number()
    .min(0.01, "Cost must be greater than 0")
    .positive("Cost must be positive"),
  odometer: z.number()
    .min(0, "Odometer must be 0 or greater"),
  fuelStation: z.string().optional(),
  fuelDate: z.coerce.date(),
  notes: z.string().optional(),
});

export type FuelFormValues = z.infer<typeof fuelSchema>;
