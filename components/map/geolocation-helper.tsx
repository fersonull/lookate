"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

interface GeolocationPermissionProps {
  onLocationUpdate: (coords: [number, number]) => void;
}

export function GeolocationHelper({ onLocationUpdate }: GeolocationPermissionProps) {
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unavailable'>('prompt');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      return;
    }

    // Check current permission state if available
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionState(result.state as any);
      });
    }
  }, []);

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationUpdate([latitude, longitude]);
        setPermissionState('granted');
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setPermissionState('denied');
            setError('Location access denied. Please enable location permissions in your browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  if (permissionState === 'unavailable') {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Geolocation Unavailable
          </CardTitle>
          <CardDescription>
            Your browser doesn't support geolocation features.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (permissionState === 'granted') {
    return (
      <Card className="max-w-md mx-auto border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-5 w-5" />
            Location Access Granted
          </CardTitle>
          <CardDescription className="text-green-600 dark:text-green-400">
            Your location is being shared with team members.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className="text-green-700 border-green-300 dark:text-green-300 dark:border-green-700">
            <MapPin className="h-3 w-3 mr-1" />
            Location Enabled
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Share Your Location
        </CardTitle>
        <CardDescription>
          Enable location sharing to appear on the team map and see accurate distance information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <Button 
          onClick={requestLocation} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Getting location...
            </div>
          ) : (
            <>
              <MapPin className="h-4 w-4 mr-2" />
              Enable Location Sharing
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground">
          <p className="mb-2"><strong>Why we need location access:</strong></p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Show your position to team members</li>
            <li>Calculate distances to other users</li>
            <li>Provide location-based features</li>
          </ul>
          <p className="mt-2">
            <strong>Privacy:</strong> Only approximate location is shared, never exact addresses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}