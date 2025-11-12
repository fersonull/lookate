"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, RefreshCw, Locate, Filter, Wifi, WifiOff } from "lucide-react";
import { createUserMarkerIcon, createCurrentUserMarkerIcon, fixLeafletIcons } from "./custom-marker";
import { useRealTimeData } from "@/lib/hooks/useRealTimeData";
import { UserLocation } from "@/lib/domain/entities/location";
import { ConnectionStatus } from "@/components/ui/connection-status";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-lg">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-primary mx-auto animate-pulse mb-4" />
        <p className="text-muted-foreground">Loading real-time map...</p>
      </div>
    </div>
  ),
});

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface RealTimeMapProps {
  selectedUserId?: string | null;
}

// Map Controls Component
function MapControls({ 
  onRefresh, 
  onLocate, 
  onFilter, 
  isRefreshing, 
  isConnected 
}: {
  onRefresh: () => void;
  onLocate: () => void;
  onFilter: () => void;
  isRefreshing: boolean;
  isConnected: boolean;
}) {
  return (
    <div className="absolute top-4 right-4 flex flex-col gap-2 z-[1000]">
      <Card className={`p-2 ${isConnected ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'}`}>
        <CardContent className="p-0 flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-600 dark:text-green-400">Live Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">Disconnected</span>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing || !isConnected}
          className="h-8 w-8 p-0 bg-background/90 backdrop-blur"
          title="Refresh user locations"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onLocate}
          className="h-8 w-8 p-0 bg-background/90 backdrop-blur"
          title="Share my location"
        >
          <Locate className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFilter}
          className="h-8 w-8 p-0 bg-background/90 backdrop-blur"
          title="Filter users"
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d ago`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
}

export function RealTimeMap({ selectedUserId }: RealTimeMapProps) {
  const { data: session } = useSession();
  
  // Use simplified real-time data hook (REST-based, no WebSocket errors)
  const { 
    isConnected, 
    userLocations, 
    connectedUsers, 
    updateLocation, 
    error: socketError,
    reconnecting,
    refreshData
  } = useRealTimeData();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  // Initialize Leaflet icons on component mount
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  // Handle external user selection from sidebar
  useEffect(() => {
    if (selectedUserId) {
      focusOnUser(selectedUserId);
    }
  }, [selectedUserId]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      console.log('Locations refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh locations:', error);
    }
    setIsRefreshing(false);
  };

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 10);
          }

          // Update location via current connection method (WebSocket or REST)
          try {
            // For demo, we'll use a reverse geocoding service or mock data
            const locationData = {
              coordinates: { latitude, longitude },
              address: {
                city: "Current City", // In production, use reverse geocoding
                country: "Current Country",
                countryCode: "CC"
              },
              accuracy: position.coords.accuracy
            };

            // Use the updateLocation method from current hook (WebSocket or fallback)
            await updateLocation(locationData);
            
            console.log('Location updated successfully');
          } catch (error) {
            console.error('Failed to update location:', error);
          }
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      console.error("Geolocation is not supported");
    }
  };

  const handleFilter = () => {
    setFilterOnlineOnly(!filterOnlineOnly);
  };

  const focusOnUser = (userId: string) => {
    const userLocation = userLocations.find(ul => ul.userId === userId);
    if (userLocation && mapRef.current) {
      mapRef.current.setView(userLocation.location.coordinates, 8);
      setSelectedUser(userId);
      
      // Clear selection after 3 seconds
      setTimeout(() => setSelectedUser(null), 3000);
    }
  };

  const getMarkerColor = (userLocation: UserLocation) => {
    if (userLocation.userId === selectedUser) return "#f59e0b"; // amber for selected
    if (!userLocation.isOnline) return "#6b7280"; // gray for offline
    
    // Different colors based on continent/region
    const continent = getContinent(userLocation.location.coordinates);
    const colors = {
      'North America': '#ef4444', // red
      'Europe': '#3b82f6', // blue  
      'Asia': '#10b981', // green
      'Australia': '#8b5cf6', // purple
      'Default': '#f97316' // orange
    };
    return colors[continent as keyof typeof colors] || colors.Default;
  };

  const getContinent = (coordinates: [number, number] | { latitude: number; longitude: number }): string => {
    let lat: number, lng: number;
    
    if (Array.isArray(coordinates)) {
      [lat, lng] = coordinates;
    } else {
      lat = coordinates.latitude;
      lng = coordinates.longitude;
    }
    
    if (lat > 30 && lng > -130 && lng < -60) return 'North America';
    if (lat > 35 && lng > -10 && lng < 70) return 'Europe';
    if (lat > 10 && lng > 70 && lng < 180) return 'Asia';
    if (lat < -10 && lng > 110 && lng < 180) return 'Australia';
    return 'Default';
  };

  const filteredLocations = filterOnlineOnly 
    ? userLocations.filter(ul => ul.isOnline) 
    : userLocations;

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Map Container */}
      <div className="absolute inset-0">
        <MapContainer
          center={[20, 0]} // Center of the world
          zoom={2}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          className="rounded-lg"
          ref={mapRef}
          whenReady={() => {
            // Map is ready - ref should be populated
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Real-time User Markers */}
          {filteredLocations.map((userLocation) => {
            const coords = userLocation.location.coordinates;
            const position: [number, number] = Array.isArray(coords) 
              ? [coords[0], coords[1]]
              : [(coords as any).latitude, (coords as any).longitude];
              
            return (
            <Marker
              key={userLocation.userId}
              position={position}
              icon={createUserMarkerIcon(
                userLocation.isOnline, 
                getInitials(userLocation.userName),
                getMarkerColor(userLocation)
              )}
              eventHandlers={{
                click: () => focusOnUser(userLocation.userId),
              }}
            >
              <Popup>
                <div className="p-3 min-w-[220px]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center font-medium text-white text-sm"
                           style={{ backgroundColor: getMarkerColor(userLocation) }}>
                        {getInitials(userLocation.userName)}
                      </div>
                      {userLocation.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{userLocation.userName}</p>
                      <Badge 
                        variant={userLocation.isOnline ? "default" : "secondary"} 
                        className="text-xs mt-1"
                      >
                        {userLocation.isOnline ? "🟢 Online" : "⚫ Away"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t pt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {userLocation.location.address.city}, {userLocation.location.address.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Last seen:</span>
                      <span className="text-xs">{getTimeAgo(userLocation.lastSeen)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Region:</span>
                      <span className="text-xs">{getContinent(userLocation.location.coordinates)}</span>
                    </div>
                    {userLocation.location.accuracy && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Accuracy:</span>
                        <span className="text-xs">~{Math.round(userLocation.location.accuracy)}m</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
            );
          })}

          {/* User's current location */}
          {userLocation && (
            <Marker 
              position={userLocation}
              icon={createCurrentUserMarkerIcon()}
            >
              <Popup>
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Locate className="h-4 w-4 text-primary" />
                    <span className="font-semibold">Your Current Location</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Being shared with your team
                  </p>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Enhanced Map Controls */}
      <div className="absolute top-4 right-4 z-[1000]">
        <MapControls
          onRefresh={handleRefresh}
          onLocate={getUserLocation}
          onFilter={handleFilter}
          isRefreshing={isRefreshing}
          isConnected={isConnected}
        />
      </div>

      {/* Filter Status */}
      {filterOnlineOnly && (
        <div className="absolute top-4 left-4 z-[1100]">
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 shadow-lg">
            <CardContent className="p-2 flex items-center gap-2">
              <Filter className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                Showing online users only
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilterOnlineOnly(false)}
                className="h-4 w-4 p-0 text-blue-600 dark:text-blue-400"
              >
                ×
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Status */}
      {socketError && (
        <div className="absolute bottom-28 left-4 right-4 z-[1100]">
          <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 shadow-lg">
            <CardContent className="p-3">
              <p className="text-sm text-red-600 dark:text-red-400">
                ⚠️ {socketError}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                Reload App
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Stats - User information only */}
      <div className="absolute bottom-4 left-4 right-4 z-[1100]">
        <Card className="bg-background/95 backdrop-blur border shadow-lg">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {userLocations.filter(ul => ul.isOnline).length} Online
                  </Badge>
                  <span className="text-muted-foreground">
                    • {filteredLocations.length} {filterOnlineOnly ? 'Shown' : 'Total'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    {new Set(filteredLocations.map(ul => ul.location.address.country)).size} Countries
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Click markers to focus • Share location to appear
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}