// app/breakdowns/create/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BreakdownForm } from "@/components/breakdowns/BreakdownForm";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateBreakdownPage() {
  const router = useRouter();
  const { data: session } = useSession();

  if (session?.user?.role !== "DRIVER") {
    return (
      <MainLayout>
        <div className="flex min-h-[400px] items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                Only drivers can report breakdowns.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      const response = await fetch("/api/breakdowns", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to report breakdown");
      }

      toast.success("Breakdown reported successfully! A fleet manager has been notified.");
      router.push("/breakdowns");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to report breakdown");
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/breakdowns">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Report Breakdown</h2>
            <p className="text-muted-foreground">
              Report an issue during your active route assignment
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Breakdown Details</CardTitle>
            <CardDescription>
              Provide details about the incident. You can also upload photos/videos of the issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreakdownForm onSubmit={handleSubmit} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
