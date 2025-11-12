"use client";

import { useState, useEffect } from "react";
import { createUserMarkerIcon } from "./custom-marker";
import { UserLocation } from "@/lib/domain/entities/location";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

// Dynamic imports for Leaflet components
import dynamic from "next/dynamic";

const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });

interface ClusteredMarkersProps {
  userLocations: UserLocation[];
  onUserClick: (userId: string) => void;
  getInitials: (name: string) => string;
  getMarkerColor: (userLocation: UserLocation) => string;
  getTimeAgo: (date: Date | string) => string;
  getContinent: (coordinates: [number, number] | { latitude: number; longitude: number }) => string;
  selectedUser: string | null;
}

// Function to detect if two coordinates are very close (within ~100 meters)
function areLocationsClose(coord1: [number, number], coord2: [number, number], thresholdKm: number = 0.1): boolean {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2[0] - coord1[0]) * Math.PI / 180;
  const dLon = (coord2[1] - coord1[1]) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1[0] * Math.PI / 180) * Math.cos(coord2[0] * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance < thresholdKm;
}

// Function to arrange overlapping markers in a circle
function arrangeOverlappingMarkers(userLocations: UserLocation[]): UserLocation[] {
  const result: UserLocation[] = [];
  const processed = new Set<string>();
  
  userLocations.forEach((userLocation, index) => {
    if (processed.has(userLocation.userId)) return;
    
    const coords = userLocation.location.coordinates;
    const position: [number, number] = Array.isArray(coords) 
      ? [coords[0], coords[1]]
      : [(coords as any).latitude, (coords as any).longitude];
    
    // Find all users at the same location
    const overlappingUsers = userLocations.filter((other, otherIndex) => {
      if (otherIndex === index || processed.has(other.userId)) return false;
      
      const otherCoords = other.location.coordinates;
      const otherPosition: [number, number] = Array.isArray(otherCoords) 
        ? [otherCoords[0], otherCoords[1]]
        : [(otherCoords as any).latitude, (otherCoords as any).longitude];
      
      return areLocationsClose(position, otherPosition);
    });
    
    if (overlappingUsers.length === 0) {
      // No overlapping users, add as-is
      result.push(userLocation);
      processed.add(userLocation.userId);
    } else {
      // Arrange overlapping users in a circle
      const allUsers = [userLocation, ...overlappingUsers];
      const radius = 0.001; // Small radius in degrees (~100 meters)
      
      allUsers.forEach((user, i) => {
        const angle = (2 * Math.PI * i) / allUsers.length;
        const offsetLat = Math.sin(angle) * radius;
        const offsetLng = Math.cos(angle) * radius;
        
        const adjustedUser: UserLocation = {
          ...user,
          location: {
            ...user.location,
            coordinates: Array.isArray(user.location.coordinates) 
              ? [position[0] + offsetLat, position[1] + offsetLng] as [number, number]
              : {
                  latitude: position[0] + offsetLat,
                  longitude: position[1] + offsetLng
                }
          }
        };
        
        result.push(adjustedUser);
        processed.add(user.userId);
      });
    }
  });
  
  return result;
}

export function ClusteredMarkers({ 
  userLocations, 
  onUserClick, 
  getInitials, 
  getMarkerColor, 
  getTimeAgo, 
  getContinent,
  selectedUser 
}: ClusteredMarkersProps) {
  const [arrangedUsers, setArrangedUsers] = useState<UserLocation[]>([]);
  
  useEffect(() => {
    const arranged = arrangeOverlappingMarkers(userLocations);
    setArrangedUsers(arranged);
  }, [userLocations]);
  
  return (
    <>
      {arrangedUsers.map((userLocation) => {
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
              getMarkerColor(userLocation),
              userLocation.userAvatar
            )}
            eventHandlers={{
              click: () => onUserClick(userLocation.userId),
            }}
          >
            <Popup>
              <div className="p-3 min-w-[220px]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative">
                    {userLocation.userAvatar ? (
                      <>
                        <img 
                          src={userLocation.userAvatar} 
                          alt={userLocation.userName}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white shadow-md"
                        />
                        {userLocation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white animate-pulse" />
                        )}
                      </>
                    ) : (
                      <>
                        <div className="h-12 w-12 rounded-full flex items-center justify-center font-medium text-white text-sm"
                             style={{ backgroundColor: getMarkerColor(userLocation) }}>
                          {getInitials(userLocation.userName)}
                        </div>
                        {userLocation.isOnline && (
                          <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white animate-pulse" />
                        )}
                      </>
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
    </>
  );
}