// app/vehicles/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { VehicleFormValues } from "@/lib/validations/vehicle";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateVehiclePage() {
  const router = useRouter();
  const { data: session } = useSession();

  // Check permissions
  if (!["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "")) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md shadow-md">
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to create vehicles.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (data: VehicleFormValues) => {
    try {
      const response = await fetch("/api/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create vehicle");
      }

      toast.success("Vehicle registered successfully!");
      router.push("/vehicles");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create vehicle");
      }
    }
  };

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
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Register Vehicle</h2>
            <p className="text-muted-foreground">
              Add a new vehicle to your fleet
            </p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Vehicle Information</CardTitle>
            <CardDescription>
              Enter the vehicle details. All fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
