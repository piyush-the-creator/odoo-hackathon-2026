// app/api/maintenance/[id]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MaintenanceService } from "@/lib/services/maintenance.service";

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
    const requestObj = await MaintenanceService.start(id);
    return NextResponse.json(requestObj);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to start maintenance request" }, { status: 500 });
  }
}
