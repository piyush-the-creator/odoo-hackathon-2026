// app/api/breakdowns/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { BreakdownService } from "@/lib/services/breakdown.service";
import { breakdownSchema } from "@/lib/validations/breakdown";
import { ZodError } from "zod";
import { uploadFile } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const status = (searchParams.get("status") as any) || undefined;
  const severity = searchParams.get("severity") || undefined;
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const driverId = searchParams.get("driverId") || undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await BreakdownService.getAll({
      search,
      status,
      severity,
      vehicleId,
      driverId,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching breakdown requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch breakdown requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "DRIVER") {
    return NextResponse.json(
      { error: "Only drivers can report breakdowns" },
      { status: 403 }
    );
  }

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);
    
    let photoUrl: string | undefined;
    let videoUrl: string | undefined;
    let voiceNoteUrl: string | undefined;

    const photoFile = formData.get("photo") as File;
    if (photoFile && photoFile.size > 0) {
      photoUrl = await uploadFile(photoFile, "breakdowns/photos");
    }

    const videoFile = formData.get("video") as File;
    if (videoFile && videoFile.size > 0) {
      videoUrl = await uploadFile(videoFile, "breakdowns/videos");
    }

    const voiceFile = formData.get("voiceNote") as File;
    if (voiceFile && voiceFile.size > 0) {
      voiceNoteUrl = await uploadFile(voiceFile, "breakdowns/voice");
    }

    const driver = await prisma.driverProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    const validatedData = breakdownSchema.parse({
      tripId: data.tripId,
      vehicleId: data.vehicleId,
      driverId: driver.id,
      issueType: data.issueType,
      severity: data.severity || "MEDIUM",
      description: data.description,
      latitude: data.latitude ? parseFloat(data.latitude as string) : undefined,
      longitude: data.longitude ? parseFloat(data.longitude as string) : undefined,
    });

    const request_ = await BreakdownService.create({
      ...validatedData,
      photoUrl,
      videoUrl,
      voiceNoteUrl,
    }, session.user.id);

    return NextResponse.json(request_, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to report breakdown" },
      { status: 500 }
    );
  }
}
