import { NextResponse } from "next/server";
import { getActiveDb, isMaintenance } from "@/lib/db/control";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [activeDb, maintenance] = await Promise.all([
      getActiveDb(),
      isMaintenance(),
    ]);
    return NextResponse.json({ activeDb, maintenance });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
