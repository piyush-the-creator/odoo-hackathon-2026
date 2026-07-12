// app/vehicles/page.tsx
"use client";

import { useState, useEffect } from "react";
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
import { Plus, Search, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { VehicleStatus, VehicleType } from "@prisma/client";

interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  vehicleType: VehicleType;
  manufacturer: string;
  model: string;
  year: number;
  status: VehicleStatus;
  _count: {
    trips: number;
    maintenanceRequests: number;
  };
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

export default function VehiclesPage() {
  const { data: session } = useSession();
  const canCreate = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");
  
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchVehicles();
  }, [search, statusFilter, typeFilter, currentPage]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(search && { search }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { vehicleType: typeFilter }),
      });

      const response = await fetch(`/api/vehicles?${params}`);
      if (!response.ok) throw new Error("Failed to fetch vehicles");
      
      const data = await response.json();
      setVehicles(data.vehicles || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
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
      fetchVehicles();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete vehicle");
      }
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Vehicles</h2>
            <p className="text-muted-foreground">
              Manage your fleet vehicles ({total} total)
            </p>
          </div>
          {canCreate && (
            <Link href="/vehicles/create">
              <Button className="cursor-pointer">
                <Plus className="mr-2 h-4 w-4" />
                Register Vehicle
              </Button>
            </Link>
          )}
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Fleet List</CardTitle>
            <CardDescription>
              Search and filter through your registered vehicles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by registration, name, manufacturer..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "all"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="ON_TRIP">On Trip</SelectItem>
                    <SelectItem value="IN_SHOP">In Shop</SelectItem>
                    <SelectItem value="RETIRED">Retired</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val || "all"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="MINI_TRUCK">Mini Truck</SelectItem>
                    <SelectItem value="PICKUP">Pickup</SelectItem>
                    <SelectItem value="TRAILER">Trailer</SelectItem>
                    <SelectItem value="BUS">Bus</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading vehicles...
                        </TableCell>
                      </TableRow>
                    ) : vehicles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No vehicles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-semibold text-gray-900 dark:text-white">
                            {vehicle.registrationNumber}
                          </TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{vehicle.vehicleName}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">{vehicle.vehicleType}</TableCell>
                          <TableCell className="text-gray-700 dark:text-gray-300">
                            {vehicle.manufacturer} {vehicle.model}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[vehicle.status] || ""}>
                              {statusLabels[vehicle.status] || vehicle.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Link href={`/vehicles/${vehicle.id}`}>
                                <Button variant="ghost" size="sm" className="cursor-pointer">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canCreate && (
                                <>
                                  <Link href={`/vehicles/${vehicle.id}/edit`}>
                                    <Button variant="ghost" size="sm" className="cursor-pointer">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(vehicle.id)}
                                    className="text-red-600 hover:text-red-700 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
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
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
