// app/vehicles/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Fuel,
  DollarSign,
  Wrench,
  Route,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DriverInfo {
  user: {
    name: string;
  };
}

interface TripInfo {
  id: string;
  status: string;
  startLocation: string;
  endLocation: string;
  plannedDeparture: string;
  plannedArrival: string;
  driver?: DriverInfo | null;
}

interface MaintenanceInfo {
  id: string;
  requestType: string;
  description: string;
  cost: number;
  status: string;
  scheduledDate: string;
}

interface ExpenseInfo {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
}

interface FuelLogInfo {
  id: string;
  fuelQuantity: number;
  cost: number;
  odometerReading: number;
  date: string;
}

interface VehicleDetail {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  vehicleType: string;
  manufacturer: string;
  model: string;
  year: number;
  fuelType: string;
  maximumLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  purchaseDate: string;
  insuranceExpiry: string;
  fitnessExpiry: string;
  status: string;
  currentLocation: string | null;
  notes: string | null;
  trips: TripInfo[];
  maintenanceRequests: MaintenanceInfo[];
  expenses: ExpenseInfo[];
  fuelLogs: FuelLogInfo[];
}

const statusColors = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ON_TRIP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_SHOP: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  RETIRED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusLabels = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  IN_SHOP: "In Shop",
  RETIRED: "Retired",
};

