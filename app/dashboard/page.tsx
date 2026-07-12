// app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Truck,
  Users,
  Route,
  DollarSign,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface DashboardData {
  kpis: {
    vehicles: {
      total: number;
      available: number;
      inShop: number;
      utilization: number;
    };
    drivers: {
      total: number;
      available: number;
      onTrip: number;
      availability: number;
    };
    trips: {
      total: number;
      active: number;
      completed: number;
      pending: number;
    };
    costs: {
      fuel: number;
      maintenance: number;
      total: number;
    };
  };
  recentActivity: any[];
  charts: {
    tripTrends: any[];
    fuelTrends: any[];
    expensesByCategory: any[];
    vehicleUtilization: any[];
  };
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ASSIGNED: "bg-purple-100 text-purple-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EMERGENCY_HALTED: "bg-orange-100 text-orange-800",
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (!mounted) {
    return null;
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-2 h-4 w-64" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!data) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>No Data Available</CardTitle>
              <CardDescription>
                Unable to load dashboard data. Please try again later.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const { kpis, recentActivity, charts } = data;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Overview</h2>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name}! Here is what is happening with the fleet today.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fleet Health</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.vehicles.total}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                <span className="text-green-600 font-semibold">{kpis.vehicles.available} available</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">{kpis.vehicles.inShop} in shop</span>
                <span>•</span>
                <span>{kpis.vehicles.utilization}% on trip</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.drivers.total}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                <span className="text-green-600 font-semibold">{kpis.drivers.available} available</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">{kpis.drivers.onTrip} on route</span>
                <span>•</span>
                <span>{kpis.drivers.availability}% ready</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpis.trips.active}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                <span>{kpis.trips.total} total</span>
                <span>•</span>
                <span className="text-green-600 font-semibold">{kpis.trips.completed} completed</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">{kpis.trips.pending} draft</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{kpis.costs.total.toLocaleString()}</div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                <span className="text-blue-600 font-semibold">Fuel: ₹{kpis.costs.fuel.toLocaleString()}</span>
                <span>•</span>
                <span className="text-amber-600 font-semibold">Maint: ₹{kpis.costs.maintenance.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Trip trends */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Trends (Last 7 Days)</CardTitle>
              <CardDescription>Daily trip volumes, cancellations, and completions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.tripTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" name="Total Assigned" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="#10B981" name="Completed" strokeWidth={2} />
                    <Line type="monotone" dataKey="cancelled" stroke="#EF4444" name="Cancelled" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Fuel cost trends */}
          <Card>
            <CardHeader>
              <CardTitle>Fuel Cost Trend (Last 30 Days)</CardTitle>
              <CardDescription>Daily fuel costs aggregated from logged refueling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts.fuelTrends} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value: any) => value ? `₹${Number(value).toLocaleString()}` : ""} />
                    <Bar dataKey="cost" fill="#3B82F6" name="Fuel Cost (₹)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Expenses by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Visual breakdown of operating cost metrics</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
              <div className="h-[260px] w-full">
                {charts.expensesByCategory.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No expense records available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.expensesByCategory}
                        dataKey="_sum.amount"
                        nameKey="expenseType"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {charts.expensesByCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => value ? `₹${Number(value).toLocaleString()}` : ""} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Vehicle utilization */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Status & Trips Completed</CardTitle>
              <CardDescription>Overview of vehicle operational loads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[260px] overflow-y-auto pr-1 space-y-2.5">
                {charts.vehicleUtilization.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-10">No vehicles recorded</p>
                ) : (
                  charts.vehicleUtilization.map((vehicle: any) => (
                    <div key={vehicle.registrationNumber} className="flex items-center justify-between border p-2.5 rounded-lg text-sm">
                      <div>
                        <div className="font-semibold">{vehicle.registrationNumber}</div>
                        <div className="text-xs text-muted-foreground">{vehicle.vehicleName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {vehicle.completedTrips} trips completed
                        </Badge>
                        <Badge className={
                          vehicle.status === "AVAILABLE" ? "bg-green-100 text-green-800" :
                          vehicle.status === "ON_TRIP" ? "bg-blue-100 text-blue-800" :
                          vehicle.status === "IN_SHOP" ? "bg-amber-100 text-amber-800" :
                          "bg-red-100 text-red-800"
                        }>
                          {vehicle.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Log</CardTitle>
            <CardDescription>Latest updates across fleet dispatches, breakdowns and maintenance requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No recent activities logged.</p>
              ) : (
                recentActivity.map((activity: any) => (
                  <div key={activity.id} className="flex items-start gap-4 border p-3.5 rounded-lg hover:bg-slate-50/50 transition">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 shrink-0">
                      {activity.type === "TRIP" && <Route className="h-4.5 w-4.5 text-blue-500" />}
                      {activity.type === "MAINTENANCE" && <Wrench className="h-4.5 w-4.5 text-amber-500" />}
                      {activity.type === "BREAKDOWN" && <AlertTriangle className="h-4.5 w-4.5 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-sm">{activity.title}</span>
                        <Badge className={statusColors[activity.status as keyof typeof statusColors] || "bg-slate-100"}>
                          {activity.status}
                        </Badge>
                        {activity.priority && <Badge variant="outline" className="text-[10px]">{activity.priority}</Badge>}
                        {activity.severity && <Badge variant="destructive" className="text-[10px]">{activity.severity}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-normal">{activity.description}</p>
                      <div className="flex gap-4 text-[10px] text-muted-foreground pt-1.5 border-t mt-1.5">
                        <span>Vehicle: <strong className="text-slate-700">{activity.vehicle}</strong></span>
                        {activity.driver && <span>Driver: <strong className="text-slate-700">{activity.driver}</strong></span>}
                        <span>{format(new Date(activity.timestamp), "MMM d, yyyy HH:mm")}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
