// lib/services/fuel.service.ts
import { prisma } from "@/lib/prisma";

export interface FuelFilters {
  search?: string;
  vehicleId?: string;
  tripId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export class FuelService {
  static async getAll(filters: FuelFilters = {}) {
    const { search, vehicleId, tripId, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(vehicleId && { vehicleId }),
      ...(tripId && { tripId }),
      ...(dateFrom && { fuelDate: { gte: dateFrom } }),
      ...(dateTo && { fuelDate: { lte: dateTo } }),
      ...(search && {
        OR: [
          { fuelStation: { contains: search, mode: "insensitive" as const } },
          { vehicle: { registrationNumber: { contains: search, mode: "insensitive" as const } } },
          { trip: { tripNumber: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [logs, total] = await Promise.all([
      prisma.fuelLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fuelDate: "desc" },
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
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      }),
      prisma.fuelLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return prisma.fuelLog.findUnique({
      where: { id },
      include: {
        trip: true,
        vehicle: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async create(data: any) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
    });
    if (!trip) throw new Error("Trip not found");

    if (trip.vehicleId !== data.vehicleId) {
      throw new Error("Trip does not belong to this vehicle");
    }

    if (trip.driverId !== data.driverId) {
      throw new Error("Driver is not assigned to this trip");
    }

    return prisma.fuelLog.create({
      data: {
        tripId: data.tripId,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        liters: data.liters,
        cost: data.cost,
        odometer: data.odometer,
        fuelStation: data.fuelStation,
        fuelDate: data.fuelDate || new Date(),
        notes: data.notes,
      },
      include: {
        trip: true,
        vehicle: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  static async getFuelStats() {
    const [totalLitres, totalCost, avgCost] = await prisma.$transaction([
      prisma.fuelLog.aggregate({
        _sum: { liters: true },
      }),
      prisma.fuelLog.aggregate({
        _sum: { cost: true },
      }),
      prisma.fuelLog.aggregate({
        _avg: { cost: true },
      }),
    ]);

    return {
      totalLitres: totalLitres._sum.liters || 0,
      totalCost: totalCost._sum.cost || 0,
      avgCostPerLiter: avgCost._avg.cost || 0,
    };
  }

  static async getFuelEfficiency(vehicleId: string) {
    const logs = await prisma.fuelLog.findMany({
      where: { vehicleId },
      orderBy: { fuelDate: "asc" },
      select: {
        odometer: true,
        liters: true,
        trip: {
          select: {
            plannedDistance: true,
            actualDistance: true,
          },
        },
      },
    });

    if (logs.length < 2) {
      return { efficiency: 0, message: "Need at least 2 fuel logs to calculate efficiency" };
    }

    const firstLog = logs[0];
    const lastLog = logs[logs.length - 1];
    const totalDistance = lastLog.odometer - firstLog.odometer;
    const totalLiters = logs.reduce((sum, log) => sum + log.liters, 0);

    if (totalLiters === 0) {
      return { efficiency: 0, message: "No fuel data available" };
    }

    return {
      efficiency: totalDistance / totalLiters,
      totalDistance,
      totalLiters,
      message: "Efficiency calculated successfully",
    };
  }
}
