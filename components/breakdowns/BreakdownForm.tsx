// components/breakdowns/BreakdownForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BreakdownFormValues, breakdownSchema } from "@/lib/validations/breakdown";
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
import { Textarea } from "@/components/ui/textarea";
import { Image, Video, Mic, X } from "lucide-react";
import { toast } from "sonner";

interface BreakdownFormProps {
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting?: boolean;
}

interface TripOption {
  id: string;
  tripNumber: string;
  vehicle: {
    id: string;
    registrationNumber: string;
    vehicleName: string;
  };
}

export function BreakdownForm({ onSubmit, isSubmitting = false }: BreakdownFormProps) {
  const [trips, setTrips] = useState<TripOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TripOption | null>(null);
  const [files, setFiles] = useState<{
    photo: File | null;
    video: File | null;
    voiceNote: File | null;
  }>({
    photo: null,
    video: null,
    voiceNote: null,
  });

  const form = useForm<BreakdownFormValues>({
    resolver: zodResolver(breakdownSchema) as any,
    defaultValues: {
      tripId: "",
      vehicleId: "",
      driverId: "placeholder", // will be replaced in API handler based on session driver profile
      issueType: "Engine",
      severity: "MEDIUM",
      description: "",
    },
  });

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch("/api/trips?status=IN_PROGRESS&limit=100");
        if (response.ok) {
          const data = await response.json();
          setTrips(data.trips || []);
        } else {
          toast.error("Failed to load active trips list");
        }
      } catch (error) {
        console.error("Error fetching trips:", error);
        toast.error("Error loading active trips list");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const handleTripChange = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId);
    setSelectedTrip(trip || null);
    if (trip) {
      form.setValue("vehicleId", trip.vehicle.id);
    }
  };

  const handleFileChange = (type: 'photo' | 'video' | 'voiceNote', file: File | null) => {
    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const onFormSubmit = async (data: BreakdownFormValues) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });

    if (files.photo) formData.append("photo", files.photo);
    if (files.video) formData.append("video", files.video);
    if (files.voiceNote) formData.append("voiceNote", files.voiceNote);

    await onSubmit(formData);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading active trips...</div>;
  }

  if (trips.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No active trips found to report breakdowns.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="tripId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Active Trip *</FormLabel>
              <Select
                onValueChange={(value) => {
                  const val = value || "";
                  field.onChange(val);
                  handleTripChange(val);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select active trip" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.tripNumber} - {trip.vehicle.registrationNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedTrip && (
          <div className="rounded-md bg-muted p-3 text-sm">
            <p>
              <span className="font-medium text-muted-foreground">Vehicle Name:</span> {selectedTrip.vehicle.vehicleName}
            </p>
            <p className="mt-1">
              <span className="font-medium text-muted-foreground">Registration:</span> {selectedTrip.vehicle.registrationNumber}
            </p>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="issueType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Type *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select issue type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Engine">Engine</SelectItem>
                    <SelectItem value="Tyre">Tyre</SelectItem>
                    <SelectItem value="Brake">Brake</SelectItem>
                    <SelectItem value="Battery">Battery</SelectItem>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Accident">Accident</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="severity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Severity *</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(val || "")}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="CRITICAL">Critical</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Please describe the issue in detail, noting any symptoms..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 pt-2 border-t">
          <FormLabel>Media Attachments (Optional)</FormLabel>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Photo Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Image className="mr-2 h-4 w-4 text-muted-foreground" />
                  Upload Photo
                </Button>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('photo', file);
                  }}
                />
                {files.photo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileChange('photo', null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {files.photo && (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {files.photo.name}
                </p>
              )}
            </div>

            {/* Video Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  <Video className="mr-2 h-4 w-4 text-muted-foreground" />
                  Upload Video
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('video', file);
                  }}
                />
                {files.video && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileChange('video', null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {files.video && (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {files.video.name}
                </p>
              )}
            </div>

            {/* Voice note Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={() => document.getElementById('voice-upload')?.click()}
                >
                  <Mic className="mr-2 h-4 w-4 text-muted-foreground" />
                  Upload Voice
                </Button>
                <input
                  id="voice-upload"
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    handleFileChange('voiceNote', file);
                  }}
                />
                {files.voiceNote && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFileChange('voiceNote', null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {files.voiceNote && (
                <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                  {files.voiceNote.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Reporting..." : "Report Breakdown"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
