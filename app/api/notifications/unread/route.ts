// app/api/notifications/unread/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const count = await NotificationService.getUnreadCount(session.user.id);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json(
      { error: "Failed to fetch unread count" },
      { status: 500 }
    );
  }
}
