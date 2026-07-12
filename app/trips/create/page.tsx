// app/trips/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { TripForm } from "@/components/trips/TripForm";
import { TripFormValues } from "@/lib/validations/trip";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateTripPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreate = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  if (!canCreate) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You don&apos;t have permission to create trips.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (data: TripFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create trip");
      }

      toast.success("Trip created successfully!");
      router.push("/trips");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create trip");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/trips">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Create Trip</h2>
            <p className="text-muted-foreground">Plan and assign a new transit route</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Trip Specifications</CardTitle>
            <CardDescription>
              Assign an available vehicle and driver. Load capacity and license validity rules will be validated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TripForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
