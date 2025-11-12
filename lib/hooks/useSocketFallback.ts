// Fallback Hook for Socket.IO when server is not available
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { UserLocation } from "@/lib/domain/entities/location";

interface UseSocketFallbackReturn {
  isConnected: boolean;
  connectedUsers: Array<{ userId: string; userName: string; isOnline: boolean }>;
  userLocations: UserLocation[];
  updateLocation: (location: any) => Promise<void>;
  sendActivity: (activity: any) => void;
  error: string | null;
  reconnecting: boolean;
}

// Real user locations will be loaded from API

export function useSocketFallback(): UseSocketFallbackReturn {
  const { data: session } = useSession();
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<Array<{ userId: string; userName: string; isOnline: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load real user locations from API
  useEffect(() => {
    const fetchUserLocations = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/locations');
        if (response.ok) {
          const data = await response.json();
          setUserLocations(data.data || []);
          
          // Extract connected users
          const users = data.data.map((ul: any) => ({
            userId: ul.userId,
            userName: ul.userName,
            isOnline: ul.isOnline
          }));
          setConnectedUsers(users);
        }
      } catch (err) {
        console.error('Failed to fetch locations:', err);
        setError('Failed to load user locations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserLocations();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUserLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateLocation = useCallback(async (location: any) => {
    if (!session?.user?.id) {
      setError("Not authenticated");
      return;
    }

    try {
      // Use REST API fallback
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Add user's location to the list if authenticated
      const userLocation: UserLocation = {
        userId: session.user.id,
        userName: session.user.name || "You",
        userAvatar: session.user.image || undefined,
        location: {
          id: `user-${session.user.id}`,
          userId: session.user.id,
          coordinates: location.coordinates,
          address: location.address,
          accuracy: location.accuracy,
          timestamp: new Date(),
        },
        isOnline: true,
        lastSeen: new Date(),
      };

      setUserLocations(current => {
        const filtered = current.filter(ul => ul.userId !== session.user.id);
        return [...filtered, userLocation];
      });

      setError(null);
    } catch (error) {
      console.error('Failed to update location:', error);
      setError('Failed to update location');
    }
  }, [session?.user]);

  const sendActivity = useCallback((activity: any) => {
    // For fallback, just log the activity
    console.log('Activity sent (fallback mode):', activity);
  }, []);

  return {
    isConnected: false, // Indicate we're in fallback mode
    connectedUsers,
    userLocations,
    updateLocation,
    sendActivity,
    error,
    reconnecting: false,
  };
}