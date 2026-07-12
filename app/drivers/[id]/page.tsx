// app/drivers/[id]/page.tsx
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Edit, Shield, Truck, Fuel, AlertTriangle, User } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface DriverDetail {
  id: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiry: string;
  safetyScore: number;
  experienceYears: number;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    lastLogin: string | null;
    createdAt: string;
  };
  trips: Array<{
    id: string;
    status: string;
    origin: string;
    destination: string;
    createdAt: string;
    vehicle: { registrationNumber: string; vehicleName: string } | null;
  }>;
  fuelLogs: Array<{
    id: string;
    liters: number;
    cost: number;
    createdAt: string;
  }>;
  breakdownRequests: Array<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

const statusColors: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  ON_TRIP: "bg-blue-100 text-blue-800",
  OFF_DUTY: "bg-gray-100 text-gray-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  OFF_DUTY: "Off Duty",
  SUSPENDED: "Suspended",
};

export default function DriverDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  const canEdit = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  const [driver, setDriver] = useState<DriverDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchDriver = async () => {
      try {
        const res = await fetch(`/api/drivers/${id}`);
        if (!res.ok) throw new Error("Driver not found");
        setDriver(await res.json());
      } catch {
        toast.error("Failed to load driver");
        router.push("/drivers");
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id, router]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!driver) return null;

  const isExpired = new Date(driver.licenseExpiry) < new Date();

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/drivers">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{driver.user.name}</h2>
              <p className="text-muted-foreground">{driver.user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[driver.status]}>
              {statusLabels[driver.status]}
            </Badge>
            {canEdit && (
              <Link href={`/drivers/${driver.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Driver
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safety Score</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${driver.safetyScore >= 80 ? "text-green-600" : driver.safetyScore >= 60 ? "text-amber-600" : "text-red-600"}`}>
                {driver.safetyScore}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Experience</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{driver.experienceYears} yrs</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{driver.trips.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Breakdowns</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{driver.breakdownRequests.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="trips">Trips</TabsTrigger>
            <TabsTrigger value="fuel">Fuel Logs</TabsTrigger>
            <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="Full Name" value={driver.user.name} />
                  <InfoRow label="Email" value={driver.user.email} />
                  <InfoRow label="Phone" value={driver.user.phone || "—"} />
                  <InfoRow label="Account Status" value={driver.user.status} />
                  <InfoRow label="Last Login" value={driver.user.lastLogin ? format(new Date(driver.user.lastLogin), "PPp") : "Never"} />
                  <InfoRow label="Joined" value={format(new Date(driver.user.createdAt), "PP")} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>License Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <InfoRow label="License Number" value={driver.licenseNumber} />
                  <InfoRow label="Category" value={driver.licenseCategory} />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">License Expiry</span>
                    <span className={`text-sm font-medium ${isExpired ? "text-red-600" : ""}`}>
                      {format(new Date(driver.licenseExpiry), "PP")}
                      {isExpired && <Badge variant="destructive" className="ml-2">Expired</Badge>}
                    </span>
                  </div>
                  <InfoRow label="Experience" value={`${driver.experienceYears} years`} />
                  <InfoRow label="Driver Status" value={statusLabels[driver.status]} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trips">
            <Card>
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
                <CardDescription>Last 5 trips assigned to this driver</CardDescription>
              </CardHeader>
              <CardContent>
                {driver.trips.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No trips recorded</p>
                ) : (
                  <div className="space-y-3">
                    {driver.trips.map((trip) => (
                      <div key={trip.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium">{trip.origin} → {trip.destination}</p>
                          <p className="text-xs text-muted-foreground">
                            {trip.vehicle?.registrationNumber} · {format(new Date(trip.createdAt), "PP")}
                          </p>
                        </div>
                        <Badge variant="outline">{trip.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fuel">
            <Card>
              <CardHeader>
                <CardTitle>Fuel Logs</CardTitle>
                <CardDescription>Last 5 fuel entries logged by this driver</CardDescription>
              </CardHeader>
              <CardContent>
                {driver.fuelLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No fuel logs recorded</p>
                ) : (
                  <div className="space-y-3">
                    {driver.fuelLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                          <Fuel className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{log.liters} L</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(log.createdAt), "PPp")}</p>
                          </div>
                        </div>
                        <p className="font-semibold">₹{log.cost.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="breakdowns">
            <Card>
              <CardHeader>
                <CardTitle>Breakdown Requests</CardTitle>
                <CardDescription>Last 5 breakdown incidents reported by this driver</CardDescription>
              </CardHeader>
              <CardContent>
                {driver.breakdownRequests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No breakdown requests recorded</p>
                ) : (
                  <div className="space-y-3">
                    {driver.breakdownRequests.map((req) => (
                      <div key={req.id} className="flex items-start justify-between rounded-lg border p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 mt-0.5 text-orange-500" />
                          <div>
                            <p className="text-sm font-medium">{req.description}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(req.createdAt), "PPp")}</p>
                          </div>
                        </div>
                        <Badge variant="outline">{req.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
