import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getAccountModel } from "@/models/factories/accountUser";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function DELETE(request, context) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Account = getAccountModel(conn);
    // Await the params from the context.
    const { id } = await context.params;
    // Uncomment and modify the delete operation as needed:
    await Account.deleteOne({ username: id });
    return NextResponse.json({
      Message: `Account deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Account = getAccountModel(conn);

    // Extract params & body
    const { id } = context.params;
    const { password } = await request.json();

    // Ensure username exists before updating
    const updatedUser = await Account.findOneAndUpdate(
      { username: id },
      { $set: { password } }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { Message: "Account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      Message: "Account updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
