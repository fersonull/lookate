"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Users, Menu } from "lucide-react";

interface MobileSidebarProps {
  onUserSelect?: (userId: string) => void;
}

export function MobileSidebar({ onUserSelect }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleUserSelect = (userId: string) => {
    onUserSelect?.(userId);
    setIsOpen(false); // Close sidebar after selection
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-3 left-3 sm:bottom-4 sm:left-4 z-[1000] h-10 w-10 sm:h-12 sm:w-12 rounded-full shadow-lg bg-background border-2 hover:scale-105 transition-transform"
        >
          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-80 md:w-96 p-0 max-w-[90vw]">
        <SheetHeader className="p-3 sm:p-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            Active Users
          </SheetTitle>
          <SheetDescription className="text-sm">
            Tap on a user to view their location on the map
          </SheetDescription>
        </SheetHeader>
        <div className="h-[calc(100vh-80px)] sm:h-[calc(100vh-100px)]">
          <Sidebar onUserSelect={handleUserSelect} className="border-none" />
        </div>
      </SheetContent>
    </Sheet>
  );
}