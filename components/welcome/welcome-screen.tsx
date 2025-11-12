"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthModal } from "@/components/auth/auth-modal";
import { MapPin, Users, Shield, Zap, Globe, Clock } from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: <Users className="h-5 w-5" />,
      title: "Real-Time Presence",
      description: "See who's online and where they are located instantly"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      title: "Location Sharing",
      description: "Share your approximate location with team members"
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: "Live Updates",
      description: "Get notified when team members come online or change location"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Privacy First",
      description: "Only approximate location data is shared, never exact addresses"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="p-2 sm:p-3 bg-primary rounded-full">
              <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">lookate</h1>
          </div>
          
          <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-3 sm:mb-4">
            Real-Time User Presence Tracker
          </h2>
          
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl lg:max-w-2xl mx-auto mb-6 sm:mb-8">
            Connect with your team members and see where everyone is located in real-time. 
            Perfect for distributed teams, events, and collaborative work.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mb-6 sm:mb-8">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <Globe className="h-3 w-3 mr-1" />
              Global Coverage
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <Clock className="h-3 w-3 mr-1" />
              Real-Time Updates
            </Badge>
            <Badge variant="secondary" className="text-xs sm:text-sm">
              <Shield className="h-3 w-3 mr-1" />
              Privacy Protected
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
            <Button
              size="lg"
              onClick={() => onGetStarted ? onGetStarted() : setShowAuthModal(true)}
              className="text-sm sm:text-base lg:text-lg px-6 sm:px-8"
            >
              {onGetStarted ? "Try Demo" : "Get Started"}
              <MapPin className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-sm sm:text-base lg:text-lg px-6 sm:px-8"
              onClick={() => setShowAuthModal(true)}
            >
              Sign Up
              <Users className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </div>
        </div>

        {/* Features Grid - responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="mx-auto mb-2 p-2 bg-primary/10 rounded-full w-fit">
                  {feature.icon}
                </div>
                <CardTitle className="text-base sm:text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Demo Preview - responsive sizing */}
        <Card className="max-w-full sm:max-w-3xl lg:max-w-4xl mx-auto">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-center text-lg sm:text-xl">Live Map Preview</CardTitle>
            <CardDescription className="text-center text-sm">
              See how team locations appear on the interactive map
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-48 sm:h-56 lg:h-64 bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary mx-auto mb-2 animate-pulse" />
                  <p className="text-muted-foreground text-sm sm:text-base">Interactive map with live user markers</p>
                </div>
              </div>
              
              {/* Sample markers - responsive sizing */}
              <div className="absolute top-1/4 left-1/4 bg-red-500 text-white p-1 rounded-full animate-bounce">
                <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
              </div>
              <div className="absolute top-1/3 right-1/3 bg-blue-500 text-white p-1 rounded-full animate-bounce" style={{ animationDelay: "0.5s" }}>
                <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
              </div>
              <div className="absolute bottom-1/3 left-1/2 bg-green-500 text-white p-1 rounded-full animate-bounce" style={{ animationDelay: "1s" }}>
                <MapPin className="h-2 w-2 sm:h-3 sm:w-3" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer - responsive spacing */}
        <div className="text-center mt-8 sm:mt-12 text-xs sm:text-sm text-muted-foreground">
          <p>Built with Next.js 15, TypeScript, and shadcn/ui</p>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}