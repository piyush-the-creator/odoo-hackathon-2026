// app/drivers/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

export default function CreateDriverPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!["ADMIN", "FLEET_MANAGER"].includes(session?.user?.role || "")) {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>You don&apos;t have permission to register drivers.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (data: DriverFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create driver");
      }

      const result = await response.json();
      toast.success(
        `Driver registered! Temporary password: ${result.defaultPassword}`,
        { duration: 10000 }
      );
      router.push("/drivers");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/drivers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Register Driver</h2>
            <p className="text-muted-foreground">Add a new driver to your fleet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Driver Information</CardTitle>
            <CardDescription>
              All fields marked with * are required. A temporary password will be generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DriverForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
