// components/fuel/FuelForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FuelFormValues, fuelSchema } from "@/lib/validations/fuel";
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

interface FuelFormProps {
  onSubmit: (data: FuelFormValues) => Promise<void>;
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
  driverId: string;
}

export function FuelForm({ onSubmit, isSubmitting = false }: FuelFormProps) {
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");

  const form = useForm<FuelFormValues>({
    resolver: zodResolver(fuelSchema) as any,
    defaultValues: {
      tripId: "",
      vehicleId: "",
      driverId: "",
      liters: 0,
      cost: 0,
      odometer: 0,
      fuelStation: "",
      fuelDate: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehiclesRes, tripsRes] = await Promise.all([
          fetch("/api/vehicles?limit=100"),
          fetch("/api/trips?status=IN_PROGRESS&limit=100"),
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
    form.setValue("tripId", "");
    form.setValue("driverId", "");
  };

  const handleTripChange = (tripId: string) => {
    form.setValue("tripId", tripId);
    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      form.setValue("driverId", trip.driverId);
    } else {
      form.setValue("driverId", "");
    }
  };

  const filteredTrips = trips.filter(trip => 
    selectedVehicle ? trip.vehicleId === selectedVehicle : true
  );

  const onFormSubmit = async (values: FuelFormValues) => {
    await onSubmit(values);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading fuel log options...</div>;
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
                <FormLabel>Trip *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const val = value || "";
                    field.onChange(val);
                    handleTripChange(val);
                  }}
                  defaultValue={field.value}
                  disabled={!selectedVehicle}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select active trip" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredTrips.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        No active trips for this vehicle
                      </SelectItem>
                    ) : (
                      filteredTrips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.tripNumber} ({trip.source} → {trip.destination})
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
            name="liters"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Liters *</FormLabel>
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
            name="cost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost (₹) *</FormLabel>
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
            name="odometer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Odometer (km) *</FormLabel>
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
            name="fuelStation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fuel Station</FormLabel>
                <FormControl>
                  <Input placeholder="Fuel station name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fuelDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Fuel Date *</FormLabel>
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
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional notes..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add Fuel Log"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
