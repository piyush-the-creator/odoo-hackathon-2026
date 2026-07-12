// lib/services/maintenance.service.ts
import { prisma } from "@/lib/prisma";
import { MaintenanceStatus, MaintenancePriority, MaintenanceType } from "@prisma/client";

export interface MaintenanceFilters {
  search?: string;
  status?: MaintenanceStatus;
  vehicleId?: string;
  page?: number;
  limit?: number;
}

export class MaintenanceService {
  static async getAll(filters: MaintenanceFilters = {}) {
    const { search, status, vehicleId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(vehicleId && { vehicleId }),
      ...(search && {
        OR: [
          { description: { contains: search, mode: "insensitive" as const } },
          { assignedTechnician: { contains: search, mode: "insensitive" as const } },
          { vehicle: { registrationNumber: { contains: search, mode: "insensitive" as const } } },
          { requestedBy: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
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
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.maintenanceRequest.count({ where }),
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
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        vehicle: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  static async create(data: any, requestedById: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    });
    if (!vehicle) throw new Error("Vehicle not found");

    return prisma.maintenanceRequest.create({
      data: {
        vehicleId: data.vehicleId,
        requestedById,
        maintenanceType: data.maintenanceType,
        priority: data.priority || "MEDIUM",
        description: data.description,
        estimatedCost: data.estimatedCost,
        assignedTechnician: data.assignedTechnician,
        status: "PENDING",
      },
      include: {
        vehicle: true,
      },
    });
  }

  static async approve(id: string, approvedById: string, data: { estimatedCost?: number; assignedTechnician: string }) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!request) throw new Error("Maintenance request not found");
    if (request.status !== "PENDING") {
      throw new Error("Request must be PENDING to approve");
    }

    return prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById,
          approvedAt: new Date(),
          estimatedCost: data.estimatedCost ?? request.estimatedCost,
          assignedTechnician: data.assignedTechnician,
        },
        include: { vehicle: true },
      });

      // Update vehicle status to IN_SHOP
      await tx.vehicle.update({
        where: { id: request.vehicleId },
        data: { status: "IN_SHOP" },
      });

      return updatedRequest;
    });
  }

  static async start(id: string) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!request) throw new Error("Maintenance request not found");
    if (request.status !== "APPROVED") {
      throw new Error("Request must be APPROVED to start work");
    }

    return prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: "IN_PROGRESS",
        },
      });

      await tx.vehicle.update({
        where: { id: request.vehicleId },
        data: { status: "IN_SHOP" },
      });

      return updatedRequest;
    });
  }

  static async complete(id: string, userId: string, data: { actualCost: number }) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { vehicle: true },
    });
    if (!request) throw new Error("Maintenance request not found");
    if (request.status !== "IN_PROGRESS" && request.status !== "APPROVED") {
      throw new Error("Request must be APPROVED or IN_PROGRESS to complete");
    }

    return prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id },
        data: {
          status: "COMPLETED",
          actualCost: data.actualCost,
          completedAt: new Date(),
        },
        include: { vehicle: true },
      });

      // Release vehicle back to AVAILABLE
      await tx.vehicle.update({
        where: { id: request.vehicleId },
        data: { status: "AVAILABLE" },
      });

      // Create an expense entry
      await tx.expense.create({
        data: {
          vehicleId: request.vehicleId,
          expenseType: "MAINTENANCE",
          amount: data.actualCost,
          description: `Maintenance request complete (#${id}): ${request.description}`,
          createdById: userId,
        },
      });

      return updatedRequest;
    });
  }

  static async reject(id: string, rejectionReason: string) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id },
    });
    if (!request) throw new Error("Maintenance request not found");
    if (request.status !== "PENDING") {
      throw new Error("Request must be PENDING to reject");
    }

    return prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: "REJECTED",
        assignedTechnician: `Rejected: ${rejectionReason}`,
      },
    });
  }
}
