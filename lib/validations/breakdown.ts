// lib/validations/breakdown.ts
import { z } from "zod";

export const breakdownSchema = z.object({
  tripId: z.string().min(1, "Trip is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  issueType: z.string().min(1, "Issue type is required"),
  severity: z.enum(["LOW", "MEDIUM", "CRITICAL"]).default("MEDIUM"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description too long"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const breakdownReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewRemarks: z.string()
    .min(1, "Review remarks are required")
    .max(500, "Remarks too long"),
});

export type BreakdownFormValues = z.infer<typeof breakdownSchema>;
export type BreakdownReviewValues = z.infer<typeof breakdownReviewSchema>;
