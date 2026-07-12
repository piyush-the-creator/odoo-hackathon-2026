// lib/services/trip.service.ts
import { prisma } from "@/lib/prisma";
import { TripStatus } from "@prisma/client";

export interface TripFilters {
  search?: string;
  status?: TripStatus;
  vehicleId?: string;
  driverId?: string;
  page?: number;
  limit?: number;
}

export class TripService {
  static async getAll(filters: TripFilters = {}) {
    const { search, status, vehicleId, driverId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
      ...(search && {
        OR: [
          { tripNumber: { contains: search, mode: "insensitive" as const } },
          { source: { contains: search, mode: "insensitive" as const } },
          { destination: { contains: search, mode: "insensitive" as const } },
          { vehicle: { registrationNumber: { contains: search, mode: "insensitive" as const } } },
          { driver: { user: { name: { contains: search, mode: "insensitive" as const } } } },
        ],
      }),
    };

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              vehicleName: true,
              status: true,
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
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              fuelLogs: true,
              expenses: true,
              breakdownRequests: true,
            },
          },
        },
      }),
      prisma.trip.count({ where }),
    ]);

    return {
      trips,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: {
          include: {
            user: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        fuelLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        expenses: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        breakdownRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  }

  static async create(data: any, userId: string) {
    const tripNumber = `TRP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");
    if (vehicle.status !== "AVAILABLE") {
      throw new Error("Vehicle is not available for assignment");
    }

    const activeVehicleTrips = await prisma.trip.count({
      where: {
        vehicleId: data.vehicleId,
        status: { in: ["ASSIGNED", "DISPATCHED", "IN_PROGRESS"] },
      },
    });
    if (activeVehicleTrips > 0) {
      throw new Error("Vehicle already has an active trip");
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { id: data.driverId },
      include: { user: true },
    });
    if (!driver) throw new Error("Driver not found");
    if (driver.status !== "AVAILABLE") {
      throw new Error("Driver is not available for assignment");
    }

    if (driver.licenseExpiry < new Date()) {
      throw new Error("Driver's license has expired");
    }

    const activeDriverTrips = await prisma.trip.count({
      where: {
        driverId: data.driverId,
        status: { in: ["ASSIGNED", "DISPATCHED", "IN_PROGRESS"] },
      },
    });
    if (activeDriverTrips > 0) {
      throw new Error("Driver already has an active trip");
    }

    if (data.cargoWeight > vehicle.maximumLoadCapacity) {
      throw new Error(`Cargo weight exceeds vehicle capacity of ${vehicle.maximumLoadCapacity}kg`);
    }

    return prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: {
          tripNumber,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          source: data.source,
          destination: data.destination,
          plannedDistance: data.plannedDistance,
          cargoWeight: data.cargoWeight || 0,
          revenue: data.revenue || 0,
          departureTime: data.departureTime,
          arrivalTime: data.arrivalTime,
          remarks: data.remarks,
          createdById: userId,
          status: "DRAFT",
        },
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      });

      return trip;
    });
  }

  static async dispatch(id: string, departureTime: Date) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DRAFT" && trip.status !== "ASSIGNED") {
      throw new Error("Trip must be in DRAFT or ASSIGNED status to dispatch");
    }

    return prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: "DISPATCHED",
          departureTime,
        },
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "ON_TRIP" },
      });

      await tx.driverProfile.update({
        where: { id: trip.driverId },
        data: { status: "ON_TRIP" },
      });

      return updatedTrip;
    });
  }

  static async complete(id: string, data: any) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DISPATCHED" && trip.status !== "IN_PROGRESS") {
      throw new Error("Trip must be in DISPATCHED or IN_PROGRESS status to complete");
    }

    return prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: "COMPLETED",
          actualDistance: data.actualDistance,
          arrivalTime: data.arrivalTime,
          revenue: data.revenue,
        },
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE" },
      });

      await tx.driverProfile.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      });

      return updatedTrip;
    });
  }

  static async cancel(id: string, remarks?: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });
    if (!trip) throw new Error("Trip not found");
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
      throw new Error("Trip is already completed or cancelled");
    }

    return prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: "CANCELLED",
          remarks: remarks || "Trip cancelled",
        },
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      });

      if (trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") {
        await tx.vehicle.update({
          where: { id: trip.vehicleId },
          data: { status: "AVAILABLE" },
        });

        await tx.driverProfile.update({
          where: { id: trip.driverId },
          data: { status: "AVAILABLE" },
        });
      }

      return updatedTrip;
    });
  }

  static async emergencyHalt(id: string) {
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        driver: true,
      },
    });
    if (!trip) throw new Error("Trip not found");
    if (trip.status !== "DISPATCHED" && trip.status !== "IN_PROGRESS") {
      throw new Error("Trip must be in DISPATCHED or IN_PROGRESS status for emergency halt");
    }

    return prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          status: "EMERGENCY_HALTED",
        },
        include: {
          vehicle: true,
          driver: {
            include: {
              user: true,
            },
          },
        },
      });

      await tx.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "IN_SHOP" },
      });

      await tx.driverProfile.update({
        where: { id: trip.driverId },
        data: { status: "AVAILABLE" },
      });

      return updatedTrip;
    });
  }

  static async getTripStats() {
    const [total, active, completed, cancelled, emergency] = await Promise.all([
      prisma.trip.count(),
      prisma.trip.count({
        where: {
          status: { in: ["ASSIGNED", "DISPATCHED", "IN_PROGRESS"] },
        },
      }),
      prisma.trip.count({
        where: { status: "COMPLETED" },
      }),
      prisma.trip.count({
        where: { status: "CANCELLED" },
      }),
      prisma.trip.count({
        where: { status: "EMERGENCY_HALTED" },
      }),
    ]);

    return {
      total,
      active,
      completed,
      cancelled,
      emergency,
    };
  }
}
