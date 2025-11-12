// MongoDB Session Model
import mongoose, { Schema, Document } from "mongoose";

export interface ISession extends Document {
  _id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  lastActiveAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

const SessionSchema = new Schema<ISession>(
  {
    userId: {
      type: String,
      required: true,
      ref: "User",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    lastActiveAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: false,
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and cleanup
SessionSchema.index({ userId: 1 });
SessionSchema.index({ token: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired sessions
SessionSchema.index({ lastActiveAt: -1 });

export const SessionModel = mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);