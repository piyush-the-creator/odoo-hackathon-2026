// lib/services/dashboard.service.ts
import { prisma } from "@/lib/prisma";

export class DashboardService {
  static async getKPIs() {
    const [
      totalVehicles,
      availableVehicles,
      vehiclesInShop,
      totalDrivers,
      availableDrivers,
      driversOnTrip,
      totalTrips,
      activeTrips,
      completedTrips,
      pendingTrips,
      totalFuelCost,
      totalMaintenanceCost,
      totalExpenses,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { status: "IN_SHOP" } }),
      prisma.driverProfile.count(),
      prisma.driverProfile.count({ where: { status: "AVAILABLE" } }),
      prisma.driverProfile.count({ where: { status: "ON_TRIP" } }),
      prisma.trip.count(),
      prisma.trip.count({
        where: {
          status: { in: ["ASSIGNED", "DISPATCHED", "IN_PROGRESS"] },
        },
      }),
      prisma.trip.count({ where: { status: "COMPLETED" } }),
      prisma.trip.count({ where: { status: "DRAFT" } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true } }),
      prisma.maintenanceRequest.aggregate({
        where: { status: "COMPLETED" },
        _sum: { actualCost: true },
      }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
    ]);

    const recentActivity = await this.getRecentActivity();
    const tripTrends = await this.getTripTrends();
    const fuelTrends = await this.getFuelTrends();

    const expensesByCategory = await prisma.expense.groupBy({
      by: ["expenseType"],
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    const vehicleUtilization = await this.getVehicleUtilization();

    return {
      kpis: {
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          inShop: vehiclesInShop,
          utilization: totalVehicles > 0 ? Number(((totalVehicles - availableVehicles) / totalVehicles * 100).toFixed(1)) : 0,
        },
        drivers: {
          total: totalDrivers,
          available: availableDrivers,
          onTrip: driversOnTrip,
          availability: totalDrivers > 0 ? Number((availableDrivers / totalDrivers * 100).toFixed(1)) : 0,
        },
        trips: {
          total: totalTrips,
          active: activeTrips,
          completed: completedTrips,
          pending: pendingTrips,
        },
        costs: {
          fuel: totalFuelCost._sum.cost || 0,
          maintenance: totalMaintenanceCost._sum.actualCost || 0,
          total: totalExpenses._sum.amount || 0,
        },
      },
      recentActivity,
      charts: {
        tripTrends,
        fuelTrends,
        expensesByCategory,
        vehicleUtilization,
      },
    };
  }

  static async getRecentActivity(limit: number = 5) {
    const [recentTrips, recentMaintenance, recentBreakdowns] = await Promise.all([
      prisma.trip.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: {
            select: {
              registrationNumber: true,
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
      prisma.maintenanceRequest.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: {
            select: {
              registrationNumber: true,
            },
          },
        },
      }),
      prisma.breakdownRequest.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          vehicle: {
            select: {
              registrationNumber: true,
            },
          },
          driver: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    const activities = [
      ...recentTrips.map(trip => ({
        id: trip.id,
        type: "TRIP",
        title: `Trip ${trip.tripNumber} — ${trip.status}`,
        description: `${trip.source} → ${trip.destination}`,
        timestamp: trip.createdAt,
        status: trip.status,
        vehicle: trip.vehicle.registrationNumber,
        driver: trip.driver.user.name,
      })),
      ...recentMaintenance.map(maint => ({
        id: maint.id,
        type: "MAINTENANCE",
        title: `Maintenance Request ${maint.status}`,
        description: maint.description.substring(0, 50),
        timestamp: maint.createdAt,
        status: maint.status,
        vehicle: maint.vehicle.registrationNumber,
        priority: maint.priority,
      })),
      ...recentBreakdowns.map(breakdown => ({
        id: breakdown.id,
        type: "BREAKDOWN",
        title: `Breakdown Alert ${breakdown.status}`,
        description: breakdown.description.substring(0, 50),
        timestamp: breakdown.createdAt,
        status: breakdown.status,
        vehicle: breakdown.vehicle.registrationNumber,
        severity: breakdown.severity,
      })),
    ];

    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  static async getTripTrends() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trips = await prisma.trip.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    const trends: Record<string, { date: string; total: number; completed: number; cancelled: number }> = {};

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trends[dateStr] = {
        date: dateStr,
        total: 0,
        completed: 0,
        cancelled: 0,
      };
    }

    trips.forEach(trip => {
      const dateStr = trip.createdAt.toISOString().split('T')[0];
      if (trends[dateStr]) {
        trends[dateStr].total++;
        if (trip.status === "COMPLETED") trends[dateStr].completed++;
        if (trip.status === "CANCELLED") trends[dateStr].cancelled++;
      }
    });

    return Object.values(trends).reverse();
  }

  static async getFuelTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.fuelLog.findMany({
      where: {
        fuelDate: { gte: thirtyDaysAgo },
      },
      select: {
        cost: true,
        liters: true,
        fuelDate: true,
      },
      orderBy: { fuelDate: "asc" },
    });

    const trends: Record<string, { date: string; cost: number; liters: number }> = {};

    logs.forEach(log => {
      const dateStr = log.fuelDate.toISOString().split('T')[0];
      if (!trends[dateStr]) {
        trends[dateStr] = { date: dateStr, cost: 0, liters: 0 };
      }
      trends[dateStr].cost += log.cost;
      trends[dateStr].liters += log.liters;
    });

    return Object.values(trends);
  }

  static async getVehicleUtilization() {
    const vehicles = await prisma.vehicle.findMany({
      select: {
        registrationNumber: true,
        vehicleName: true,
        status: true,
        _count: {
          select: {
            trips: {
              where: {
                status: "COMPLETED",
              },
            },
          },
        },
      },
    });

    return vehicles.map(vehicle => ({
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      status: vehicle.status,
      completedTrips: vehicle._count.trips,
    }));
  }
}
