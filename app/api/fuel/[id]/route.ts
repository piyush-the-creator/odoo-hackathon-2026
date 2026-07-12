// app/api/fuel/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const log = await prisma.fuelLog.findUnique({
      where: { id },
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

    if (!log) {
      return NextResponse.json(
        { error: "Fuel log not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error fetching fuel log:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel log" },
      { status: 500 }
    );
  }
}
