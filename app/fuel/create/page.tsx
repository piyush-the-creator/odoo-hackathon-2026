// app/fuel/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { FuelForm } from "@/components/fuel/FuelForm";
import { FuelFormValues } from "@/lib/validations/fuel";
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

export default function CreateFuelLogPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: FuelFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to submit fuel log");
      }

      toast.success("Fuel log recorded successfully!");
      router.push("/fuel");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record log");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h2 className="text-3xl font-bold tracking-tight">Add Fuel Log</h2>
            <p className="text-muted-foreground font-normal">Record a new fuel fill for a vehicle on a trip</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Log Details</CardTitle>
            <CardDescription>
              Submit odometer readings, liters filled, and fill cost. Fuel efficiency stats will update automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
