import { NextResponse } from "next/server";
import {
  getActiveDb,
  setActiveDb,
  isMaintenance,
  setMaintenance,
} from "@/lib/db/control";
import { getConn } from "@/lib/db/active";

export const runtime = "nodejs";

function isAdmin(request) {
  // Basic placeholder: require header x-admin: true
  return request.headers.get("x-admin") === "true";
}

export async function GET() {
  const [activeDb, maintenance] = await Promise.all([
    getActiveDb(),
    isMaintenance(),
  ]);
  return NextResponse.json({ activeDb, maintenance });
}

export async function POST(request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const { target } = await request.json();
    if (!target || !["db1", "db2"].includes(target)) {
      return NextResponse.json({ message: "Invalid target" }, { status: 400 });
    }

    const current = await getActiveDb();
    if (current === target) {
      return NextResponse.json({
        message: "Already active",
        activeDb: current,
      });
    }

    await setMaintenance(true);
    await setActiveDb(target);
    // Warm new connection
    await getConn(target);
    await setMaintenance(false);

    console.log("[db] flip", {
      from: current,
      to: target,
      at: new Date().toISOString(),
    });

    return NextResponse.json({ message: "Switched", activeDb: target });
  } catch (err) {
    await setMaintenance(false);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
