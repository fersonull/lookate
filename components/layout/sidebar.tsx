"use client";

import { useState, useEffect } from "react";
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

interface SidebarProps {
  className?: string;
  onUserSelect?: (userId: string) => void;
}

export function Sidebar({ className, onUserSelect }: SidebarProps) {
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
          const users: ActiveUser[] = data.data.map((userLocation: any) => ({
            id: userLocation.userId,
            name: userLocation.userName,
            email: userLocation.userEmail || 'No email',
            avatar: userLocation.userAvatar,
            location: {
              city: userLocation.location.address.city,
              country: userLocation.location.address.country,
              coordinates: userLocation.location.coordinates
            },
            lastSeen: new Date(userLocation.lastSeen),
            isOnline: userLocation.isOnline
          }));
          setActiveUsers(users);
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
    <div className={cn("w-80 border-r bg-muted/50 relative z-[100]", className)}>
      <div className="flex h-full flex-col">
        {/* Stats Card */}
        <div className="p-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  {activeUsers.filter(u => u.isOnline).length} Online
                </Badge>
                <span className="text-sm text-muted-foreground">
                  • {activeUsers.length} Total
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-auto px-4 pb-4">
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
                No active users found. Be the first to share your location!
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {activeUsers.map((user) => (
              <Card 
                key={user.id} 
                className="p-3 transition-colors hover:bg-accent cursor-pointer"
                onClick={() => onUserSelect?.(user.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="text-sm">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    {user.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <Badge 
                        variant={user.isOnline ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {user.isOnline ? "Online" : "Away"}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{user.location.city}, {user.location.country}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
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