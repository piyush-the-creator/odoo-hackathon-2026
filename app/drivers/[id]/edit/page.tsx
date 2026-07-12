// app/drivers/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DriverForm } from "@/components/drivers/DriverForm";
import { DriverFormValues } from "@/lib/validations/driver";
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
import { Skeleton } from "@/components/ui/skeleton";

export default function EditDriverPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();

  const [driver, setDriver] = useState<Partial<DriverFormValues> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canEdit = ["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "");

  useEffect(() => {
    if (!id) return;
    const fetchDriver = async () => {
      try {
        const res = await fetch(`/api/drivers/${id}`);
        if (!res.ok) throw new Error("Failed to fetch driver");
        const data = await res.json();
        setDriver({
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || "",
          licenseNumber: data.licenseNumber,
          licenseCategory: data.licenseCategory,
          licenseExpiry: new Date(data.licenseExpiry),
          safetyScore: data.safetyScore,
          experienceYears: data.experienceYears,
          status: data.status,
        });
      } catch {
        toast.error("Failed to load driver details");
        router.push("/drivers");
      } finally {
        setLoading(false);
      }
    };
    fetchDriver();
  }, [id, router]);

  if (!canEdit) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You don&apos;t have permission to edit drivers.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-24" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (data: DriverFormValues) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/drivers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update driver");
      }

      toast.success("Driver updated successfully!");
      router.push(`/drivers/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/drivers/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Edit Driver</h2>
            <p className="text-muted-foreground">Update driver information and license details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
            <CardDescription>All fields marked with * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            {driver && (
              <DriverForm
                initialData={driver}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                isEdit
              />
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
