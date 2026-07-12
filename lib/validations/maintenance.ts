// lib/validations/maintenance.ts
import { z } from "zod";

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  maintenanceType: z.enum(["OIL_CHANGE", "ENGINE_REPAIR", "BRAKE_SERVICE", "TYRE_REPLACEMENT", "ELECTRICAL", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  description: z.string().min(1, "Description is required"),
  estimatedCost: z.number()
    .min(0, "Estimated cost must be 0 or greater")
    .optional(),
  assignedTechnician: z.string().optional(),
});

export const maintenanceApproveSchema = z.object({
  estimatedCost: z.number()
    .min(0, "Estimated cost must be 0 or greater")
    .optional(),
  assignedTechnician: z.string().min(1, "Technician name is required"),
});

export const maintenanceCompleteSchema = z.object({
  actualCost: z.number()
    .min(0, "Actual cost must be 0 or greater"),
});

export const maintenanceRejectSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;
export type MaintenanceApproveValues = z.infer<typeof maintenanceApproveSchema>;
export type MaintenanceCompleteValues = z.infer<typeof maintenanceCompleteSchema>;
export type MaintenanceRejectValues = z.infer<typeof maintenanceRejectSchema>;
