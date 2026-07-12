// app/api/vehicles/available/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vehicles = await prisma.vehicle.findMany({
      where: {
        status: "AVAILABLE",
      },
      select: {
        id: true,
        registrationNumber: true,
        vehicleName: true,
        maximumLoadCapacity: true,
      },
      orderBy: {
        vehicleName: "asc",
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching available vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch available vehicles" },
      { status: 500 }
    );
  }
}
