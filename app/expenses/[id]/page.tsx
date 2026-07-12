// app/expenses/[id]/page.tsx
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, DollarSign, Calendar, Route, Truck, User, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExpenseDetail {
  id: string;
  expenseType: "FUEL" | "MAINTENANCE" | "TOLL" | "PARKING" | "REPAIR" | "PENALTY" | "INSURANCE" | "OTHER";
  amount: number;
  expenseDate: string;
  description: string | null;
  receiptUrl: string | null;
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
  createdBy: {
    name: string;
    email: string;
  };
}

const typeColors: Record<string, string> = {
  FUEL: "bg-blue-100 text-blue-800",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  TOLL: "bg-purple-100 text-purple-800",
  PARKING: "bg-indigo-100 text-indigo-800",
  REPAIR: "bg-orange-100 text-orange-800",
  PENALTY: "bg-red-100 text-red-800",
  INSURANCE: "bg-teal-100 text-teal-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const typeLabels: Record<string, string> = {
  FUEL: "Fuel",
  MAINTENANCE: "Maintenance",
  TOLL: "Toll Tax",
  PARKING: "Parking",
  REPAIR: "Repair Work",
  PENALTY: "Penalty / Fine",
  INSURANCE: "Insurance Premium",
  OTHER: "Other",
};

export default function ExpenseDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpense = useCallback(async () => {
    try {
      const res = await fetch(`/api/expenses/${id}`);
      if (!res.ok) throw new Error("Expense record not found");
      setExpense(await res.json());
    } catch {
      toast.error("Failed to load expense details");
      router.push("/expenses");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    if (id) fetchExpense();
  }, [id, fetchExpense]);

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

  if (!expense) return null;

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
            <h2 className="text-3xl font-bold tracking-tight">Expense Receipt</h2>
            <p className="text-muted-foreground">Logged: {format(new Date(expense.createdAt), "PPp")}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Summary</CardTitle>
              <CardDescription>Ledger categorization and cost</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><DollarSign className="h-4 w-4 text-green-500" /> Amount Paid</span>
                <span className="font-bold text-xl text-red-600">₹{expense.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Category</span>
                <Badge className={typeColors[expense.expenseType]}>
                  {typeLabels[expense.expenseType]}
                </Badge>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Calendar className="h-4 w-4 text-blue-500" /> Transaction Date</span>
                <span className="font-medium">{format(new Date(expense.expenseDate), "PPP")}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Recorded By</span>
                <span className="font-medium">{expense.createdBy.name} ({expense.createdBy.email})</span>
              </div>
              {expense.receiptUrl && (
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground flex items-center gap-2"><FileText className="h-4 w-4 text-amber-500" /> Attachment</span>
                  <a href={expense.receiptUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium truncate max-w-[200px]">
                    View Invoice Doc
                  </a>
                </div>
              )}
              {expense.description && (
                <div className="pt-2">
                  <span className="text-xs text-muted-foreground block mb-1">Description</span>
                  <p className="p-3 bg-muted rounded-lg text-xs leading-relaxed">{expense.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fleet Allocation</CardTitle>
              <CardDescription>Targeted asset details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground flex items-center gap-2"><Truck className="h-4 w-4 text-indigo-500" /> Vehicle</span>
                <span className="font-semibold">{expense.vehicle.registrationNumber} ({expense.vehicle.vehicleName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-2"><Route className="h-4 w-4 text-orange-500" /> Trip Context</span>
                <span className="font-medium">
                  {expense.trip ? `${expense.trip.tripNumber} (${expense.trip.source} → ${expense.trip.destination})` : "General fleet expense"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
