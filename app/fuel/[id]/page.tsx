// app/fuel/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Fuel, Calendar, Route, Truck, User, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface FuelLogDetail {
  id: string;
  liters: number;
  cost: number;
  odometer: number;
  fuelStation: string | null;
  fuelDate: string;
  notes: string | null;
  createdAt: string;
  trip: {
    tripNumber: string;
    source: string;
    destination: string;
  } | null;
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
}

export default function FuelLogDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [log, setLog] = useState<FuelLogDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch(`/api/fuel/${id}`);
      if (!res.ok) throw new Error("Fuel log not found");
      setLog(await res.json());
    } catch {
      toast.error("Failed to load fuel log details");
      router.push("/fuel");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchLog();
  }, [id, fetchLog]);

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[200px]" />
        </div>
      </MainLayout>
    );
  }

  if (!log) return null;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/fuel">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Fuel Log</h2>
            <p className="text-muted-foreground">Odometer: {log.odometer} km · Fill Date: {format(new Date(log.fuelDate), "PP")}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Fill Summary</CardTitle>
              <CardDescription>Metrics reported during refueling</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Fuel className="h-4 w-4 text-blue-500" /> Liters Filled</span>
                <span className="font-bold text-lg">{log.liters} L</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" /> Cost</span>
                <span className="font-bold text-lg">₹{log.cost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Price Per Liter</span>
                <span className="font-medium">₹{(log.cost / log.liters).toFixed(2)} / L</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuel Station</span>
                <span className="font-semibold">{log.fuelStation || "Unknown"}</span>
              </div>
              {log.notes && (
                <div className="pt-4 border-t mt-2">
                  <span className="text-xs text-muted-foreground block mb-1">Notes</span>
                  <p className="p-3 bg-muted rounded-lg text-xs leading-relaxed">{log.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resource Context</CardTitle>
              <CardDescription>Associated driver, vehicle and route</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Truck className="h-4 w-4 text-indigo-500" /> Vehicle</span>
                <span className="font-medium">{log.vehicle.registrationNumber} ({log.vehicle.vehicleName})</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><User className="h-4 w-4 text-teal-500" /> Driver</span>
                <span className="font-medium">{log.driver.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Route className="h-4 w-4 text-orange-500" /> Trip</span>
                <span className="font-medium">
                  {log.trip ? `${log.trip.tripNumber} (${log.trip.source} → ${log.trip.destination})` : "N/A"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
