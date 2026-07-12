// app/trips/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Search, Eye, Play, Check, X, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface Trip {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  plannedDistance: number;
  cargoWeight: number;
  revenue: number;
  status: "DRAFT" | "ASSIGNED" | "DISPATCHED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "EMERGENCY_HALTED";
  departureTime: string | null;
  createdAt: string;
  vehicle: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
  };
  driver: {
    id: string;
    user: {
      name: string;
    };
  };
  createdBy: {
    name: string;
  };
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  ASSIGNED: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  DISPATCHED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  EMERGENCY_HALTED: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
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

export default function TripsPage() {
  const { data: session } = useSession();
  const canCreate = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/trips?${params}`);
      if (!response.ok) throw new Error("Failed to fetch trips");

      const data = await response.json();
      setTrips(data.trips);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  const handleAction = async (id: string, action: string, data?: any) => {
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

      toast.success(`Trip updated successfully`);
      fetchTrips();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to update trip`);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Trips</h2>
            <p className="text-muted-foreground">Manage your trips ({total} total)</p>
          </div>
          {canCreate && (
            <Link href="/trips/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Trip
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip List</CardTitle>
            <CardDescription>Search and filter through your trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by trip number, source, destination..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="DISPATCHED">Dispatched</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="EMERGENCY_HALTED">Emergency Halted</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip #</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading trips...
                        </TableCell>
                      </TableRow>
                    ) : trips.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No trips found
                        </TableCell>
                      </TableRow>
                    ) : (
                      trips.map((trip) => (
                        <TableRow key={trip.id}>
                          <TableCell className="font-mono text-sm font-semibold">
                            {trip.tripNumber}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">
                              <span>{trip.source}</span>
                              <span className="text-muted-foreground"> → </span>
                              <span>{trip.destination}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {trip.plannedDistance} km
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{trip.vehicle.registrationNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              {trip.vehicle.vehicleName}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{trip.driver.user.name}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[trip.status]}>
                              {statusLabels[trip.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1.5">
                              <Link href={`/trips/${trip.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {trip.status === "DRAFT" && canCreate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAction(trip.id, "dispatch", {
                                    departureTime: new Date().toISOString()
                                  })}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Dispatch Trip"
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {(trip.status === "DISPATCHED" || trip.status === "IN_PROGRESS") && (
                                <>
                                  {session?.user?.role === "DRIVER" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleAction(trip.id, "emergency-halt")}
                                      className="text-orange-600 hover:text-orange-700"
                                      title="Emergency Halt"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {(session?.user?.role === "ADMIN" || session?.user?.role === "FLEET_MANAGER") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const actualDistance = prompt("Enter actual distance (km):");
                                        if (actualDistance) {
                                          handleAction(trip.id, "complete", {
                                            actualDistance: parseFloat(actualDistance),
                                            arrivalTime: new Date().toISOString(),
                                            revenue: trip.revenue,
                                          });
                                        }
                                      }}
                                      className="text-green-600 hover:text-green-700"
                                      title="Complete Trip"
                                    >
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                              {(trip.status === "DRAFT" || trip.status === "ASSIGNED") && canCreate && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const remarks = prompt("Cancellation reason:");
                                    if (remarks !== null) {
                                      handleAction(trip.id, "cancel", { remarks });
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700"
                                  title="Cancel Trip"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
