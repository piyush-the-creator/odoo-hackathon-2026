// lib/services/driver.service.ts
import { prisma } from "@/lib/prisma";
import { DriverStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

export interface DriverFilters {
  search?: string;
  status?: DriverStatus;
  page?: number;
  limit?: number;
}

export class DriverService {
  static async getAll(filters: DriverFilters = {}) {
    const { search, status, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(search && {
        OR: [
          { user: { name: { contains: search, mode: "insensitive" as const } } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { licenseNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    const [drivers, total] = await Promise.all([
      prisma.driverProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              profileImage: true,
              status: true,
            },
          },
          _count: {
            select: {
              trips: true,
              fuelLogs: true,
              breakdownRequests: true,
            },
          },
        },
      }),
      prisma.driverProfile.count({ where }),
    ]);

    return {
      drivers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async getById(id: string) {
    return prisma.driverProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
            status: true,
            lastLogin: true,
            createdAt: true,
          },
        },
        trips: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            vehicle: true,
          },
        },
        fuelLogs: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
        breakdownRequests: {
          take: 5,
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  static async create(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new Error("User with this email already exists");

    const existingLicense = await prisma.driverProfile.findUnique({
      where: { licenseNumber: data.licenseNumber },
    });
    if (existingLicense) throw new Error("Driver with this license number already exists");

    const driverRole = await prisma.role.findUnique({ where: { name: "DRIVER" } });
    if (!driverRole) throw new Error("Driver role not found");

    const defaultPassword = `Driver@${Math.floor(Math.random() * 10000)}`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash: hashedPassword,
          phone: data.phone,
          roleId: driverRole.id,
          status: "ACTIVE",
        },
      });

      const driver = await tx.driverProfile.create({
        data: {
          userId: user.id,
          licenseNumber: data.licenseNumber,
          licenseCategory: data.licenseCategory,
          licenseExpiry: data.licenseExpiry,
          safetyScore: data.safetyScore ?? 100,
          experienceYears: data.experienceYears ?? 0,
          status: data.status || "AVAILABLE",
        },
        include: { user: true },
      });

      return { driver, defaultPassword };
    });
  }

  static async update(id: string, data: any) {
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: { email: data.email, driverProfile: { NOT: { id } } },
      });
      if (existingUser) throw new Error("User with this email already exists");
    }

    if (data.licenseNumber) {
      const existingLicense = await prisma.driverProfile.findFirst({
        where: { licenseNumber: data.licenseNumber, NOT: { id } },
      });
      if (existingLicense) throw new Error("Driver with this license number already exists");
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!driver) throw new Error("Driver not found");

    await prisma.user.update({
      where: { id: driver.userId },
      data: { name: data.name, email: data.email, phone: data.phone },
    });

    return prisma.driverProfile.update({
      where: { id },
      data: {
        licenseNumber: data.licenseNumber,
        licenseCategory: data.licenseCategory,
        licenseExpiry: data.licenseExpiry,
        safetyScore: data.safetyScore,
        experienceYears: data.experienceYears,
        status: data.status,
      },
      include: { user: true },
    });
  }

  static async delete(id: string) {
    const activeTrips = await prisma.trip.count({
      where: { driverId: id, status: { in: ["ASSIGNED", "DISPATCHED", "IN_PROGRESS"] } },
    });
    if (activeTrips > 0) throw new Error("Cannot delete driver with active trips");

    const driver = await prisma.driverProfile.findUnique({ where: { id }, include: { user: true } });
    if (!driver) throw new Error("Driver not found");

    await prisma.$transaction([
      prisma.driverProfile.update({ where: { id }, data: { status: "SUSPENDED" } }),
      prisma.user.update({ where: { id: driver.userId }, data: { status: "SUSPENDED" } }),
    ]);

    return { success: true };
  }

  static async updateStatus(id: string, status: DriverStatus) {
    const driver = await prisma.driverProfile.findUnique({ where: { id }, include: { user: true } });
    if (!driver) throw new Error("Driver not found");

    await prisma.user.update({
      where: { id: driver.userId },
      data: { status: status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE" },
    });

    return prisma.driverProfile.update({
      where: { id },
      data: { status },
      include: { user: true },
    });
  }

  static async getAvailableDrivers() {
    return prisma.driverProfile.findMany({
      where: { status: "AVAILABLE", licenseExpiry: { gt: new Date() } },
      select: {
        id: true,
        licenseNumber: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { user: { name: "asc" } },
    });
  }

  static async checkLicenseValidity(id: string) {
    const driver = await prisma.driverProfile.findUnique({ where: { id }, select: { licenseExpiry: true } });
    if (!driver) return false;
    return driver.licenseExpiry > new Date();
  }
}
