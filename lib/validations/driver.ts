// lib/validations/driver.ts
import { z } from "zod";

export const driverSchema = z.object({
  // User fields (from User model)
  name: z.string()
    .min(1, "Name is required")
    .max(100, "Name too long"),
  email: z.string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  phone: z.string()
    .min(10, "Phone number must be at least 10 digits")
    .optional(),
  
  // DriverProfile fields
  licenseNumber: z.string()
    .min(1, "License number is required")
    .max(50, "License number too long"),
  licenseCategory: z.string()
    .min(1, "License category is required"),
  licenseExpiry: z.coerce.date(),
  safetyScore: z.number()
    .min(0, "Safety score must be between 0 and 100")
    .max(100, "Safety score must be between 0 and 100")
    .default(100),
  experienceYears: z.number()
    .min(0, "Experience years must be 0 or greater")
    .default(0),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).default("AVAILABLE"),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

export const driverStatusSchema = z.object({
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]),
});

export type DriverStatusFormValues = z.infer<typeof driverStatusSchema>;
