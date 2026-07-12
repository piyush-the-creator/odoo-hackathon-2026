// app/api/expenses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ExpenseService } from "@/lib/services/expense.service";
import { expenseSchema } from "@/lib/validations/expense";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search") || undefined;
  const expenseType = (searchParams.get("expenseType") as any) || undefined;
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const tripId = searchParams.get("tripId") || undefined;
  const dateFrom = searchParams.get("dateFrom") ? new Date(searchParams.get("dateFrom")!) : undefined;
  const dateTo = searchParams.get("dateTo") ? new Date(searchParams.get("dateTo")!) : undefined;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const result = await ExpenseService.getAll({
      search,
      expenseType,
      vehicleId,
      tripId,
      dateFrom,
      dateTo,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !["ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST"].includes(session.user.role)) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const validatedData = expenseSchema.parse(body);

    const expense = await ExpenseService.create(validatedData, session.user.id);
    return NextResponse.json(expense, { status: 201 });
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
      { error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
