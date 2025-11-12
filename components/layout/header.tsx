"use client";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MapPin, Moon, Sun, User, LogOut, Settings } from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { ProfileModal } from "@/components/profile/profile-modal";

export function Header() {
  const { data: session } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Use real session data
  const user = session?.user ? {
    name: session.user.name || "Unknown User",
    email: session.user.email || "",
    avatar: session.user.image,
    initials: getInitials(session.user.name || "U U")
  } : null;

  return (
    <header className="sticky top-0 z-[9999] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-12 sm:h-14 md:h-16 items-center justify-between px-2 sm:px-3 md:px-4">
        {/* Logo and App Name - responsive sizing */}
        <div className="flex items-center gap-1 sm:gap-2">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
          <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">lookate</h1>
        </div>

        {/* Right side - Theme toggle and User menu - responsive spacing */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
          {/* Theme Toggle - responsive sizing */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9"
          >
            {isDarkMode ? (
              <Sun className="h-3 w-3 sm:h-4 sm:w-4" />
            ) : (
              <Moon className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>

          {/* User Menu - responsive avatar sizing */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9">
                    <AvatarImage src={user.avatar || ""} alt={user.name} />
                    <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 z-[10000]" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowProfile(true)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </div>
      
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onOpenChange={setShowProfile} />
    </header>
  );
}