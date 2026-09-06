import mongoose from "mongoose";

const MONGODB_URI =
  process.env.NEXT_PUBLIC_MONGODB_URI || process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connection = async () => {
  if (!MONGODB_URI) {
    throw new Error("Please define NEXT_PUBLIC_MONGODB_URI environment variable");
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise || mongoose.connection.readyState === 0) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("Connected to MongoDB ---------------------------");
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;
    console.error("MongoDB connection error:", error);
    throw error;
  }

  return cached.conn;
};

export default connection;
