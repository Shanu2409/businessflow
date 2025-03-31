import connection from "@/lib/mongodb";
import Account from "@/models/accountUser";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
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
    await connection();

    // Extract params & body
    const { id } = context.params;
    const { password, allowed_banks } = await request.json();

    // Ensure username exists before updating
    const updatedUser = await Account.findOneAndUpdate(
      { username: id },
      { $set: { password, allowed_banks } }
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
