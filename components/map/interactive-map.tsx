"use client";

import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, RefreshCw, Locate, ZoomIn, ZoomOut, Settings, Filter } from "lucide-react";
import { createUserMarkerIcon, createCurrentUserMarkerIcon, fixLeafletIcons } from "./custom-marker";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-lg">
      <div className="text-center">
        <MapPin className="h-12 w-12 text-primary mx-auto animate-pulse mb-4" />
        <p className="text-muted-foreground">Loading interactive map...</p>
      </div>
    </div>
  ),
});

const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface UserMapData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location: {
    city: string;
    country: string;
    coordinates: [number, number];
  };
  lastSeen: Date;
  isOnline: boolean;
}

// Mock real-time data - will be replaced with actual WebSocket data
const mockMapUsers: UserMapData[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@example.com",
    location: {
      city: "New York",
      country: "USA",
      coordinates: [40.7128, -74.0060]
    },
    lastSeen: new Date(Date.now() - 2 * 60 * 1000),
    isOnline: true
  },
  {
    id: "2",
    name: "Bob Smith", 
    email: "bob@example.com",
    location: {
      city: "London",
      country: "UK", 
      coordinates: [51.5074, -0.1278]
    },
    lastSeen: new Date(Date.now() - 5 * 60 * 1000),
    isOnline: true
  },
  {
    id: "3",
    name: "Carol Wilson",
    email: "carol@example.com",
    location: {
      city: "Tokyo",
      country: "Japan",
      coordinates: [35.6762, 139.6503]
    },
    lastSeen: new Date(Date.now() - 1 * 60 * 1000),
    isOnline: true
  },
  {
    id: "4",
    name: "David Brown",
    email: "david@example.com", 
    location: {
      city: "Sydney",
      country: "Australia",
      coordinates: [-33.8688, 151.2093]
    },
    lastSeen: new Date(Date.now() - 15 * 60 * 1000),
    isOnline: false
  },
  {
    id: "5",
    name: "Emma Davis",
    email: "emma@example.com",
    location: {
      city: "Berlin",
      country: "Germany", 
      coordinates: [52.5200, 13.4050]
    },
    lastSeen: new Date(Date.now() - 3 * 60 * 1000),
    isOnline: true
  }
];

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

// Map Controls Component
function MapControls({ onRefresh, onLocate, onFilter, isRefreshing }: {
  onRefresh: () => void;
  onLocate: () => void;
  onFilter: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2 z-[1000]">
      <Card className="p-1 sm:p-2">
        <CardContent className="p-0 flex items-center gap-1 sm:gap-2">
          <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs font-medium hidden sm:inline">Live Updates</span>
          <span className="text-xs font-medium sm:hidden">Live</span>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-0.5 sm:gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-background/90 backdrop-blur"
          title="Refresh user locations"
        >
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onLocate}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-background/90 backdrop-blur"
          title="Find my location"
        >
          <Locate className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFilter}
          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-background/90 backdrop-blur"
          title="Filter users"
        >
          <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}

interface InteractiveMapProps {
  selectedUserId?: string | null;
}

