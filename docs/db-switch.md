# Database switch runbook

This app supports flipping the active MongoDB between `db1` and `db2` via a control-plane collection in a separate `control` database.

## Keys

- `activeDb`: `db1` | `db2`
- `maintenance`: `"1"` | `"0"`

## Flip steps

1. Enable maintenance: `setMaintenance(true)`
2. Set active DB to target: `setActiveDb("db1" | "db2")`
3. Warm connection: `await getConn(target)`
4. Disable maintenance: `setMaintenance(false)`

## Endpoints

- `GET /api/health` → `{ activeDb, maintenance }`
- `POST /api/admin/active-db` body `{ target: "db1"|"db2" }` (auth required)

## UI

Visit `/admin/db-switch` to flip. The page shows the current DB and maintenance flag.

## Troubleshooting

- 503 on writes: Maintenance is on. Wait for it to turn off.
- Model errors: Ensure routes use model factories bound to the connection returned by `getConn(active)`.
- Edge runtime errors: Ensure routes that use Mongoose export `export const runtime = "nodejs";`.
