// app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { NotificationService } from "@/lib/services/notification.service";

export async function GET() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notifications = await NotificationService.getByUser(session.user.id);
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}
