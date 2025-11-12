"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Clock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveUser {
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

// Real data will be loaded from API

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
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

interface SidebarProps {
  className?: string;
  onUserSelect?: (userId: string) => void;
}

export function Sidebar({ className, onUserSelect }: SidebarProps) {
  const { data: session } = useSession();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch active users from API
  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/locations');
        if (response.ok) {
          const data = await response.json();
          console.log('Sidebar received data:', data);
          
          if (data.data && Array.isArray(data.data)) {
            const allUsers: ActiveUser[] = data.data.map((userLocation: any) => ({
              id: userLocation.userId,
              name: userLocation.userName || 'Unknown User',
              email: userLocation.userEmail || 'No email',
              avatar: userLocation.userAvatar,
              location: {
                city: userLocation.location?.address?.city || 'Unknown City',
                country: userLocation.location?.address?.country || 'Unknown Country',
                coordinates: userLocation.location?.coordinates || [0, 0]
              },
              lastSeen: userLocation.lastSeen,
              isOnline: userLocation.isOnline
            }));
            
            // Get current user info
            const currentUserId = (session?.user as any)?.id;
            const currentUserEmail = session?.user?.email;
            
            // Filter out the current user from the sidebar
            const otherUsers = allUsers.filter(user => {
              // Compare by user ID or email to exclude current user
              return user.id !== currentUserId && user.email !== currentUserEmail;
            });
            
            console.log('All users:', allUsers.length);
            console.log('Other users (excluding self):', otherUsers.length);
            console.log('Current user ID/Email:', currentUserId, currentUserEmail);
            
            setActiveUsers(otherUsers);
          } else {
            console.log('No data.data array found:', data);
            setActiveUsers([]);
          }
        } else {
          setError('Failed to load users');
        }
      } catch (err) {
        setError('Network error');
        console.error('Error fetching active users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveUsers();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveUsers, 30000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className={cn("w-full h-full border-r bg-muted/50 relative z-[100]", className)}>
      <div className="flex h-full flex-col">
        {/* Stats Card - responsive padding */}
        <div className="p-2 sm:p-3 lg:p-4">
          <Card>
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                  {activeUsers.filter(u => u.isOnline).length} Online
                </Badge>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  • {activeUsers.length} Total
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List - responsive padding */}
        <div className="flex-1 overflow-auto px-2 sm:px-3 lg:px-4 pb-2 sm:pb-3 lg:pb-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start gap-3 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-muted"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="p-4">
              <p className="text-sm text-red-600 text-center">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Card>
          ) : activeUsers.length === 0 ? (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                No other users online. Share your location to see others!
              </p>
            </Card>
          ) : (
            <div className="space-y-1 sm:space-y-2">
              {activeUsers.map((user) => (
              <Card 
                key={user.id} 
                className="p-2 sm:p-3 transition-colors hover:bg-accent cursor-pointer"
                onClick={() => onUserSelect?.(user.id)}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-xs sm:text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-3 sm:w-3 rounded-full bg-green-500 ring-1 sm:ring-2 ring-background" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium truncate">{user.name}</p>
                      <Badge 
                        variant={user.isOnline ? "default" : "secondary"}
                        className="text-xs flex-shrink-0"
                      >
                        {user.isOnline ? "Online" : "Away"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{user.location.city}, {user.location.country}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 flex-shrink-0" />
                      <span>Last seen {getTimeAgo(user.lastSeen)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}