// WebSocket Server for Real-Time Updates
import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import { MongooseUserRepository } from "../database/repository/mongoose-user-repository";
import { MongooseLocationRepository } from "../database/repository/mongoose-location-repository";

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userName?: string;
}

interface UserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  socketId: string;
  lastSeen: Date;
  isOnline: boolean;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private userRepository = new MongooseUserRepository();
  private locationRepository = new MongooseLocationRepository();
  private connectedUsers = new Map<string, UserPresence>();

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    this.io.use(async (socket: any, next) => {
      try {
        // Authenticate socket connection
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error("No token provided");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await this.userRepository.findById(decoded.userId);
        
        if (!user) {
          throw new Error("User not found");
        }

        socket.userId = user.id;
        socket.userName = user.name;
        next();
      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    this.io.on("connection", (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.userName} connected (${socket.id})`);
      
      this.handleUserConnection(socket);
      this.setupEventListeners(socket);
    });

    return this.io;
  }

  private async handleUserConnection(socket: AuthenticatedSocket) {
    if (!socket.userId || !socket.userName) return;

    // Add user to connected users
    const userPresence: UserPresence = {
      userId: socket.userId,
      userName: socket.userName,
      socketId: socket.id,
      lastSeen: new Date(),
      isOnline: true,
    };

    this.connectedUsers.set(socket.userId, userPresence);

    // Update user's last active time in database
    await this.userRepository.update(socket.userId, {
      updatedAt: new Date(),
    });

    // Join user-specific room for targeted messages
    socket.join(`user:${socket.userId}`);

    // Broadcast user came online
    socket.broadcast.emit("user:online", {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date(),
    });

    // Send current active users to the new user
    const activeUserLocations = await this.locationRepository.findActiveUserLocations();
    socket.emit("locations:initial", activeUserLocations);

    // Send list of currently connected users
    const connectedUsersList = Array.from(this.connectedUsers.values());
    socket.emit("users:connected", connectedUsersList);
  }

  private setupEventListeners(socket: AuthenticatedSocket) {
    // Handle location updates
    socket.on("location:update", async (locationData) => {
      if (!socket.userId) return;

      try {
        // Update location in database via use case
        const updateResult = await this.updateUserLocation(socket.userId, locationData);
        
        if (updateResult.success) {
          // Broadcast location update to all other users
          socket.broadcast.emit("location:updated", {
            userId: socket.userId,
            userName: socket.userName,
            location: locationData,
            timestamp: new Date(),
          });

          socket.emit("location:update:success", { success: true });
        } else {
          socket.emit("location:update:error", { error: updateResult.error });
        }
      } catch (error) {
        console.error("Location update error:", error);
        socket.emit("location:update:error", { error: "Failed to update location" });
      }
    });

    // Handle heartbeat for presence
    socket.on("heartbeat", async () => {
      if (!socket.userId) return;

      const userPresence = this.connectedUsers.get(socket.userId);
      if (userPresence) {
        userPresence.lastSeen = new Date();
        this.connectedUsers.set(socket.userId, userPresence);
      }

      // Update database
      await this.userRepository.update(socket.userId, {
        updatedAt: new Date(),
      });
    });

    // Handle user typing/activity indicators
    socket.on("user:activity", (activityData) => {
      socket.broadcast.emit("user:activity", {
        userId: socket.userId,
        userName: socket.userName,
        activity: activityData,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      this.handleUserDisconnection(socket);
    });
  }

  private async handleUserDisconnection(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    console.log(`User ${socket.userName} disconnected (${socket.id})`);

    // Remove from connected users
    this.connectedUsers.delete(socket.userId);

    // Broadcast user went offline
    socket.broadcast.emit("user:offline", {
      userId: socket.userId,
      userName: socket.userName,
      timestamp: new Date(),
    });

    // Update last seen in database
    await this.userRepository.update(socket.userId, {
      updatedAt: new Date(),
    });
  }

  private async updateUserLocation(userId: string, locationData: any) {
    // Use the same use case as the REST API
    const { UpdateLocationUseCase } = await import("@/lib/application/use-cases/update-location");
    const updateLocationUseCase = new UpdateLocationUseCase(
      this.locationRepository,
      this.userRepository
    );

    return await updateLocationUseCase.execute({
      userId,
      location: locationData,
    });
  }

  // Public methods for external use
  public broadcastToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user:${userId}`).emit(event, data);
    }
  }

  public broadcastToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public getConnectedUsers(): UserPresence[] {
    return Array.from(this.connectedUsers.values());
  }

  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

export const socketService = new SocketService();