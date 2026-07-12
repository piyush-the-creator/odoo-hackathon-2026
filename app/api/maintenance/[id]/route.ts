// app/api/maintenance/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { MaintenanceService } from "@/lib/services/maintenance.service";

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
    const requestObj = await MaintenanceService.getById(id);
    if (!requestObj) {
      return NextResponse.json({ error: "Maintenance request not found" }, { status: 404 });
    }
    return NextResponse.json(requestObj);
  } catch (error) {
    console.error("Error fetching maintenance request:", error);
    return NextResponse.json(
      { error: "Failed to fetch maintenance request" },
      { status: 500 }
    );
  }
}
