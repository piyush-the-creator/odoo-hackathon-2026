// app/api/reports/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ReportService } from "@/lib/services/report.service";
import Papa from "papaparse";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") || "vehicle";
  const format = searchParams.get("format") || "csv";

  try {
    let data: any[] = [];
    let filename = "";

    switch (type) {
      case "vehicle":
        data = await ReportService.getVehicleReport();
        filename = "vehicle_report";
        break;
      case "driver":
        data = await ReportService.getDriverReport();
        filename = "driver_report";
        break;
      case "trip":
        data = await ReportService.getTripReport();
        filename = "trip_report";
        break;
      case "fuel":
        data = await ReportService.getFuelReport();
        filename = "fuel_report";
        break;
      case "expense":
        data = await ReportService.getExpenseReport();
        filename = "expense_report";
        break;
      case "maintenance":
        data = await ReportService.getMaintenanceReport();
        filename = "maintenance_report";
        break;
      case "fleet-utilization":
        const utilization = await ReportService.getFleetUtilization();
        data = [utilization];
        filename = "fleet_utilization";
        break;
      case "profitability":
        const profitability = await ReportService.getProfitabilityReport();
        data = [profitability];
        filename = "profitability_report";
        break;
      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    if (format === "csv") {
      const csv = Papa.unparse(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    } else if (format === "pdf") {
      const text = JSON.stringify(data, null, 2);
      return new NextResponse(text, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${filename}.json"`,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported format" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { error: "Failed to export report" },
      { status: 500 }
    );
  }
}
