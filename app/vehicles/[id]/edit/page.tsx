// app/vehicles/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { VehicleFormValues } from "@/lib/validations/vehicle";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  
  const [vehicle, setVehicle] = useState<(VehicleFormValues & { id?: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // Check permissions
  if (!["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "")) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to edit vehicles.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    try {
      const response = await fetch(`/api/vehicles/${id}`);
      if (!response.ok) throw new Error("Failed to fetch vehicle");
      
      const data = await response.json();
      // Convert date strings to Date objects
      setVehicle({
        ...data,
        purchaseDate: new Date(data.purchaseDate),
        insuranceExpiry: new Date(data.insuranceExpiry),
        fitnessExpiry: new Date(data.fitnessExpiry),
      });
    } catch (error) {
      console.error("Error fetching vehicle:", error);
      toast.error("Failed to load vehicle details");
      router.push("/vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: VehicleFormValues) => {
    try {
      const response = await fetch(`/api/vehicles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update vehicle");
      }

      toast.success("Vehicle updated successfully!");
      router.push("/vehicles");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update vehicle");
      }
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="mt-2 h-4 w-64" />
            </div>
          </div>
          <Card className="shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (!vehicle) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle>Vehicle Not Found</CardTitle>
              <CardDescription>
                The vehicle you're trying to edit doesn't exist.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/vehicles">
            <Button variant="ghost" size="sm" className="cursor-pointer">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Edit Vehicle</h2>
            <p className="text-muted-foreground">
              Update details for {vehicle.registrationNumber}
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Vehicle Information</CardTitle>
            <CardDescription>
              Update the vehicle details. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleForm 
              initialData={vehicle} 
              onSubmit={handleSubmit} 
            />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
