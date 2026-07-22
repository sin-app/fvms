"use client";

import { useState } from "react";
import { MapPin, Crosshair, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateVisitStatus } from "@/features/schedules/hooks/use-schedules";

interface VisitGpsProps {
  scheduleId: string;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  currentAccuracy?: number | null;
  editable?: boolean;
}

export function VisitGps({
  scheduleId,
  currentLatitude,
  currentLongitude,
  currentAccuracy,
  editable = true,
}: VisitGpsProps) {
  const [capturing, setCapturing] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number | null;
  } | null>(
    currentLatitude && currentLongitude
      ? { latitude: currentLatitude, longitude: currentLongitude, accuracy: currentAccuracy ?? null }
      : null,
  );
  const [error, setError] = useState<string | null>(null);
  const updateStatus = useUpdateVisitStatus();

  function captureLocation() {
    if (!navigator.geolocation) {
      setError("GPS tidak didukung oleh perangkat ini");
      return;
    }

    setCapturing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setLocation(loc);
        setCapturing(false);

        await updateStatus.mutateAsync({
          id: scheduleId,
          status: "in_progress",
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
      },
      (err) => {
        setCapturing(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Izin GPS ditolak. Harap aktifkan lokasi.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Lokasi tidak tersedia. Coba di luar ruangan.");
            break;
          case err.TIMEOUT:
            setError("Waktu habis. Coba lagi.");
            break;
          default:
            setError("Gagal mendapatkan lokasi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          Lokasi GPS
        </h3>
        {editable && (
          <Button
            variant="outline"
            size="sm"
            onClick={captureLocation}
            disabled={capturing}
          >
            <Crosshair className="h-4 w-4 mr-1.5" />
            {capturing ? "Mengambil..." : "Ambil Lokasi"}
          </Button>
        )}
      </div>

      {location && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div className="text-sm text-green-800">
            <p>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
            {location.accuracy && (
              <p className="text-green-600 text-xs mt-0.5">
                Akurasi: ±{location.accuracy.toFixed(0)}m
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {!location && !error && (
        <p className="text-sm text-muted-foreground">
          Klik &ldquo;Ambil Lokasi&rdquo; untuk merekam posisi kunjungan Anda.
        </p>
      )}
    </div>
  );
}
