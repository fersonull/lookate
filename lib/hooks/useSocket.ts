// React Hook for Socket.IO Integration
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { socketClient, SocketEvents } from "@/lib/infrastructure/websocket/socket-client";
import { UserLocation } from "@/lib/domain/entities/location";

interface UseSocketReturn {
  isConnected: boolean;
  connectedUsers: Array<{ userId: string; userName: string; isOnline: boolean }>;
  userLocations: UserLocation[];
  updateLocation: (location: any) => void;
  sendActivity: (activity: any) => void;
  error: string | null;
  reconnecting: boolean;
}

export function useSocket(): UseSocketReturn {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<Array<{ userId: string; userName: string; isOnline: boolean }>>([]);
  const [userLocations, setUserLocations] = useState<UserLocation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(false);
  const [connectionAttempted, setConnectionAttempted] = useState(false);
  const initialized = useRef(false);

  const handleConnect = useCallback(() => {
    setIsConnected(true);
    setError(null);
    setReconnecting(false);
    console.log("Socket connected successfully");
  }, []);

  const handleDisconnect = useCallback(() => {
    setIsConnected(false);
    setReconnecting(true);
  }, []);

  const handleUserOnline = useCallback((data: { userId: string; userName: string; timestamp: Date }) => {
    setConnectedUsers(prev => {
      const filtered = prev.filter(user => user.userId !== data.userId);
      return [...filtered, {
        userId: data.userId,
        userName: data.userName,
        isOnline: true,
      }];
    });
  }, []);

  const handleUserOffline = useCallback((data: { userId: string; userName: string; timestamp: Date }) => {
    setConnectedUsers(prev => 
      prev.map(user => 
        user.userId === data.userId 
          ? { ...user, isOnline: false }
          : user
      )
    );
  }, []);

  const handleUsersConnected = useCallback((users: Array<{ userId: string; userName: string; isOnline: boolean }>) => {
    setConnectedUsers(users);
  }, []);

  const handleLocationsInitial = useCallback((locations: UserLocation[]) => {
    setUserLocations(locations);
  }, []);

  const handleLocationUpdated = useCallback((data: { userId: string; userName: string; location: any; timestamp: Date }) => {
    setUserLocations(prev => {
      const updated = prev.map(userLocation => {
        if (userLocation.userId === data.userId) {
          return {
            ...userLocation,
            location: {
              ...userLocation.location,
              coordinates: data.location.coordinates,
              address: data.location.address,
              accuracy: data.location.accuracy,
              timestamp: new Date(data.timestamp),
            },
            lastSeen: new Date(data.timestamp),
          };
        }
        return userLocation;
      });

      // If user not found, add new location
      if (!updated.find(ul => ul.userId === data.userId)) {
        updated.push({
          userId: data.userId,
          userName: data.userName,
          location: {
            id: `temp-${data.userId}`,
            userId: data.userId,
            coordinates: data.location.coordinates,
            address: data.location.address,
            accuracy: data.location.accuracy,
            timestamp: new Date(data.timestamp),
          },
          isOnline: true,
          lastSeen: new Date(data.timestamp),
        });
      }

      return updated;
    });
  }, []);

  const handleLocationUpdateError = useCallback((data: { error: string }) => {
    setError(data.error);
    console.error("Location update error:", data.error);
  }, []);

  const updateLocation = useCallback((location: any) => {
    if (isConnected) {
      socketClient.updateLocation(location);
    } else {
      setError("Not connected to server");
    }
  }, [isConnected]);

  const sendActivity = useCallback((activity: any) => {
    if (isConnected) {
      socketClient.sendActivity(activity);
    }
  }, [isConnected]);

  // Initialize socket connection
  useEffect(() => {
    if (session?.user?.id && !initialized.current) {
      initialized.current = true;
      setConnectionAttempted(true);
      setReconnecting(true);
      
      // For this demo, we'll create a temporary token
      // In production, this should come from your auth system
      const tempToken = btoa(JSON.stringify({ userId: session.user.id }));
      
      // Set a timeout for connection attempt
      const connectionTimeout = setTimeout(() => {
        setError("Connection failed: WebSocket server not available");
        setReconnecting(false);
        setIsConnected(false);
      }, 5000); // 5 second timeout
      
      socketClient.connect(tempToken)
        .then(() => {
          clearTimeout(connectionTimeout);
          // Set up event listeners
          socketClient.on("connect", handleConnect);
          socketClient.on("disconnect", handleDisconnect);
          socketClient.on("user:online", handleUserOnline);
          socketClient.on("user:offline", handleUserOffline);
          socketClient.on("users:connected", handleUsersConnected);
          socketClient.on("locations:initial", handleLocationsInitial);
          socketClient.on("location:updated", handleLocationUpdated);
          socketClient.on("location:update:error", handleLocationUpdateError);
        })
        .catch((err) => {
          clearTimeout(connectionTimeout);
          setError(`Connection failed: ${err.message}`);
          setReconnecting(false);
          setIsConnected(false);
        });
    }

    return () => {
      if (initialized.current) {
        socketClient.off("connect", handleConnect);
        socketClient.off("disconnect", handleDisconnect);
        socketClient.off("user:online", handleUserOnline);
        socketClient.off("user:offline", handleUserOffline);
        socketClient.off("users:connected", handleUsersConnected);
        socketClient.off("locations:initial", handleLocationsInitial);
        socketClient.off("location:updated", handleLocationUpdated);
        socketClient.off("location:update:error", handleLocationUpdateError);
      }
    };
  }, [session?.user?.id, handleConnect, handleDisconnect, handleUserOnline, handleUserOffline, handleUsersConnected, handleLocationsInitial, handleLocationUpdated, handleLocationUpdateError]);

  return {
    isConnected,
    connectedUsers,
    userLocations,
    updateLocation,
    sendActivity,
    error,
    reconnecting,
  };
}