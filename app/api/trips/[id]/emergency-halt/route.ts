// app/api/trips/[id]/emergency-halt/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TripService } from "@/lib/services/trip.service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "DRIVER") {
    return NextResponse.json(
      { error: "Only drivers can initiate emergency halt" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const trip = await TripService.emergencyHalt(id);

    return NextResponse.json(trip);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to initiate emergency halt" },
      { status: 500 }
    );
  }
}
