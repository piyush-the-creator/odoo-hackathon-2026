// lib/services/breakdown.service.ts
import { prisma } from "@/lib/prisma";
import { BreakdownStatus } from "@prisma/client";

export interface BreakdownFilters {
  search?: string;
  status?: BreakdownStatus;
  severity?: string;
  vehicleId?: string;
  driverId?: string;
  page?: number;
  limit?: number;
}

export class BreakdownService {
  static async getAll(filters: BreakdownFilters = {}) {
    const { search, status, severity, vehicleId, driverId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(severity && { severity: severity as any }),
      ...(vehicleId && { vehicleId }),
      ...(driverId && { driverId }),
      ...(search && {
        OR: [
          { issueType: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
          { trip: { tripNumber: { contains: search, mode: "insensitive" as const } } },
          { vehicle: { registrationNumber: { contains: search, mode: "insensitive" as const } } },
          { driver: { user: { name: { contains: search, mode: "insensitive" as const } } } },
        ],
      }),
    };

    const [requests, total] = await Promise.all([
      prisma.breakdownRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          trip: {
            select: {
              id: true,
              tripNumber: true,
              source: true,
              destination: true,
              status: true,
            },
          },
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
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.breakdownRequest.count({ where }),
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return prisma.breakdownRequest.findUnique({
      where: { id },
      include: {
        trip: true,
        vehicle: true,
        driver: {
          include: {
            user: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async create(data: any, driverUserId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: data.tripId },
      include: {
        vehicle: true,
        driver: true,
      },
    });
    if (!trip) throw new Error("Trip not found");

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: driverUserId },
    });
    if (!driver) throw new Error("Driver profile not found");

    if (trip.driverId !== driver.id) {
      throw new Error("You are not authorized to report breakdown for this trip");
    }

    if (!["DISPATCHED", "IN_PROGRESS"].includes(trip.status)) {
      throw new Error("Breakdown can only be reported for active trips");
    }

    const existing = await prisma.breakdownRequest.findFirst({
      where: {
        tripId: data.tripId,
        status: { in: ["REPORTED", "UNDER_REVIEW"] },
      },
    });
    if (existing) throw new Error("A breakdown request already exists for this trip");

    return prisma.breakdownRequest.create({
      data: {
        tripId: data.tripId,
        vehicleId: data.vehicleId,
        driverId: driver.id,
        requestedById: driverUserId,
        issueType: data.issueType,
        severity: data.severity || "MEDIUM",
        description: data.description,
        photoUrl: data.photoUrl,
        videoUrl: data.videoUrl,
        voiceNoteUrl: data.voiceNoteUrl,
        latitude: data.latitude,
        longitude: data.longitude,
        status: "REPORTED",
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

  static async review(id: string, data: any, reviewerId: string) {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id },
      include: {
        trip: {
          include: {
            vehicle: true,
            driver: true,
          },
        },
      },
    });
    if (!request) throw new Error("Breakdown request not found");

    if (request.status !== "REPORTED" && request.status !== "UNDER_REVIEW") {
      throw new Error("Only reported or under-review requests can be reviewed");
    }

    const status = data.status as "APPROVED" | "REJECTED";

    return prisma.$transaction(async (tx) => {
      const updated = await tx.breakdownRequest.update({
        where: { id },
        data: {
          status: status,
          reviewedById: reviewerId,
          reviewRemarks: data.reviewRemarks,
          updatedAt: new Date(),
        },
        include: {
          trip: {
            include: {
              vehicle: true,
              driver: {
                include: {
                  user: true,
                },
              },
            },
          },
          vehicle: true,
          reviewedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      if (status === "APPROVED") {
        await tx.trip.update({
          where: { id: request.tripId },
          data: { status: "EMERGENCY_HALTED" },
        });

        await tx.vehicle.update({
          where: { id: request.vehicleId },
          data: { status: "IN_SHOP" },
        });

        await tx.driverProfile.update({
          where: { id: request.driverId },
          data: { status: "AVAILABLE" },
        });
      }

      return updated;
    });
  }

  static async getBreakdownStats() {
    const [reported, underReview, approved, rejected, critical] = await Promise.all([
      prisma.breakdownRequest.count({ where: { status: "REPORTED" } }),
      prisma.breakdownRequest.count({ where: { status: "UNDER_REVIEW" } }),
      prisma.breakdownRequest.count({ where: { status: "APPROVED" } }),
      prisma.breakdownRequest.count({ where: { status: "REJECTED" } }),
      prisma.breakdownRequest.count({
        where: {
          severity: "CRITICAL",
          status: { in: ["REPORTED", "UNDER_REVIEW"] },
        },
      }),
    ]);

    return {
      reported,
      underReview,
      approved,
      rejected,
      critical,
    };
  }
}
