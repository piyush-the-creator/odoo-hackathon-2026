// components/expenses/ExpenseForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExpenseFormValues, expenseSchema } from "@/lib/validations/expense";
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
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

interface VehicleOption {
  id: string;
  registrationNumber: string;
  vehicleName: string;
}

interface TripOption {
  id: string;
  tripNumber: string;
  source: string;
  destination: string;
  vehicleId: string;
}

export function ExpenseForm({ onSubmit, isSubmitting = false }: ExpenseFormProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: {
      vehicleId: "",
      tripId: null,
      expenseType: "FUEL",
      amount: 0,
      expenseDate: new Date(),
      description: "",
      receiptUrl: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, tripsRes] = await Promise.all([
          fetch("/api/vehicles?limit=100"),
          fetch("/api/trips?limit=100"),
        ]);

        if (vehiclesRes.ok) {
          const data = await vehiclesRes.json();
          setVehicles(data.vehicles || []);
        }

        if (tripsRes.ok) {
          const data = await tripsRes.json();
          setTrips(data.trips || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load options");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVehicleChange = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
    form.setValue("vehicleId", vehicleId);
    form.setValue("tripId", null);
  };

  const filteredTrips = trips.filter(trip => 
    selectedVehicle ? trip.vehicleId === selectedVehicle : true
  );

  const onFormSubmit = async (values: ExpenseFormValues) => {
    await onSubmit(values);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading expense form options...</div>;
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
                  onValueChange={(value) => {
                    const val = value || "";
                    field.onChange(val);
                    handleVehicleChange(val);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationNumber} - {vehicle.vehicleName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tripId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Trip (Optional)</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value === "_none" ? null : (value || null))}
                  defaultValue={field.value || "_none"}
                  disabled={!selectedVehicle}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trip" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="_none">No associated trip</SelectItem>
                    {filteredTrips.map((trip) => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.tripNumber} ({trip.source} → {trip.destination})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expenseType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expense Type *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="FUEL">Fuel</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="TOLL">Toll</SelectItem>
                    <SelectItem value="PARKING">Parking</SelectItem>
                    <SelectItem value="REPAIR">Repair</SelectItem>
                    <SelectItem value="PENALTY">Penalty</SelectItem>
                    <SelectItem value="INSURANCE">Insurance</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (₹) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expenseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Expense Date *</FormLabel>
                <Popover>
                  <PopoverTrigger render={
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full pl-3 text-left font-normal cursor-pointer",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  } />
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => field.onChange(date || new Date())}
                      disabled={(date) =>
                        date > new Date() || date < new Date("2000-01-01")
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receiptUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Receipt URL / Document</FormLabel>
                <FormControl>
                  <Input placeholder="http://example.com/receipt.pdf" {...field} value={field.value || ""} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Expense details or notes..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Expense"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
