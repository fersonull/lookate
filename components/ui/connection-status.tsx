// Connection Status Component
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff, Server, Database } from "lucide-react";

interface ConnectionStatusProps {
  isWebSocketConnected: boolean;
  isDatabaseConnected: boolean;
  isUsingFallback: boolean;
  className?: string;
}

export function ConnectionStatus({ 
  isWebSocketConnected, 
  isDatabaseConnected, 
  isUsingFallback,
  className = ""
}: ConnectionStatusProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {/* WebSocket Status */}
            <div className="flex items-center gap-2">
              {isWebSocketConnected ? (
                <>
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span className="text-green-600">Real-time</span>
                </>
              ) : isUsingFallback ? (
                <>
                  <Server className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-600">REST Mode</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 text-red-600" />
                  <span className="text-red-600">Connecting...</span>
                </>
              )}
            </div>

            {/* Database Status */}
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Database</span>
            </div>

            {/* Mode Badge */}
            <Badge 
              variant={isWebSocketConnected ? "default" : isUsingFallback ? "secondary" : "destructive"}
              className="text-xs"
            >
              {isWebSocketConnected ? "🟢 Live" : isUsingFallback ? "🔵 REST" : "🔴 Offline"}
            </Badge>
          </div>

          <span className="text-xs text-muted-foreground">
            {isWebSocketConnected 
              ? "Real-time WebSocket" 
              : isUsingFallback 
                ? "REST API Mode" 
                : "Connecting..."
            }
          </span>
        </div>
      </CardContent>
    </Card>
  );
}