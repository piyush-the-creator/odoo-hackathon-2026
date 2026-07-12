// app/reports/page.tsx
"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Download,
  FileSpreadsheet,
  File,
  TrendingUp,
  Truck,
  Users,
  Route,
  Fuel,
  DollarSign,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("vehicle");
  const [formatType, setFormatType] = useState("csv");

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/export?type=${reportType}&format=${formatType}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to export report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportType}_report.${formatType === "csv" ? "csv" : "json"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Report exported successfully as ${formatType.toUpperCase()}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export report");
    } finally {
      setLoading(false);
    }
  };

  const reportOptions = [
    { value: "vehicle", label: "Vehicle Report", icon: Truck },
    { value: "driver", label: "Driver Report", icon: Users },
    { value: "trip", label: "Trip Report", icon: Route },
    { value: "fuel", label: "Fuel Report", icon: Fuel },
    { value: "expense", label: "Expense Report", icon: DollarSign },
    { value: "maintenance", label: "Maintenance Report", icon: Wrench },
    { value: "fleet-utilization", label: "Fleet Utilization", icon: TrendingUp },
    { value: "profitability", label: "Profitability Report", icon: TrendingUp },
  ];

  const getCurrentIcon = () => {
    const option = reportOptions.find(r => r.value === reportType);
    const Icon = option?.icon || FileText;
    return <Icon className="h-8 w-8 text-blue-600" />;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground font-normal">
            Generate and export operational sheets
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="saved">Saved Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export Report</CardTitle>
                <CardDescription>
                  Select a report type and format to export
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <Select value={reportType} onValueChange={(val) => setReportType(val || "vehicle")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {reportOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Format</label>
                    <Select value={formatType} onValueChange={(val) => setFormatType(val || "csv")}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="csv">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>CSV</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4" />
                            <span>PDF (JSON Dump)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleExport}
                      disabled={loading}
                      className="w-full cursor-pointer"
                    >
                      {loading ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Export {formatType.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-center rounded-lg border-2 border-dashed p-8">
                  <div className="text-center">
                    <div className="flex justify-center">{getCurrentIcon()}</div>
                    <h3 className="mt-2 text-lg font-semibold">
                      {reportOptions.find(r => r.value === reportType)?.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Download data in {formatType.toUpperCase()} format
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <Card>
              <CardHeader>
                <CardTitle>Saved Reports</CardTitle>
                <CardDescription>
                  Previously generated reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 opacity-50" />
                  <p className="mt-2 font-medium">No saved reports yet</p>
                  <p className="text-sm">Export a report to save it here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
