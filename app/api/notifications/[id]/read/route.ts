// app/api/notifications/[id]/read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { NotificationService } from "@/lib/services/notification.service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    const notification = await NotificationService.markAsRead(id);
    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
