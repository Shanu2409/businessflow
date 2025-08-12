import mongoose from "mongoose";

const globalActive = (globalThis.__active_db__ = globalThis.__active_db__ || {
  key: null,
  conn: null,
  connecting: null,
});

function uriForKey(key) {
  if (key === "db1") return process.env.MONGODB_URI_DB1;
  if (key === "db2") return process.env.MONGODB_URI_DB2;
  throw new Error(`Unknown DB key: ${key}`);
}

export async function getConn(activeKey) {
  if (!activeKey) throw new Error("activeKey is required");

  if (globalActive.key === activeKey && globalActive.conn) {
    return globalActive.conn;
  }

  if (globalActive.connecting) {
    try {
      const c = await globalActive.connecting;
      if (globalActive.key === activeKey) return c;
    } catch (_) {}
  }

  const uri = uriForKey(activeKey);
  if (!uri) throw new Error(`Missing Mongo URI for ${activeKey}`);

  const nextConn = mongoose.createConnection(uri, { maxPoolSize: 10 });

  const promise = nextConn
    .asPromise()
    .then(async () => {
      const prev = globalActive.conn;
      const prevKey = globalActive.key;

      globalActive.conn = nextConn;
      globalActive.key = activeKey;
      globalActive.connecting = null;

      if (prev && prev !== nextConn) {
        try {
          await prev.close();
        } catch (_) {}
        console.info("[db] switched", { from: prevKey, to: activeKey });
      }

      return nextConn;
    })
    .catch((err) => {
      globalActive.connecting = null;
      throw err;
    });

  globalActive.connecting = promise;
  return promise;
}

export function currentKey() {
  return globalActive.key;
}

export default { getConn, currentKey };
