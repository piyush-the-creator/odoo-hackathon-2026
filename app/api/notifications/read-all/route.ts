// app/api/notifications/read-all/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NotificationService } from "@/lib/services/notification.service";

export async function POST() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await NotificationService.markAllAsRead(session.user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking all as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
