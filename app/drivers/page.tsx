// app/drivers/page.tsx
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Eye, Edit, MoreVertical } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface Driver {
  id: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  safetyScore: number;
  experienceYears: number;
  status: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "SUSPENDED";
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    profileImage: string | null;
  };
  _count: {
    trips: number;
    fuelLogs: number;
    breakdownRequests: number;
  };
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  ON_TRIP: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  OFF_DUTY: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  SUSPENDED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

export default function DriversPage() {
  const { data: session } = useSession();
  const canCreate = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");
  const canManageStatus = ["ADMIN", "FLEET_MANAGER", "SAFETY_OFFICER"].includes(session?.user?.role || "");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: currentPage.toString(), limit: "10" });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/drivers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch drivers");

      const data = await response.json();
      setDrivers(data.drivers);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/drivers/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      toast.success(`Driver status updated to ${statusLabels[status]}`);
      fetchDrivers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to suspend/delete this driver?")) return;
    try {
      const res = await fetch(`/api/drivers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete driver");
      }
      toast.success("Driver suspended successfully");
      fetchDrivers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete driver");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Drivers</h2>
            <p className="text-muted-foreground">Manage your drivers ({total} total)</p>
          </div>
          {canCreate && (
            <Link href="/drivers/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Register Driver
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver List</CardTitle>
            <CardDescription>Search and filter through your registered drivers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* Filters */}
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by name, email, license..."
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
                    <SelectItem value="AVAILABLE">Available</SelectItem>
                    <SelectItem value="ON_TRIP">On Trip</SelectItem>
                    <SelectItem value="OFF_DUTY">Off Duty</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Safety Score</TableHead>
                      <TableHead>Trips</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          Loading drivers…
                        </TableCell>
                      </TableRow>
                    ) : drivers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                          No drivers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      drivers.map((driver) => {
                        const isExpired = new Date(driver.licenseExpiry) < new Date();
                        return (
                          <TableRow key={driver.id}>
                            <TableCell className="font-medium">
                              <p>{driver.user.name}</p>
                              <p className="text-xs text-muted-foreground">{driver.user.email}</p>
                            </TableCell>
                            <TableCell>
                              <p className="font-mono text-sm">{driver.licenseNumber}</p>
                              <p className="text-xs text-muted-foreground">{driver.licenseCategory}</p>
                            </TableCell>
                            <TableCell>
                              <span className={isExpired ? "text-red-600 font-medium" : ""}>
                                {format(new Date(driver.licenseExpiry), "PP")}
                              </span>
                              {isExpired && (
                                <Badge variant="destructive" className="ml-2 text-xs">Expired</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  driver.safetyScore >= 80
                                    ? "border-green-500 text-green-600"
                                    : driver.safetyScore >= 60
                                    ? "border-amber-500 text-amber-600"
                                    : "border-red-500 text-red-600"
                                }
                              >
                                {driver.safetyScore}%
                              </Badge>
                            </TableCell>
                            <TableCell>{driver._count.trips}</TableCell>
                            <TableCell>
                              <Badge className={statusColors[driver.status]}>
                                {statusLabels[driver.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Link href={`/drivers/${driver.id}`}>
                                  <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                                </Link>
                                {canCreate && (
                                  <Link href={`/drivers/${driver.id}/edit`}>
                                    <Button variant="ghost" size="sm"><Edit className="h-4 w-4" /></Button>
                                  </Link>
                                )}
                                {(canCreate || canManageStatus) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger render={<Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button>} />
                                    <DropdownMenuContent align="end">
                                      {canManageStatus && (
                                        <>
                                          <DropdownMenuItem onClick={() => handleStatusChange(driver.id, "AVAILABLE")} className="text-green-600">Set Available</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(driver.id, "ON_TRIP")} className="text-blue-600">Set On Trip</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(driver.id, "OFF_DUTY")}>Set Off Duty</DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => handleStatusChange(driver.id, "SUSPENDED")} className="text-orange-600">Suspend Driver</DropdownMenuItem>
                                        </>
                                      )}
                                      {canCreate && (
                                        <DropdownMenuItem onClick={() => handleDelete(driver.id)} className="text-red-600">Delete Driver</DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
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
                        <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">
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
