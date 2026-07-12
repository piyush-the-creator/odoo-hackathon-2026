// app/api/drivers/available/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drivers = await prisma.driverProfile.findMany({
      where: {
        status: "AVAILABLE",
        licenseExpiry: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        licenseNumber: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(drivers);
  } catch (error) {
    console.error("Error fetching available drivers:", error);
    return NextResponse.json(
      { error: "Failed to fetch available drivers" },
      { status: 500 }
    );
  }
}
