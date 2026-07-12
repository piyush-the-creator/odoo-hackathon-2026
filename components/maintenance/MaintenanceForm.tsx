// components/maintenance/MaintenanceForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MaintenanceFormValues, maintenanceSchema } from "@/lib/validations/maintenance";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface MaintenanceFormProps {
  onSubmit: (data: MaintenanceFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

interface VehicleOption {
  id: string;
  registrationNumber: string;
  vehicleName: string;
}

export function MaintenanceForm({ onSubmit, isSubmitting = false }: MaintenanceFormProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: {
      vehicleId: "",
      maintenanceType: "OIL_CHANGE",
      priority: "MEDIUM",
      description: "",
      estimatedCost: 0,
      assignedTechnician: "",
    },
  });

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles?limit=100");
        if (res.ok) {
          const data = await res.json();
          setVehicles(data.vehicles || []);
        } else {
          toast.error("Failed to load vehicle list");
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
        toast.error("Error loading vehicle list");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const onFormSubmit = async (values: MaintenanceFormValues) => {
    await onSubmit(values);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading vehicle options...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        No vehicles found
                      </SelectItem>
                    ) : (
                      vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.registrationNumber} - {v.vehicleName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maintenanceType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maintenance Type *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="OIL_CHANGE">Oil Change</SelectItem>
                    <SelectItem value="ENGINE_REPAIR">Engine Repair</SelectItem>
                    <SelectItem value="BRAKE_SERVICE">Brake Service</SelectItem>
                    <SelectItem value="TYRE_REPLACEMENT">Tyre Replacement</SelectItem>
                    <SelectItem value="ELECTRICAL">Electrical Work</SelectItem>
                    <SelectItem value="OTHER">Other Service</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assignedTechnician"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Technician / Shop</FormLabel>
                <FormControl>
                  <Input placeholder="Technician name or workshop" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issue Description *</FormLabel>
              <FormControl>
                <Textarea placeholder="Please describe the maintenance or repair required in detail..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Submit Maintenance Request"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
