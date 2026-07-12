// lib/services/notification.service.ts
import { prisma } from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

export class NotificationService {
  static async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = "INFO",
    actionUrl?: string
  ) {
    return prisma.notification.create({
      data: {
        recipientId: userId,
        title,
        message,
        type,
        actionUrl: actionUrl || null,
      },
    });
  }

  static async getByUser(userId: string, limit: number = 10) {
    return prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  static async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  // Event-based notifications
  static async notifyTripAssigned(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          include: { user: true },
        },
        vehicle: true,
      },
    });

    if (!trip) return;

    await this.create(
      trip.driver.userId,
      "Trip Assigned",
      `You have been assigned to trip ${trip.tripNumber} (${trip.source} → ${trip.destination})`,
      "INFO",
      `/trips/${trip.id}`
    );
  }

  static async notifyTripDispatched(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          include: { user: true },
        },
      },
    });

    if (!trip) return;

    await this.create(
      trip.driver.userId,
      "Trip Dispatched",
      `Trip ${trip.tripNumber} has been dispatched. Proceed to ${trip.destination}.`,
      "SUCCESS",
      `/trips/${trip.id}`
    );
  }

  static async notifyTripCompleted(tripId: string) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          include: { user: true },
        },
      },
    });

    if (!trip) return;

    await this.create(
      trip.createdById,
      "Trip Completed",
      `Trip ${trip.tripNumber} has been completed by ${trip.driver.user.name}`,
      "SUCCESS",
      `/trips/${trip.id}`
    );
  }

  static async notifyMaintenanceApproved(requestId: string) {
    const request = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        vehicle: true,
      },
    });

    if (!request) return;

    await this.create(
      request.requestedById,
      "Maintenance Approved",
      `Maintenance request for ${request.vehicle.registrationNumber} has been approved`,
      "SUCCESS",
      `/maintenance/${request.id}`
    );
  }

  static async notifyBreakdownReported(requestId: string) {
    const request = await prisma.breakdownRequest.findUnique({
      where: { id: requestId },
      include: {
        vehicle: true,
        driver: {
          include: { user: true },
        },
      },
    });

    if (!request) return;

    // Notify all fleet managers and admins
    const adminsAndManagers = await prisma.user.findMany({
      where: {
        role: {
          name: { in: ["ADMIN", "FLEET_MANAGER"] },
        },
      },
      select: { id: true },
    });

    for (const user of adminsAndManagers) {
      await this.create(
        user.id,
        "⚠️ Breakdown Reported",
        `${request.driver.user.name} reported a ${request.severity} issue on ${request.vehicle.registrationNumber}`,
        "ERROR",
        `/breakdowns/${request.id}`
      );
    }
  }

  static async notifyLicenseExpiring(driverId: string) {
    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
      include: { user: true },
    });

    if (!driver) return;

    const daysUntilExpiry = Math.ceil(
      (new Date(driver.licenseExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
      await this.create(
        driver.userId,
        "License Expiring Soon",
        `Your driver's license expires in ${daysUntilExpiry} days. Please renew it.`,
        "WARNING",
        `/drivers/${driver.id}`
      );
    }
  }
}
