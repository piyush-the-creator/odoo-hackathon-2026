// app/api/dashboard/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET() {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await DashboardService.getKPIs();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
