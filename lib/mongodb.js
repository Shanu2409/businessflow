// Deprecated: use lib/db/active.js and control helpers instead.
export default async function connection() {
  throw new Error(
    "Deprecated mongodb.js used. Switch routes to use lib/db/active and model factories."
  );
}
