// lib/validations/expense.ts
import { z } from "zod";

export const expenseSchema = z.object({
  tripId: z.string().optional().nullable(),
  vehicleId: z.string().min(1, "Vehicle is required"),
  expenseType: z.enum(["FUEL", "MAINTENANCE", "TOLL", "PARKING", "REPAIR", "PENALTY", "INSURANCE", "OTHER"]),
  amount: z.number()
    .min(0.01, "Amount must be greater than 0")
    .positive("Amount must be positive"),
  expenseDate: z.coerce.date(),
  description: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export type ExpenseFormValues = z.infer<typeof expenseSchema>;
