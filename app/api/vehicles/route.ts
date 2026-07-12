// app/api/vehicles/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { VehicleService } from "@/lib/services/vehicle.service";
import { vehicleSchema } from "@/lib/validations/vehicle";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const vehicleType = (searchParams.get("vehicleType") as any) || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await VehicleService.getAll({
      search,
      status,
      vehicleType,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin and Fleet Manager can create vehicles
  if (!["ADMIN", "FLEET_MANAGER"].includes(session.user.role || "")) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = vehicleSchema.parse(body);

    const vehicle = await VehicleService.create(validatedData);

    return NextResponse.json(vehicle, { status: 201 });
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
      { error: "Failed to create vehicle" },
      { status: 500 }
    );
  }
}
