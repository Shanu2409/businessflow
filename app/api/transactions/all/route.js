import { NextResponse } from "next/server";
import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getTransactionModel } from "@/models/factories/transaction";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { list, label, value } = body;

    // Validate request data
    if (!list || !Array.isArray(list) || list.length === 0) {
      return NextResponse.json(
        { error: "Invalid or empty list provided" },
        { status: 400 }
      );
    }

    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { error: "Invalid label provided" },
        { status: 400 }
      );
    }

    if (value === undefined) {
      return NextResponse.json(
        { error: "Value must be provided" },
        { status: 400 }
      );
    }

    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);

    // Update all documents that match the IDs in the list
    const result = await Transaction.updateMany(
      {
        _id: {
          $in: list.map((id) => (typeof id === "string" ? id : id.toString())),
        },
      },
      { $set: { [label]: value } }
    );

    // Return response with update stats
    return NextResponse.json({
      success: true,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      message: `Updated ${result.modifiedCount} of ${result.matchedCount} matching transactions`,
    });
  } catch (error) {
    console.error("Error updating transactions:", error);
    return NextResponse.json(
      { error: "Failed to update transactions" },
      { status: 500 }
    );
  }
}
