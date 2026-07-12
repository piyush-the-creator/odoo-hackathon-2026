// app/expenses/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ExpenseForm } from "@/components/expenses/ExpenseForm";
import { ExpenseFormValues } from "@/lib/validations/expense";
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

export default function CreateExpensePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: ExpenseFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to log expense");
      }

      toast.success("Expense logged successfully!");
      router.push("/expenses");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/expenses">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Log Expense</h2>
            <p className="text-muted-foreground font-normal">Record a new operational expense for the fleet</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
            <CardDescription>
              Assign the cost to a vehicle and optionally associate it with a specific trip.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
