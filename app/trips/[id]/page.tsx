// app/trips/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Play, Check, X, AlertTriangle, Route, Truck, User, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface TripDetail {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  plannedDistance: number;
  actualDistance: number | null;
  cargoWeight: number;
  revenue: number;
  status: "DRAFT" | "ASSIGNED" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EMERGENCY_HALTED";
  remarks: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
    vehicleType: string;
    maximumLoadCapacity: number;
  };
  driver: {
    id: string;
    licenseNumber: string;
    licenseCategory: string;
    user: {
      name: string;
      email: string;
      phone: string | null;
    };
  };
  createdBy: {
    name: string;
    email: string;
  };
  fuelLogs: Array<{
    id: string;
    liters: number;
    cost: number;
    createdAt: string;
  }>;
  expenses: Array<{
    id: string;
    amount: number;
    category: string;
    description: string | null;
    createdAt: string;
  }>;
  breakdownRequests: Array<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800",
  ASSIGNED: "bg-purple-100 text-purple-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  EMERGENCY_HALTED: "bg-orange-100 text-orange-800",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Draft",
  ASSIGNED: "Assigned",
  DISPATCHED: "Dispatched",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  EMERGENCY_HALTED: "Emergency Halted",
};

export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const canManage = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  const fetchTrip = useCallback(async () => {
    try {
      const res = await fetch(`/api/trips/${id}`);
      if (!res.ok) throw new Error("Trip not found");
      setTrip(await res.json());
    } catch {
      toast.error("Failed to load trip details");
      router.push("/trips");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchTrip();
  }, [id, fetchTrip]);

  const handleAction = async (action: string, data?: any) => {
    try {
      const response = await fetch(`/api/trips/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${action} trip`);
      }

      toast.success(`Action successful`);
      fetchTrip();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!trip) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trips">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{trip.tripNumber}</h2>
                <Badge className={statusColors[trip.status]}>
                  {statusLabels[trip.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">{trip.source} to {trip.destination}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {trip.status === "DRAFT" && canManage && (
              <Button
                onClick={() => handleAction("dispatch", { departureTime: new Date().toISOString() })}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="mr-2 h-4 w-4" />
                Dispatch
              </Button>
            )}
            {(trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") && (
              <>
                {session?.user?.role === "DRIVER" && (
                  <Button
                    onClick={() => handleAction("emergency-halt")}
                    variant="destructive"
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Emergency Halt
                  </Button>
                )}
                {canManage && (
                  <Button
                    onClick={() => {
                      const actualDistance = prompt("Enter actual distance (km):");
                      if (actualDistance) {
                        handleAction("complete", {
                          actualDistance: parseFloat(actualDistance),
                          arrivalTime: new Date().toISOString(),
                          revenue: trip.revenue,
                        });
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark Completed
                  </Button>
                )}
              </>
            )}
            {(trip.status === "DRAFT" || trip.status === "ASSIGNED") && canManage && (
              <Button
                onClick={() => {
                  const remarks = prompt("Cancellation reason:");
                  if (remarks !== null) {
                    handleAction("cancel", { remarks });
                  }
                }}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel Trip
              </Button>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Planned Distance</CardTitle>
              <Route className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{trip.plannedDistance} km</p>
              {trip.actualDistance && (
                <p className="text-xs text-muted-foreground mt-1">
                  Actual: {trip.actualDistance} km
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cargo Weight</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{trip.cargoWeight} kg</p>
              <p className="text-xs text-muted-foreground mt-1">
                Max load: {trip.vehicle.maximumLoadCapacity} kg
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estimated Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{trip.revenue.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Driver</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-lg font-bold truncate">{trip.driver.user.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                License: {trip.driver.licenseNumber}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Info */}
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Route & Dispatch Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium">{trip.source}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Destination</span>
                    <span className="font-medium">{trip.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispatched At</span>
                    <span className="font-medium">
                      {trip.departureTime ? format(new Date(trip.departureTime), "PPp") : "Not Dispatched"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Arrived At</span>
                    <span className="font-medium">
                      {trip.arrivalTime ? format(new Date(trip.arrivalTime), "PPp") : "In Transit / Halted"}
                    </span>
                  </div>
                  {trip.remarks && (
                    <div className="pt-2 border-t mt-2">
                      <span className="text-xs text-muted-foreground block mb-1">Remarks</span>
                      <p className="text-sm">{trip.remarks}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assigned Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold mb-2">Vehicle details</h4>
                    <div className="space-y-1.5 pl-2 border-l-2 border-blue-500">
                      <p>{trip.vehicle.vehicleName} ({trip.vehicle.vehicleType})</p>
                      <p className="font-mono text-xs text-muted-foreground">{trip.vehicle.registrationNumber}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Driver profile</h4>
                    <div className="space-y-1.5 pl-2 border-l-2 border-green-500">
                      <p>{trip.driver.user.name}</p>
                      <p className="text-xs text-muted-foreground">{trip.driver.user.email}</p>
                      {trip.driver.user.phone && <p className="text-xs text-muted-foreground">{trip.driver.user.phone}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fuel">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Logs</CardTitle>
                <CardDescription>Logs reported during this trip</CardDescription>
              </CardHeader>
              <CardContent>
                {trip.fuelLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No fuel logs found for this trip.</p>
                ) : (
                  <div className="space-y-3">
                    {trip.fuelLogs.map((log) => (
                      <div key={log.id} className="flex justify-between border p-3 rounded-lg">
                        <div>
                          <p className="font-semibold">{log.liters} Liters</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "PP")}</p>
                        </div>
                        <p className="font-bold">₹{log.cost}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>Expenses logged for this trip (tolls, parking, repairs, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                {trip.expenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No expenses found for this trip.</p>
                ) : (
                  <div className="space-y-3">
                    {trip.expenses.map((expense) => (
                      <div key={expense.id} className="flex justify-between border p-3 rounded-lg">
                        <div>
                          <p className="font-semibold">{expense.category}</p>
                          {expense.description && <p className="text-xs text-muted-foreground">{expense.description}</p>}
                          <p className="text-[10px] text-muted-foreground">{format(new Date(expense.createdAt), "PP")}</p>
                        </div>
                        <p className="font-bold">₹{expense.amount}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdowns">
            <Card>
              <CardHeader>
                <CardTitle>Breakdown Requests</CardTitle>
                <CardDescription>Breakdown alerts and repairs requested during this route</CardDescription>
              </CardHeader>
              <CardContent>
                {trip.breakdownRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-6">No breakdown incidents reported.</p>
                ) : (
                  <div className="space-y-3">
                    {trip.breakdownRequests.map((req) => (
                      <div key={req.id} className="flex justify-between items-center border p-3 rounded-lg">
                        <div>
                          <p className="font-semibold">{req.description}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(req.createdAt), "PPp")}</p>
                        </div>
                        <Badge variant={req.status === "RESOLVED" ? "default" : "destructive"}>
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
