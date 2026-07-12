// app/expenses/page.tsx
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

interface Expense {
  id: string;
  expenseType: "FUEL" | "MAINTENANCE" | "TOLL" | "PARKING" | "REPAIR" | "PENALTY" | "INSURANCE" | "OTHER";
  amount: number;
  expenseDate: string;
  description: string | null;
  trip: {
    tripNumber: string;
  } | null;
  vehicle: {
    registrationNumber: string;
    vehicleName: string;
  };
  createdBy: {
    name: string;
  };
}

const typeColors: Record<string, string> = {
  FUEL: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  MAINTENANCE: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  TOLL: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  PARKING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  REPAIR: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  PENALTY: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  INSURANCE: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  OTHER: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const typeLabels: Record<string, string> = {
  FUEL: "Fuel Fill",
  MAINTENANCE: "Maintenance Work",
  TOLL: "Toll Tax",
  PARKING: "Parking Toll",
  REPAIR: "Emergency Repair",
  PENALTY: "Traffic Penalty",
  INSURANCE: "Vehicle Insurance",
  OTHER: "Miscellaneous",
};

export default function ExpensesPage() {
  const { data: session } = useSession();
  const canCreate = ["ADMIN", "FLEET_MANAGER", "FINANCIAL_ANALYST"].includes(session?.user?.role || "");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);
      if (typeFilter !== "all") params.set("expenseType", typeFilter);

      const response = await fetch(`/api/expenses?${params}`);
      if (!response.ok) throw new Error("Failed to fetch expenses");

      const data = await response.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, currentPage]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
            <p className="text-muted-foreground font-normal">Manage and track fleet operating costs ({total} total)</p>
          </div>
          {canCreate && (
            <Link href="/expenses/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense Ledger</CardTitle>
            <CardDescription>Search and filter operational cost records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by description, vehicle reg number, or trip number..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="FUEL">Fuel</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="TOLL">Toll</SelectItem>
                    <SelectItem value="PARKING">Parking</SelectItem>
                    <SelectItem value="REPAIR">Repair</SelectItem>
                    <SelectItem value="PENALTY">Penalty</SelectItem>
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Associated Trip</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading expenses...
                        </TableCell>
                      </TableRow>
                    ) : expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No expenses logged
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell>
                            <div className="font-semibold text-sm">{expense.vehicle.registrationNumber}</div>
                            <div className="text-xs text-muted-foreground">{expense.vehicle.vehicleName}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeColors[expense.expenseType]}>
                              {typeLabels[expense.expenseType]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-bold text-red-600">
                            ₹{expense.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-sm font-mono">
                            {expense.trip?.tripNumber || <span className="text-muted-foreground text-xs">—</span>}
                          </TableCell>
                          <TableCell className="text-sm">
                            {expense.createdBy.name}
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(expense.expenseDate), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/expenses/${expense.id}`}>
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
