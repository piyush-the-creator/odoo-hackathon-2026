// lib/services/report.service.ts
import { prisma } from "@/lib/prisma";

export class ReportService {
  static async getVehicleReport() {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        _count: {
          select: {
            trips: true,
            maintenanceRequests: true,
            expenses: true,
            fuelLogs: true,
          },
        },
      },
    });

    return vehicles.map(vehicle => ({
      registrationNumber: vehicle.registrationNumber,
      vehicleName: vehicle.vehicleName,
      type: vehicle.vehicleType,
      manufacturer: vehicle.manufacturer,
      model: vehicle.model,
      year: vehicle.year,
      status: vehicle.status,
      odometer: vehicle.odometer,
      totalTrips: vehicle._count.trips,
      totalMaintenance: vehicle._count.maintenanceRequests,
      totalExpenses: vehicle._count.expenses,
      totalFuelLogs: vehicle._count.fuelLogs,
    }));
  }

  static async getDriverReport() {
    const drivers = await prisma.driverProfile.findMany({
      include: {
        user: true,
        _count: {
          select: {
            trips: true,
            fuelLogs: true,
            breakdownRequests: true,
          },
        },
      },
    });

    return drivers.map(driver => ({
      name: driver.user.name,
      email: driver.user.email,
      phone: driver.user.phone || "—",
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: driver.licenseExpiry.toISOString().split("T")[0],
      safetyScore: driver.safetyScore,
      experienceYears: driver.experienceYears,
      status: driver.status,
      totalTrips: driver._count.trips,
      totalFuelLogs: driver._count.fuelLogs,
      totalBreakdowns: driver._count.breakdownRequests,
    }));
  }

  static async getTripReport() {
    const trips = await prisma.trip.findMany({
      include: {
        vehicle: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return trips.map(trip => ({
      tripNumber: trip.tripNumber,
      source: trip.source,
      destination: trip.destination,
      plannedDistance: trip.plannedDistance,
      actualDistance: trip.actualDistance || "—",
      cargoWeight: trip.cargoWeight,
      revenue: trip.revenue,
      status: trip.status,
      vehicle: trip.vehicle.registrationNumber,
      driver: trip.driver.user.name,
      departureTime: trip.departureTime ? trip.departureTime.toISOString().split("T")[0] : "—",
      arrivalTime: trip.arrivalTime ? trip.arrivalTime.toISOString().split("T")[0] : "—",
      createdAt: trip.createdAt.toISOString().split("T")[0],
    }));
  }

  static async getFuelReport() {
    const fuelLogs = await prisma.fuelLog.findMany({
      include: {
        vehicle: true,
        trip: true,
        driver: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { fuelDate: "desc" },
    });

    return fuelLogs.map(log => ({
      vehicle: log.vehicle.registrationNumber,
      tripNumber: log.trip?.tripNumber || "N/A",
      driver: log.driver.user.name,
      liters: log.liters,
      cost: log.cost,
      costPerLiter: log.liters > 0 ? (log.cost / log.liters).toFixed(2) : 0,
      odometer: log.odometer,
      fuelStation: log.fuelStation || "—",
      fuelDate: log.fuelDate.toISOString().split("T")[0],
    }));
  }

  static async getExpenseReport() {
    const expenses = await prisma.expense.findMany({
      include: {
        vehicle: true,
        trip: true,
        createdBy: true,
      },
      orderBy: { expenseDate: "desc" },
    });

    return expenses.map(expense => ({
      vehicle: expense.vehicle.registrationNumber,
      tripNumber: expense.trip?.tripNumber || "N/A",
      expenseType: expense.expenseType,
      amount: expense.amount,
      description: expense.description || "—",
      expenseDate: expense.expenseDate.toISOString().split("T")[0],
      createdBy: expense.createdBy.name,
    }));
  }

  static async getMaintenanceReport() {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        vehicle: true,
        requestedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map(request => ({
      vehicle: request.vehicle.registrationNumber,
      maintenanceType: request.maintenanceType,
      priority: request.priority,
      description: request.description,
      estimatedCost: request.estimatedCost || 0,
      actualCost: request.actualCost || 0,
      status: request.status,
      requestedBy: request.requestedBy.name,
      createdAt: request.createdAt.toISOString().split("T")[0],
      approvedAt: request.approvedAt ? request.approvedAt.toISOString().split("T")[0] : "—",
      completedAt: request.completedAt ? request.completedAt.toISOString().split("T")[0] : "—",
    }));
  }

  static async getFleetUtilization() {
    const [totalVehicles, available, onTrip, inShop, retired] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
      prisma.vehicle.count({ where: { status: "ON_TRIP" } }),
      prisma.vehicle.count({ where: { status: "IN_SHOP" } }),
      prisma.vehicle.count({ where: { status: "RETIRED" } }),
    ]);

    return {
      total: totalVehicles,
      available,
      onTrip,
      inShop,
      retired,
      utilizationRate: totalVehicles > 0 ? ((onTrip / totalVehicles) * 100).toFixed(1) : 0,
    };
  }

  static async getProfitabilityReport() {
    const [totalRevenue, totalExpenses, totalFuelCost, totalMaintenanceCost] = await Promise.all([
      prisma.trip.aggregate({ _sum: { revenue: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.fuelLog.aggregate({ _sum: { cost: true } }),
      prisma.maintenanceRequest.aggregate({
        where: { status: "COMPLETED" },
        _sum: { actualCost: true },
      }),
    ]);

    const revenue = totalRevenue._sum.revenue || 0;
    const expenses = totalExpenses._sum.amount || 0;
    const fuelCost = totalFuelCost._sum.cost || 0;
    const maintenanceCost = totalMaintenanceCost._sum.actualCost || 0;

    return {
      revenue,
      totalExpenses: expenses,
      fuelCost,
      maintenanceCost,
      otherExpenses: expenses - fuelCost - maintenanceCost,
      profit: revenue - expenses,
      profitMargin: revenue > 0 ? ((revenue - expenses) / revenue * 100).toFixed(1) : 0,
    };
  }
}
