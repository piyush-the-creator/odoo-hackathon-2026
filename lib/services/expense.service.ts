// lib/services/expense.service.ts
import { prisma } from "@/lib/prisma";
import { ExpenseType } from "@prisma/client";

export interface ExpenseFilters {
  search?: string;
  expenseType?: ExpenseType;
  vehicleId?: string;
  tripId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export class ExpenseService {
  static async getAll(filters: ExpenseFilters = {}) {
    const { search, expenseType, vehicleId, tripId, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(expenseType && { expenseType }),
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
      ...(dateFrom && { expenseDate: { gte: dateFrom } }),
      ...(dateTo && { expenseDate: { lte: dateTo } }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" as const } },
          { vehicle: { registrationNumber: { contains: search, mode: "insensitive" as const } } },
          { trip: { tripNumber: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: "desc" },
        include: {
          trip: {
            select: {
              id: true,
              tripNumber: true,
              source: true,
              destination: true,
            },
          },
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              vehicleName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        trip: true,
        vehicle: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async create(data: any, userId: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    if (data.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: data.tripId },
      });
      if (!trip) throw new Error("Trip not found");
      if (trip.vehicleId !== data.vehicleId) {
        throw new Error("Trip does not belong to this vehicle");
      }
    }

    return prisma.expense.create({
      data: {
        tripId: data.tripId || null,
        vehicleId: data.vehicleId,
        expenseType: data.expenseType,
        amount: data.amount,
        expenseDate: data.expenseDate || new Date(),
        description: data.description || null,
        receiptUrl: data.receiptUrl || null,
        createdById: userId,
      },
      include: {
        trip: true,
        vehicle: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async getExpenseStats() {
    const [total, byType, vehicleCosts] = await prisma.$transaction([
      prisma.expense.aggregate({
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        by: ["expenseType"],
        _sum: { amount: true },
        _count: true,
        orderBy: { expenseType: "asc" },
      }),
      prisma.expense.groupBy({
        by: ["vehicleId"],
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
    ]);

    return {
      totalExpenses: total._sum.amount || 0,
      byType,
      topVehicles: vehicleCosts,
    };
  }

  static async getVehicleExpenses(vehicleId: string, dateFrom?: Date, dateTo?: Date) {
    const where = {
      vehicleId,
      ...(dateFrom && { expenseDate: { gte: dateFrom } }),
      ...(dateTo && { expenseDate: { lte: dateTo } }),
    };

    const [total, byType] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.expense.groupBy({
        where,
        by: ["expenseType"],
        _sum: { amount: true },
        orderBy: { expenseType: "asc" },
      }),
    ]);

    return {
      total: total._sum.amount || 0,
      byType,
    };
  }
}
