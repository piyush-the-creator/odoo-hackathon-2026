// app/api/drivers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { DriverService } from "@/lib/services/driver.service";
import { driverSchema } from "@/lib/validations/driver";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await DriverService.getAll({ search, status, page, limit });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching drivers:", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.user.role || !["ADMIN", "FLEET_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validatedData = driverSchema.parse(body);
    const result = await DriverService.create(validatedData);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
