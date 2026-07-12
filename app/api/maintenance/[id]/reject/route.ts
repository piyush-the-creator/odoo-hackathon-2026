// app/api/maintenance/[id]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MaintenanceService } from "@/lib/services/maintenance.service";
import { maintenanceRejectSchema } from "@/lib/validations/maintenance";
import { ZodError } from "zod";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !["ADMIN", "FLEET_MANAGER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const { id } = await params;
  try {
    const body = await request.json();
    const { rejectionReason } = maintenanceRejectSchema.parse(body);

    const requestObj = await MaintenanceService.reject(id, rejectionReason);
    return NextResponse.json(requestObj);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to reject maintenance request" }, { status: 500 });
  }
}
