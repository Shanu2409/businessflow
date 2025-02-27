import connection from "@/lib/mongodb";
import Transaction from "@/models/transaction";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    // Await the params from the context.
    const { tid } = await context.params;
    // Uncomment and modify the delete operation as needed:
    await Transaction.deleteOne({ _id: tid });
    return NextResponse.json({
      Message: `Transaction deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
