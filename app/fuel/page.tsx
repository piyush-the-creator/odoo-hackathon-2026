// app/fuel/page.tsx
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

interface FuelLog {
  id: string;
  liters: number;
  cost: number;
  odometer: number;
  fuelStation: string | null;
  fuelDate: string;
  notes: string | null;
  trip: {
    tripNumber: string;
  } | null;
  vehicle: {
    registrationNumber: string;
    vehicleName: string;
  };
  driver: {
    user: {
      name: string;
    };
  };
}

export default function FuelPage() {
  const { data: session } = useSession();
  const canCreate = ["ADMIN", "FLEET_MANAGER", "DRIVER"].includes(session?.user?.role || "");

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);

      const response = await fetch(`/api/fuel?${params}`);
      if (!response.ok) throw new Error("Failed to fetch fuel logs");

      const data = await response.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching fuel logs:", error);
      toast.error("Failed to load fuel logs");
    } finally {
      setLoading(false);
    }
  }, [search, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Fuel Logs</h2>
            <p className="text-muted-foreground">Track fuel consumption ({total} logs)</p>
          </div>
          {canCreate && (
            <Link href="/fuel/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Fuel Log
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Logs</CardTitle>
            <CardDescription>Search and review fuel fills</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search by vehicle reg number, trip number, or fuel station..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="pl-10"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Trip</TableHead>
                      <TableHead>Liters</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Odometer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading fuel logs...
                        </TableCell>
                      </TableRow>
                    ) : logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No fuel logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="font-semibold text-sm">{log.vehicle.registrationNumber}</div>
                            <div className="text-xs text-muted-foreground">{log.vehicle.vehicleName}</div>
                          </TableCell>
                          <TableCell>{log.trip?.tripNumber || "—"}</TableCell>
                          <TableCell className="text-sm font-medium">{log.liters} L</TableCell>
                          <TableCell className="text-sm font-semibold">₹{log.cost.toLocaleString()}</TableCell>
                          <TableCell className="text-sm">{log.odometer} km</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(log.fuelDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/fuel/${log.id}`}>
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
