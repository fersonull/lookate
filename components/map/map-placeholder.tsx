"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Loader2 } from "lucide-react";
import { InteractiveMap } from "./interactive-map";
import { RealTimeMap } from "./real-time-map";

// Placeholder component until we integrate React Leaflet
// This shows the UI design and layout structure

interface UserMarker {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  isOnline: boolean;
}

const mockUserLocations: UserMarker[] = [
  {
    id: "1",
    name: "Alice Johnson",
    location: {
      city: "New York",
      country: "USA",
      coordinates: [40.7128, -74.0060]
    },
    isOnline: true
  },
  {
    id: "2",
    name: "Bob Smith",
    location: {
      city: "London",
      country: "UK",
      coordinates: [51.5074, -0.1278]
    },
    isOnline: true
  },
  {
    id: "3",
    name: "Carol Wilson",
    location: {
      city: "Tokyo",
      country: "Japan",
      coordinates: [35.6762, 139.6503]
    },
    isOnline: true
  }
];

interface MapPlaceholderProps {
  selectedUserId?: string | null;
}

export function MapPlaceholder({ selectedUserId }: MapPlaceholderProps) {
  const [showInteractiveMap, setShowInteractiveMap] = useState(false);
  const [useRealTime, setUseRealTime] = useState(false);

  if (showInteractiveMap) {
    return useRealTime
      ? <RealTimeMap selectedUserId={selectedUserId} />
      : <InteractiveMap selectedUserId={selectedUserId} />;
  }

  return (
    <div className="relative h-full w-full bg-muted/30 rounded-lg overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
        <div className="text-center">
          <div className="mb-4 relative">
            <MapPin className="h-12 w-12 text-primary mx-auto animate-pulse" />
            <div className="absolute -top-1 -right-1">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Ready for Interactive Map!</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Click below to launch the live interactive map with real-time user locations
          </p>
          <div className="space-y-3">
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              {mockUserLocations.length} users tracked
            </Badge>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => {
                  setUseRealTime(true);
                  setShowInteractiveMap(true);
                }}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Launch Real-Time Map
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUseRealTime(false);
                  setShowInteractiveMap(true);
                }}
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Launch Demo Map
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mock User Markers - positioned absolutely to simulate map pins */}
      <div className="absolute inset-0 pointer-events-none">
        {/* New York marker */}
        <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="bg-red-500 text-white p-2 rounded-full shadow-lg animate-bounce">
                <MapPin className="h-4 w-4" />
              </div>
              <Card className="mt-2 p-2 text-xs min-w-max shadow-lg">
                <CardContent className="p-0">
                  <p className="font-medium">Alice Johnson</p>
                  <p className="text-muted-foreground">New York, USA</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* London marker */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg animate-bounce" style={{ animationDelay: "0.5s" }}>
                <MapPin className="h-4 w-4" />
              </div>
              <Card className="mt-2 p-2 text-xs min-w-max shadow-lg">
                <CardContent className="p-0">
                  <p className="font-medium">Bob Smith</p>
                  <p className="text-muted-foreground">London, UK</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tokyo marker */}
        <div className="absolute top-1/2 right-1/4 transform translate-x-1/2 -translate-y-1/2">
          <div className="relative pointer-events-auto">
            <div className="flex flex-col items-center">
              <div className="bg-green-500 text-white p-2 rounded-full shadow-lg animate-bounce" style={{ animationDelay: "1s" }}>
                <MapPin className="h-4 w-4" />
              </div>
              <Card className="mt-2 p-2 text-xs min-w-max shadow-lg">
                <CardContent className="p-0">
                  <p className="font-medium">Carol Wilson</p>
                  <p className="text-muted-foreground">Tokyo, Japan</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Map Controls Overlay - responsive positioning */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2">
        <Card className="p-1 sm:p-2">
          <CardContent className="p-0 flex items-center gap-1 sm:gap-2">
            <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs font-medium hidden sm:inline">Live Updates</span>
            <span className="text-xs font-medium sm:hidden">Live</span>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Info - responsive layout */}
      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
        <Card className="bg-background/90 backdrop-blur">
          <CardContent className="p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                  Real-time
                </Badge>
                <span className="text-muted-foreground text-xs">
                  Showing {mockUserLocations.length} active users
                </span>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Updates every 30 seconds
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}