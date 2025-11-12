// Simplified Real-Time Data Hook - No WebSocket
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { UserLocation } from "@/lib/domain/entities/location";

interface UseRealTimeDataReturn {
  isConnected: boolean;
  connectedUsers: Array<{ userId: string; userName: string; isOnline: boolean }>;
  userLocations: UserLocation[];
  updateLocation: (location: any) => Promise<void>;
  sendActivity: (activity: any) => void;
  error: string | null;
  reconnecting: boolean;
  refreshData: () => Promise<void>;
}

export function useRealTimeData(): UseRealTimeDataReturn {
  const { data: session } = useSession();
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<Array<{ userId: string; userName: string; isOnline: boolean }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserLocations = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/locations');
      if (response.ok) {
        const data = await response.json();
        setUserLocations(data.data || []);
        
        // Extract connected users
        const users = (data.data || []).map((ul: any) => ({
          userId: ul.userId,
          userName: ul.userName,
          isOnline: ul.isOnline
        }));
        setConnectedUsers(users);
      } else {
        setError('Failed to load user locations');
      }
    } catch (err) {
      console.error('Failed to fetch locations:', err);
      setError('Network error loading locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount and set up polling
  useEffect(() => {
    fetchUserLocations();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUserLocations, 30000);
    return () => clearInterval(interval);
  }, [fetchUserLocations]);

  const updateLocation = useCallback(async (location: any) => {
    if (!session?.user?.id) {
      setError("Not authenticated");
      return;
    }

    try {
      setError(null);
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location })
      });

      if (!response.ok) {
        throw new Error('Failed to update location');
      }

      // Refresh data after successful update
      await fetchUserLocations();
      
    } catch (error) {
      console.error('Failed to update location:', error);
      setError('Failed to update location');
    }
  }, [session?.user?.id, fetchUserLocations]);

  const sendActivity = useCallback((activity: any) => {
    // For REST mode, just log the activity
    console.log('Activity sent (REST mode):', activity);
  }, []);

  return {
    isConnected: true, // Always "connected" in REST mode
    connectedUsers,
    userLocations,
    updateLocation,
    sendActivity,
    error,
    reconnecting: isLoading,
    refreshData: fetchUserLocations,
  };
}