// app/api/maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MaintenanceService } from "@/lib/services/maintenance.service";
import { maintenanceSchema } from "@/lib/validations/maintenance";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await MaintenanceService.getAll({
      search,
      status,
      vehicleId,
      page,
      limit,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching maintenance requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = maintenanceSchema.parse(body);

    const requestObj = await MaintenanceService.create(validatedData, session.user.id);
    return NextResponse.json(requestObj, { status: 201 });
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
      { error: "Failed to create maintenance request" },
      { status: 500 }
    );
  }
}
