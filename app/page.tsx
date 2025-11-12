"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { WelcomeScreen } from "@/components/welcome/welcome-screen";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MapPlaceholder } from "@/components/map/map-placeholder";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { data: session, status } = useSession();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6 flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show welcome screen if not authenticated
  if (!session) {
    return <WelcomeScreen />;
  }

  // Show main app if authenticated
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onUserSelect={setSelectedUserId} />
        <main className="flex-1 p-6">
          <div className="h-full">
            <MapPlaceholder selectedUserId={selectedUserId} />
          </div>
        </main>
      </div>
    </div>
  );
}
