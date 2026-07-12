// app/breakdowns/page.tsx
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface BreakdownRequest {
  id: string;
  issueType: string;
  severity: string;
  description: string;
  status: "REPORTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  photoUrl: string | null;
  videoUrl: string | null;
  voiceNoteUrl: string | null;
  createdAt: string;
  trip: {
    id: string;
    tripNumber: string;
    source: string;
    destination: string;
  };
  vehicle: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
  };
  driver: {
    user: {
      name: string;
    };
  };
  reviewedBy: {
    name: string;
  } | null;
  reviewRemarks: string | null;
}

const statusColors: Record<string, string> = {
  REPORTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REJECTED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

const statusLabels: Record<string, string> = {
  REPORTED: "Reported",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const severityColors: Record<string, string> = {
  LOW: "border-gray-200 text-gray-700",
  MEDIUM: "border-yellow-200 text-yellow-700 bg-yellow-50/50",
  CRITICAL: "border-red-200 text-red-700 bg-red-50/50",
};

export default function BreakdownsPage() {
  const { data: session } = useSession();
  const isDriver = session?.user?.role === "DRIVER";
  const canReview = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  const [requests, setRequests] = useState<BreakdownRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BreakdownRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [reviewRemarks, setReviewRemarks] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
      });
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/breakdowns?${params}`);
      if (!response.ok) throw new Error("Failed to fetch breakdown requests");

      const data = await response.json();
      setRequests(data.requests || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching breakdown requests:", error);
      toast.error("Failed to load breakdown requests");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, currentPage]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async () => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/breakdowns/${selectedRequest.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: reviewAction,
          reviewRemarks,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to review breakdown");
      }

      toast.success(`Breakdown request ${reviewAction.toLowerCase()} successfully`);
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewRemarks("");
      fetchRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to review breakdown");
    }
  };

  const openReviewDialog = (request: BreakdownRequest, action: "APPROVED" | "REJECTED") => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Breakdown Alerts</h2>
            <p className="text-muted-foreground">Manage active breakdown and repair requests ({total} total)</p>
          </div>
          {isDriver && (
            <Link href="/breakdowns/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Report Breakdown
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown Log</CardTitle>
            <CardDescription>Search and action emergency incident reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search by trip, vehicle, or issue description..."
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
                    <SelectItem value="REPORTED">Reported</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="APPROVED">Approved (Halted)</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip / Route</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Issue / Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading breakdowns...
                        </TableCell>
                      </TableRow>
                    ) : requests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No breakdowns reported
                        </TableCell>
                      </TableRow>
                    ) : (
                      requests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <div className="font-semibold text-sm">{request.trip.tripNumber}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {request.trip.source} → {request.trip.destination}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold text-sm">{request.vehicle.registrationNumber}</div>
                            <div className="text-xs text-muted-foreground">{request.vehicle.vehicleName}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{request.issueType}</div>
                            <Badge variant="outline" className={`text-[10px] mt-1 font-semibold ${severityColors[request.severity as keyof typeof severityColors]}`}>
                              {request.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[request.status]}>
                              {statusLabels[request.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{request.driver.user.name}</p>
                            <p className="text-[10px] text-muted-foreground">{format(new Date(request.createdAt), "PPp")}</p>
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <div className="flex justify-end gap-1">
                              <Link href={`/breakdowns/${request.id}`}>
                                <Button variant="ghost" size="sm" title="View details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {canReview && request.status === "REPORTED" && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openReviewDialog(request, "APPROVED")}
                                    className="text-green-600 hover:text-green-700"
                                    title="Approve breakdown and halt trip"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openReviewDialog(request, "REJECTED")}
                                    className="text-red-600 hover:text-red-700"
                                    title="Reject report"
                                  >
                                    <XCircle className="h-4 w-4" />
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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === "APPROVED" ? "Approve" : "Reject"} Breakdown Report
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <div className="space-y-1 bg-muted p-3 rounded-md text-xs mt-2">
                  <p><strong>Trip:</strong> {selectedRequest.trip.tripNumber}</p>
                  <p><strong>Vehicle:</strong> {selectedRequest.vehicle.registrationNumber}</p>
                  <p><strong>Issue Type:</strong> {selectedRequest.issueType}</p>
                  <p><strong>Severity:</strong> {selectedRequest.severity}</p>
                  <p><strong>Driver Description:</strong> {selectedRequest.description}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold block text-muted-foreground mb-1.5">Review Remarks *</label>
              <Textarea
                placeholder="Enter instructions or review feedback..."
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReview}
              disabled={!reviewRemarks.trim()}
              className={reviewAction === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              Confirm {reviewAction === "APPROVED" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
