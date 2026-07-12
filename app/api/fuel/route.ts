// app/api/fuel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { FuelService } from "@/lib/services/fuel.service";
import { fuelSchema } from "@/lib/validations/fuel";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const tripId = searchParams.get("tripId") || undefined;
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await FuelService.getAll({
      search,
      vehicleId,
      tripId,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching fuel logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch fuel logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !["ADMIN", "FLEET_MANAGER", "DRIVER"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = fuelSchema.parse(body);

    const log = await FuelService.create(validatedData);
    return NextResponse.json(log, { status: 201 });
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
      { error: "Failed to create fuel log" },
      { status: 500 }
    );
  }
}
