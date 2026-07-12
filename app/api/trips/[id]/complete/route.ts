// app/api/trips/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { TripService } from "@/lib/services/trip.service";
import { tripCompleteSchema } from "@/lib/validations/trip";
import { ZodError } from "zod";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !["ADMIN", "FLEET_MANAGER", "DRIVER"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const validatedData = tripCompleteSchema.parse(body);

    const trip = await TripService.complete(id, validatedData);

    return NextResponse.json(trip);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to complete trip" },
      { status: 500 }
    );
  }
}
