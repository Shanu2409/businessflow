import mongoose from "mongoose";

// Singleton for control-plane connection (separate DB)
const globalForControl = (globalThis.__control_db__ =
  globalThis.__control_db__ || {
    conn: null,
    connecting: null,
  });

export async function getControlConn() {
  if (globalForControl.conn) return globalForControl.conn;
  if (globalForControl.connecting) return globalForControl.connecting;

  const uri = process.env.MONGODB_URI_CONTROL;
  if (!uri) throw new Error("MONGODB_URI_CONTROL is not set");

  const conn = mongoose.createConnection(uri, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
  });

  globalForControl.connecting = conn
    .asPromise()
    .then(() => {
      globalForControl.conn = conn;
      globalForControl.connecting = null;
      return conn;
    })
    .catch((err) => {
      globalForControl.connecting = null;
      throw err;
    });

  return globalForControl.connecting;
}

export default getControlConn;
