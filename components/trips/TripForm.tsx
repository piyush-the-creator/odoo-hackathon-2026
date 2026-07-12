// components/trips/TripForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TripFormValues, tripSchema } from "@/lib/validations/trip";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface TripFormProps {
  onSubmit: (data: TripFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

interface VehicleOption {
  id: string;
  registrationNumber: string;
  vehicleName: string;
  maximumLoadCapacity: number;
}

interface DriverOption {
  id: string;
  licenseNumber: string;
  user: {
    name: string;
    email: string;
  };
}

export function TripForm({ onSubmit, isSubmitting = false }: TripFormProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripSchema) as any,
    defaultValues: {
      vehicleId: "",
      driverId: "",
      source: "",
      destination: "",
      plannedDistance: 0,
      cargoWeight: 0,
      revenue: 0,
      remarks: "",
    },
  });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [vehiclesRes, driversRes] = await Promise.all([
          fetch("/api/vehicles/available"),
          fetch("/api/drivers/available"),
        ]);

        if (vehiclesRes.ok) {
          setVehicles(await vehiclesRes.json());
        } else {
          toast.error("Failed to load available vehicles");
        }

        if (driversRes.ok) {
          setDrivers(await driversRes.json());
        } else {
          toast.error("Failed to load available drivers");
        }
      } catch (error) {
        console.error("Error fetching options:", error);
        toast.error("Error loading available options");
      } finally {
        setLoading(false);
      }
    };
    fetchOptions();
  }, []);

  const onFormSubmit = async (values: TripFormValues) => {
    await onSubmit(values);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading assignment options...</div>;
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
                      <SelectValue placeholder="Select available vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        No available vehicles found
                      </SelectItem>
                    ) : (
                      vehicles.map((vehicle) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.registrationNumber} - {vehicle.vehicleName} ({vehicle.maximumLoadCapacity} kg max)
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
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Driver *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select available driver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drivers.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        No available drivers found
                      </SelectItem>
                    ) : (
                      drivers.map((driver) => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.user.name} - {driver.licenseNumber}
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
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source *</FormLabel>
                <FormControl>
                  <Input placeholder="Mumbai, India" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destination *</FormLabel>
                <FormControl>
                  <Input placeholder="Delhi, India" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="plannedDistance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Planned Distance (km) *</FormLabel>
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
            name="cargoWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cargo Weight (kg)</FormLabel>
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
            name="revenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue (₹)</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="remarks"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remarks</FormLabel>
              <FormControl>
                <Input placeholder="Additional trip notes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Trip"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
