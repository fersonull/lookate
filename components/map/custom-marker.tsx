"use client";

import { renderToString } from "react-dom/server";
import { MapPin } from "lucide-react";

// Dynamic import to avoid SSR issues
let L: any = null;
if (typeof window !== 'undefined') {
  L = require('leaflet');
}

// Custom marker icons for different user states
export function createUserMarkerIcon(isOnline: boolean, initials: string, color: string = "#3b82f6") {
  if (!L) return null;
  const iconHtml = renderToString(
    <div className={`relative flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm shadow-lg ${isOnline ? 'animate-pulse' : ''}`} 
         style={{ backgroundColor: color }}>
      {initials}
      {isOnline && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
      )}
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-user-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export function createCurrentUserMarkerIcon() {
  if (!L) return null;
  const iconHtml = renderToString(
    <div className="relative flex items-center justify-center w-10 h-10">
      <div className="absolute inset-0 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
      <div className="relative w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">
        <MapPin className="h-4 w-4" />
      </div>
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-current-user-marker',
    iconSize: [40, 40], 
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// Fix for default markers in React Leaflet
export function fixLeafletIcons() {
  if (!L || typeof window === 'undefined') return;
  // Delete default icon references to prevent errors
  delete (L.Icon.Default.prototype as any)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}