// lib/services/vehicle.service.ts
import { prisma } from "@/lib/prisma";
import { VehicleStatus, VehicleType } from "@prisma/client";

export interface VehicleFilters {
  search?: string;
  status?: VehicleStatus;
  vehicleType?: VehicleType;
  page?: number;
  limit?: number;
}

export class VehicleService {
  static async getAll(filters: VehicleFilters = {}) {
    const { search, status, vehicleType, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where = {
      ...(status && { status }),
      ...(vehicleType && { vehicleType }),
      ...(search && {
        OR: [
          { registrationNumber: { contains: search, mode: "insensitive" as const } },
          { vehicleName: { contains: search, mode: "insensitive" as const } },
          { manufacturer: { contains: search, mode: "insensitive" as const } },
          { model: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              trips: true,
              maintenanceRequests: true,
            },
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    return {
      vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            driver: {
              include: { user: true },
            },
          },
        },
        maintenanceRequests: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        expenses: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        fuelLogs: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async create(data: any) {
    // Check for duplicate registration number
    const existing = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });

    if (existing) {
      throw new Error("Vehicle with this registration number already exists");
    }

    return prisma.vehicle.create({
      data,
    });
  }

  static async update(id: string, data: any) {
    // Check if registration number is being changed and if it's unique
    if (data.registrationNumber) {
      const existing = await prisma.vehicle.findFirst({
        where: {
          registrationNumber: data.registrationNumber,
          NOT: { id },
        },
      });

      if (existing) {
        throw new Error("Vehicle with this registration number already exists");
      }
    }

    return prisma.vehicle.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    // Soft delete - check if vehicle has active trips
    const activeTrips = await prisma.trip.count({
      where: {
        vehicleId: id,
        status: { in: ["ASSIGNED", "DISPATCHED", "IN_PROGRESS"] },
      },
    });

    if (activeTrips > 0) {
      throw new Error("Cannot delete vehicle with active trips");
    }

    return prisma.vehicle.update({
      where: { id },
      data: { status: "RETIRED" },
    });
  }

  static async getAvailableVehicles() {
    return prisma.vehicle.findMany({
      where: { status: "AVAILABLE" },
      select: {
        id: true,
        registrationNumber: true,
        vehicleName: true,
        maximumLoadCapacity: true,
      },
      orderBy: { vehicleName: "asc" },
    });
  }

  static async updateStatus(id: string, status: VehicleStatus) {
    return prisma.vehicle.update({
      where: { id },
      data: { status },
    });
  }
}