export function InteractiveMap({ selectedUserId }: InteractiveMapProps) {
  const [users, setUsers] = useState<UserMapData[]>(mockMapUsers);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [filterOnlineOnly, setFilterOnlineOnly] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const mapRef = useRef<any>(null);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setUsers(currentUsers => 
        currentUsers.map(user => ({
          ...user,
          // Randomly update some users' online status
          isOnline: Math.random() > 0.1 ? user.isOnline : !user.isOnline,
          lastSeen: user.isOnline ? new Date() : user.lastSeen
        }))
      );
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

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
    // Simulate API call to refresh user locations
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate some users changing locations slightly
    setUsers(currentUsers => 
      currentUsers.map(user => ({
        ...user,
        location: {
          ...user.location,
          coordinates: [
            user.location.coordinates[0] + (Math.random() - 0.5) * 0.01,
            user.location.coordinates[1] + (Math.random() - 0.5) * 0.01
          ] as [number, number]
        },
        lastSeen: user.isOnline ? new Date() : user.lastSeen
      }))
    );
    
    setIsRefreshing(false);
  };

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 10);
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
    const user = users.find(u => u.id === userId);
    if (user && mapRef.current) {
      mapRef.current.setView(user.location.coordinates, 8);
      setSelectedUser(userId);
      
      // Clear selection after 3 seconds
      setTimeout(() => setSelectedUser(null), 3000);
    }
  };

  const getMarkerColor = (user: UserMapData) => {
    if (user.id === selectedUser) return "#f59e0b"; // amber for selected
    if (!user.isOnline) return "#6b7280"; // gray for offline
    
    // Different colors based on continent/region
    const continent = getContinent(user.location.coordinates);
    const colors = {
      'North America': '#ef4444', // red
      'Europe': '#3b82f6', // blue  
      'Asia': '#10b981', // green
      'Australia': '#8b5cf6', // purple
      'Default': '#f97316' // orange
    };
    return colors[continent as keyof typeof colors] || colors.Default;
  };

  const getContinent = (coordinates: [number, number]): string => {
    const [lat, lng] = coordinates;
    if (lat > 30 && lng > -130 && lng < -60) return 'North America';
    if (lat > 35 && lng > -10 && lng < 70) return 'Europe';
    if (lat > 10 && lng > 70 && lng < 180) return 'Asia';
    if (lat < -10 && lng > 110 && lng < 180) return 'Australia';
    return 'Default';
  };

  const filteredUsers = filterOnlineOnly ? users.filter(user => user.isOnline) : users;
  const activeUsers = users.filter(user => user.isOnline);

  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden">
      {/* Map Container */}
      <div className="h-full w-full">
        <MapContainer
          center={[20, 0]} // Center of the world
          zoom={2}
          style={{ height: "100%", width: "100%" }}
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
          
          {/* Filtered User Markers */}
          {filteredUsers.map((user) => (
            <Marker
              key={user.id}
              position={user.location.coordinates}
              icon={createUserMarkerIcon(
                user.isOnline, 
                getInitials(user.name),
                getMarkerColor(user)
              )}
              eventHandlers={{
                click: () => focusOnUser(user.id),
              }}
            >
              <Popup>
                <div className="p-3 min-w-[220px]">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <div className="h-12 w-12 rounded-full flex items-center justify-center font-medium text-white text-sm"
                           style={{ backgroundColor: getMarkerColor(user) }}>
                        {getInitials(user.name)}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <Badge 
                        variant={user.isOnline ? "default" : "secondary"} 
                        className="text-xs mt-1"
                      >
                        {user.isOnline ? "🟢 Online" : "⚫ Away"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2 border-t pt-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{user.location.city}, {user.location.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Last seen:</span>
                      <span className="text-xs">{getTimeAgo(user.lastSeen)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Region:</span>
                      <span className="text-xs">{getContinent(user.location.coordinates)}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

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
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      {/* Enhanced Map Controls */}
      <MapControls
        onRefresh={handleRefresh}
        onLocate={getUserLocation}
        onFilter={handleFilter}
        isRefreshing={isRefreshing}
      />

      {/* Filter Status - responsive positioning */}
      {filterOnlineOnly && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-[1000]">
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-1 sm:p-2 flex items-center gap-1 sm:gap-2">
              <Filter className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                <span className="hidden sm:inline">Showing online users only</span>
                <span className="sm:hidden">Online only</span>
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

      {/* Bottom Stats - responsive layout */}
      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
        <Card className="bg-background/90 backdrop-blur">
          <CardContent className="p-2 sm:p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 text-xs sm:text-sm">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                    {activeUsers.length} Online
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    • {filterOnlineOnly ? filteredUsers.length : users.length} {filterOnlineOnly ? 'Shown' : 'Total'}
                  </span>
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-muted-foreground text-xs">
                    {new Set(filteredUsers.map(u => u.location.country)).size} Countries
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                    style={{ backgroundColor: '#ef4444' }}
                  />
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                  <div 
                    className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                    style={{ backgroundColor: '#10b981' }}
                  />
                  <span className="text-xs text-muted-foreground">Regions</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                Live updates • Click markers to focus
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}