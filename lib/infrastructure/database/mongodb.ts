// MongoDB Connection
import mongoose from "mongoose";

interface GlobalMongoDB {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongodb: GlobalMongoDB | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Environment variables:", { 
    NODE_ENV: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGODB_URI 
  });
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

console.log("MongoDB URI found:", MONGODB_URI.substring(0, 50) + "...");

let cached = global.mongodb || { conn: null, promise: null };

if (!global.mongodb) {
  global.mongodb = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}