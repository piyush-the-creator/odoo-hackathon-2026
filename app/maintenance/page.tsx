// app/maintenance/page.tsx
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
import { Plus, Search, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface MaintenanceRequest {
  id: string;
  maintenanceType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  estimatedCost: number | null;
  actualCost: number | null;
  assignedTechnician: string | null;
  createdAt: string;
  vehicle: {
    registrationNumber: string;
    vehicleName: string;
  };
  requestedBy: {
    name: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  APPROVED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const priorityColors: Record<string, string> = {
  LOW: "border-gray-200 text-gray-700",
  MEDIUM: "border-blue-200 text-blue-700",
  HIGH: "border-orange-200 text-orange-700",
  CRITICAL: "border-red-200 text-red-700 bg-red-50",
};

const typeLabels: Record<string, string> = {
  OIL_CHANGE: "Oil Change",
  ENGINE_REPAIR: "Engine Repair",
  BRAKE_SERVICE: "Brake Service",
  TYRE_REPLACEMENT: "Tyre Replacement",
  ELECTRICAL: "Electrical",
  OTHER: "Other",
};

export default function MaintenancePage() {
  const { data: session } = useSession();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/maintenance?${params}`);
      if (!response.ok) throw new Error("Failed to fetch maintenance requests");

      const data = await response.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Failed to load maintenance requests");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Maintenance</h2>
            <p className="text-muted-foreground">Manage vehicle servicing requests ({total} total)</p>
          </div>
          <Link href="/maintenance/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Request Maintenance
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Requests Log</CardTitle>
            <CardDescription>Search and filter maintenance/repair tickets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search requests by description, vehicle, technician..."
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading requests...
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No requests found
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((req) => (
                        <TableRow key={req.id}>
                          <TableCell className="font-semibold">
                            <p>{req.vehicle.registrationNumber}</p>
                            <p className="text-xs text-muted-foreground font-normal">{req.vehicle.vehicleName}</p>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {typeLabels[req.maintenanceType] || req.maintenanceType}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priorityColors[req.priority]}>
                              {req.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {req.actualCost ? (
                              <span className="font-bold">₹{req.actualCost}</span>
                            ) : req.estimatedCost ? (
                              <span className="text-muted-foreground text-xs">Est: ₹{req.estimatedCost}</span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[req.status]}>
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{req.requestedBy.name}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(req.createdAt), "PP")}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/maintenance/${req.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
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
