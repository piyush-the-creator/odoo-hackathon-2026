// app/api/breakdowns/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BreakdownService } from "@/lib/services/breakdown.service";

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
    const request_ = await BreakdownService.getById(id);

    if (!request_) {
      return NextResponse.json(
        { error: "Breakdown request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(request_);
  } catch (error) {
    console.error("Error fetching breakdown request:", error);
    return NextResponse.json(
      { error: "Failed to fetch breakdown request" },
      { status: 500 }
    );
  }
}
