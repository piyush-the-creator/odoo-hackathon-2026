// app/maintenance/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, User, Calendar, Shield, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface MaintenanceRequestDetail {
  id: string;
  vehicleId: string;
  maintenanceType: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  estimatedCost: number | null;
  actualCost: number | null;
  assignedTechnician: string | null;
  status: "PENDING" | "APPROVED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  approvedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  vehicle: {
    registrationNumber: string;
    vehicleName: string;
    status: string;
  };
  requestedBy: {
    name: string;
    email: string;
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  APPROVED: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
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
  ELECTRICAL: "Electrical Work",
  OTHER: "Other Service",
};

export default function MaintenanceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [request, setRequest] = useState<MaintenanceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Workflow processing states
  const [technician, setTechnician] = useState("");
  const [estCost, setEstCost] = useState(0);
  const [actCost, setActCost] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  const canManage = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/maintenance/${id}`);
      if (!res.ok) throw new Error("Request not found");
      const data = await res.json();
      setRequest(data);
      if (data.assignedTechnician) setTechnician(data.assignedTechnician);
      if (data.estimatedCost) setEstCost(data.estimatedCost);
    } catch {
      toast.error("Failed to load maintenance request details");
      router.push("/maintenance");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id, fetchRequest]);

  const handleAction = async (action: string, payload: any = {}) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/maintenance/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action} request`);
      }

      toast.success(`Request ${action}ed successfully`);
      fetchRequest();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Workflow update failed");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!request) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/maintenance">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">
                  {typeLabels[request.maintenanceType] || request.maintenanceType} Ticket
                </h2>
                <Badge className={statusColors[request.status]}>
                  {statusLabels[request.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">Vehicle: {request.vehicle.registrationNumber} ({request.vehicle.vehicleName})</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Description of Request</CardTitle>
                <CardDescription>Submitted by {request.requestedBy.name} on {format(new Date(request.createdAt), "PPpp")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
                <div className="flex flex-wrap gap-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Priority:</span>
                    <Badge variant="outline" className={priorityColors[request.priority]}>{request.priority}</Badge>
                  </div>
                  {request.assignedTechnician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>Assigned to: <span className="font-semibold">{request.assignedTechnician}</span></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Cost:</span>
                    <span className="font-semibold">
                      {request.estimatedCost ? `₹${request.estimatedCost}` : "Not estimated"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Cost:</span>
                    <span className="font-bold text-green-600">
                      {request.actualCost ? `₹${request.actualCost}` : "Pending complete"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Timestamps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{format(new Date(request.createdAt), "PPp")}</span>
                  </div>
                  {request.approvedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approved:</span>
                      <span>{format(new Date(request.approvedAt), "PPp")}</span>
                    </div>
                  )}
                  {request.completedAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed:</span>
                      <span>{format(new Date(request.completedAt), "PPp")}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Workflow Action Panel */}
          <div className="space-y-6">
            {canManage && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle>Workflow Actions</CardTitle>
                  <CardDescription>Process this maintenance ticket status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {request.status === "PENDING" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold block text-muted-foreground">Assigned Technician *</label>
                        <Input
                          placeholder="e.g. John's Garage or workshop"
                          value={technician}
                          onChange={(e) => setTechnician(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-semibold block text-muted-foreground">Estimated Cost (₹)</label>
                        <Input
                          type="number"
                          value={estCost}
                          onChange={(e) => setEstCost(Number(e.target.value))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction("approve", {
                            assignedTechnician: technician,
                            estimatedCost: estCost,
                          })}
                          disabled={processing || !technician}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Approve
                        </Button>
                      </div>
                      <div className="border-t pt-4 space-y-2">
                        <label className="text-xs font-semibold block text-muted-foreground">Rejection Reason *</label>
                        <Input
                          placeholder="Reason for rejection"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                        />
                        <Button
                          onClick={() => handleAction("reject", { rejectionReason: rejectReason })}
                          disabled={processing || !rejectReason}
                          variant="destructive"
                          className="w-full"
                        >
                          Reject Request
                        </Button>
                      </div>
                    </div>
                  )}

                  {request.status === "APPROVED" && (
                    <Button
                      onClick={() => handleAction("start")}
                      disabled={processing}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      Start Repair Work
                    </Button>
                  )}

                  {(request.status === "IN_PROGRESS" || request.status === "APPROVED") && (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-2">
                        <label className="text-xs font-semibold block text-muted-foreground">Actual Cost (₹) *</label>
                        <Input
                          type="number"
                          value={actCost}
                          onChange={(e) => setActCost(Number(e.target.value))}
                        />
                      </div>
                      <Button
                        onClick={() => handleAction("complete", { actualCost: actCost })}
                        disabled={processing || actCost <= 0}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Complete Repairs
                      </Button>
                    </div>
                  )}

                  {request.status === "COMPLETED" && (
                    <div className="text-center py-6 text-sm text-green-600 font-semibold bg-green-50 rounded-lg">
                      Repair finished. Logged as maintenance expense.
                    </div>
                  )}

                  {request.status === "REJECTED" && (
                    <div className="text-center py-6 text-sm text-red-600 font-semibold bg-red-50 rounded-lg">
                      Request was rejected.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {!canManage && (
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Status</CardTitle>
                </CardHeader>
                <CardContent className="text-sm py-4">
                  {request.status === "PENDING" && <p className="text-amber-600 font-medium">Awaiting manager review</p>}
                  {request.status === "APPROVED" && <p className="text-blue-600 font-medium">Approved and scheduled</p>}
                  {request.status === "IN_PROGRESS" && <p className="text-purple-600 font-medium">Work is in progress</p>}
                  {request.status === "COMPLETED" && <p className="text-green-600 font-medium">Repairs completed</p>}
                  {request.status === "REJECTED" && <p className="text-red-600 font-medium">Request rejected</p>}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
