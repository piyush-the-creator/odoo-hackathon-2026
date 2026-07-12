// app/api/drivers/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { DriverService } from "@/lib/services/driver.service";
import { driverStatusSchema } from "@/lib/validations/driver";
import { ZodError } from "zod";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.user.role || !["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = driverStatusSchema.parse(body);
    const driver = await DriverService.updateStatus(id, status);
    return NextResponse.json(driver);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update driver status" }, { status: 500 });
  }
}
