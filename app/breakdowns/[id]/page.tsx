// app/breakdowns/[id]/page.tsx
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
import { ArrowLeft, Check, X, AlertTriangle, Shield, User, MapPin } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface BreakdownRequestDetail {
  id: string;
  issueType: string;
  severity: "LOW" | "MEDIUM" | "CRITICAL";
  description: string;
  photoUrl: string | null;
  videoUrl: string | null;
  voiceNoteUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  status: "REPORTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  reviewRemarks: string | null;
  createdAt: string;
  trip: {
    tripNumber: string;
    source: string;
    destination: string;
    status: string;
  };
  vehicle: {
    registrationNumber: string;
    vehicleName: string;
  };
  driver: {
    user: {
      name: string;
      email: string;
    };
  };
  reviewedBy: {
    name: string;
    email: string;
  } | null;
}

const statusColors: Record<string, string> = {
  REPORTED: "bg-red-100 text-red-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  REPORTED: "Reported",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved (Emergency Halted)",
  REJECTED: "Rejected",
};

const severityColors: Record<string, string> = {
  LOW: "border-gray-200 text-gray-700",
  MEDIUM: "border-yellow-200 text-yellow-700 bg-yellow-50/50",
  CRITICAL: "border-red-200 text-red-700 bg-red-50/50",
};

export default function BreakdownDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();

  const [request, setRequest] = useState<BreakdownRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [processing, setProcessing] = useState(false);

  const canReview = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  const fetchRequest = useCallback(async () => {
    try {
      const res = await fetch(`/api/breakdowns/${id}`);
      if (!res.ok) throw new Error("Incident request not found");
      setRequest(await res.json());
    } catch {
      toast.error("Failed to load breakdown request details");
      router.push("/breakdowns");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchRequest();
  }, [id, fetchRequest]);

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    if (!remarks.trim()) {
      toast.error("Review remarks are required to submit review");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/breakdowns/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewRemarks: remarks }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit review");
      }

      toast.success(`Request ${status.toLowerCase()} successfully`);
      fetchRequest();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Review submission failed");
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
            <Link href="/breakdowns">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-bold tracking-tight">{request.issueType} Incident Report</h2>
                <Badge className={statusColors[request.status]}>
                  {statusLabels[request.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">Vehicle: {request.vehicle.registrationNumber} · Trip: {request.trip.tripNumber}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Description card */}
            <Card>
              <CardHeader>
                <CardTitle>Incident Description</CardTitle>
                <CardDescription>Reported by {request.driver.user.name} on {format(new Date(request.createdAt), "PPpp")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{request.description}</p>
                <div className="flex flex-wrap gap-4 pt-4 border-t text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span>Severity:</span>
                    <Badge variant="outline" className={severityColors[request.severity]}>{request.severity}</Badge>
                  </div>
                  {(request.latitude || request.longitude) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>GPS: <span className="font-mono text-xs">{request.latitude?.toFixed(4)}, {request.longitude?.toFixed(4)}</span></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Media Uploads */}
            {(request.photoUrl || request.videoUrl || request.voiceNoteUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Attachments & Media Logs</CardTitle>
                  <CardDescription>Visual and audio telemetry reported from the field</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {request.photoUrl && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">Photo attachment</h4>
                      {/* Standard image link with placeholder/fallback support */}
                      <div className="max-w-md overflow-hidden rounded-md border">
                        <img
                          src={request.photoUrl}
                          alt="Breakdown attachment"
                          className="w-full h-auto object-cover max-h-[300px]"
                          onError={(e) => {
                            // If mock url or failed local load, show fallback text
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                        <p className="p-2 text-xs font-mono text-muted-foreground bg-muted truncate">
                          URL: <a href={request.photoUrl} target="_blank" rel="noreferrer" className="underline">{request.photoUrl}</a>
                        </p>
                      </div>
                    </div>
                  )}

                  {request.videoUrl && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">Video attachment</h4>
                      <video src={request.videoUrl} controls className="max-w-md w-full rounded-md border" />
                    </div>
                  )}

                  {request.voiceNoteUrl && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground">Voice note</h4>
                      <audio src={request.voiceNoteUrl} controls className="w-full max-w-md" />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Review / Status details */}
          <div className="space-y-6">
            {canReview && request.status === "REPORTED" && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle>Review Report</CardTitle>
                  <CardDescription>Resolve this incident ticket. Approval halts the trip and puts the vehicle IN_SHOP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold block text-muted-foreground">Review Remarks *</label>
                    <Textarea
                      placeholder="Enter repair dispatch details or cancellation remarks..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReview("APPROVED")}
                      disabled={processing || !remarks.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleReview("REJECTED")}
                      disabled={processing || !remarks.trim()}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past Review detail */}
            {request.status !== "REPORTED" && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reviewed by:</span>
                    <span className="font-semibold">{request.reviewedBy?.name || "System"}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground block mb-1">Remarks</span>
                    <p className="bg-muted p-3 rounded-lg text-xs leading-relaxed">{request.reviewRemarks || "—"}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