export default function VehicleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  
  const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"trips" | "maintenance" | "expenses" | "fuel">("trips");

  const canEdit = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}`);
      if (!response.ok) throw new Error("Failed to fetch vehicle");
      
      const data = await response.json();
      setVehicle(data);
    } catch (error) {
      console.error("Error fetching vehicle details:", error);
      toast.error("Failed to load vehicle details");
      router.push("/vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete vehicle");
      }

      toast.success("Vehicle deleted successfully");
      router.push("/vehicles");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete vehicle");
      }
    }
  };

  const formatLocalDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-[400px] md:col-span-1" />
            <Skeleton className="h-[400px] md:col-span-2" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle>Vehicle Not Found</CardTitle>
              <CardDescription>
                The vehicle details you are trying to view do not exist.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/vehicles">
              <Button variant="ghost" size="sm" className="cursor-pointer">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{vehicle.vehicleName}</h2>
                <Badge className={statusColors[vehicle.status as keyof typeof statusColors] || ""}>
                  {statusLabels[vehicle.status as keyof typeof statusLabels] || vehicle.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Registration: <span className="font-semibold text-gray-800 dark:text-gray-200">{vehicle.registrationNumber}</span>
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              <Link href={`/vehicles/${id}/edit`}>
                <Button variant="outline" className="cursor-pointer">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </Link>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Vehicle
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Specifications Card */}
          <Card className="md:col-span-1 shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Specifications</CardTitle>
              <CardDescription>Details & parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.vehicleType}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Manufacturer</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.manufacturer}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Model</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.model}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.year}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fuel Type</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.fuelType}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Max Capacity</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.maximumLoadCapacity} kg</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Odometer</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">{vehicle.odometer} km</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Acquisition Cost</span>
                <span className="font-medium text-gray-855 dark:text-gray-200">${vehicle.acquisitionCost.toLocaleString()}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Location</span>
                <span className="font-medium text-gray-855 dark:text-gray-200 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-red-500" />
                  {vehicle.currentLocation || "Not set"}
                </span>
              </div>

              <div className="pt-4 space-y-3">
                <h4 className="text-xs font-semibold uppercase text-gray-500">Compliance Dates</h4>
                <div className="grid gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-muted-foreground">Purchased On</p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{formatLocalDate(vehicle.purchaseDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-muted-foreground">Insurance Expiry</p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{formatLocalDate(vehicle.insuranceExpiry)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <div>
                      <p className="text-muted-foreground">Fitness Expiry</p>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{formatLocalDate(vehicle.fitnessExpiry)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {vehicle.notes && (
                <div className="pt-2">
                  <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Notes</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg border">
                    {vehicle.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Operations Card */}
          <Card className="md:col-span-2 shadow-sm flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-gray-900 dark:text-white">Operational History</CardTitle>
              <CardDescription>Associated trips, maintenance logs, and financial items</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Custom Tabs */}
              <div className="flex border-b border-gray-200 dark:border-gray-800 mb-4 overflow-x-auto">
                <button
                  onClick={() => setActiveTab("trips")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap",
                    activeTab === "trips"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Route className="h-4 w-4" />
                  Trips ({vehicle.trips.length})
                </button>
                <button
                  onClick={() => setActiveTab("maintenance")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap",
                    activeTab === "maintenance"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Wrench className="h-4 w-4" />
                  Maintenance ({vehicle.maintenanceRequests.length})
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap",
                    activeTab === "expenses"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <DollarSign className="h-4 w-4" />
                  Expenses ({vehicle.expenses.length})
                </button>
                <button
                  onClick={() => setActiveTab("fuel")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer whitespace-nowrap",
                    activeTab === "fuel"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  )}
                >
                  <Fuel className="h-4 w-4" />
                  Fuel Logs ({vehicle.fuelLogs.length})
                </button>
              </div>

              {/* Tab contents */}
              <div className="flex-1">
                {activeTab === "trips" && (
                  <div className="overflow-x-auto">
                    {vehicle.trips.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No trips registered for this vehicle.</p>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2">Route</th>
                            <th className="py-2">Driver</th>
                            <th className="py-2">Departure</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicle.trips.map((trip) => (
                            <tr key={trip.id} className="border-b last:border-b-0">
                              <td className="py-2.5 text-gray-750 font-medium">
                                {trip.startLocation} → {trip.endLocation}
                              </td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">
                                {trip.driver?.user?.name || "Unassigned"}
                              </td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">
                                {formatLocalDate(trip.plannedDeparture)}
                              </td>
                              <td className="py-2.5">
                                <Badge variant="outline">{trip.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === "maintenance" && (
                  <div className="overflow-x-auto">
                    {vehicle.maintenanceRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No maintenance records found.</p>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2">Type</th>
                            <th className="py-2">Description</th>
                            <th className="py-2">Cost</th>
                            <th className="py-2">Date</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicle.maintenanceRequests.map((req) => (
                            <tr key={req.id} className="border-b last:border-b-0">
                              <td className="py-2.5 text-gray-750 font-medium">{req.requestType}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400 max-w-xs truncate">{req.description}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">${Number(req.cost).toLocaleString()}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">{formatLocalDate(req.scheduledDate)}</td>
                              <td className="py-2.5">
                                <Badge variant="secondary">{req.status}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === "expenses" && (
                  <div className="overflow-x-auto">
                    {vehicle.expenses.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No expense records found.</p>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2">Category</th>
                            <th className="py-2">Description</th>
                            <th className="py-2">Amount</th>
                            <th className="py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicle.expenses.map((exp) => (
                            <tr key={exp.id} className="border-b last:border-b-0">
                              <td className="py-2.5 text-gray-750 font-medium">{exp.category}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400 max-w-xs truncate">{exp.description || "N/A"}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">${Number(exp.amount).toLocaleString()}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">{formatLocalDate(exp.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {activeTab === "fuel" && (
                  <div className="overflow-x-auto">
                    {vehicle.fuelLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No fuel logs found.</p>
                    ) : (
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2">Quantity</th>
                            <th className="py-2">Cost</th>
                            <th className="py-2">Odometer</th>
                            <th className="py-2">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vehicle.fuelLogs.map((log) => (
                            <tr key={log.id} className="border-b last:border-b-0">
                              <td className="py-2.5 text-gray-750 font-medium">{Number(log.fuelQuantity)} Liters</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">${Number(log.cost).toLocaleString()}</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">{Number(log.odometerReading).toLocaleString()} km</td>
                              <td className="py-2.5 text-gray-600 dark:text-gray-400">{formatLocalDate(log.date)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
