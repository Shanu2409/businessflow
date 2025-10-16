import connection from "@/lib/mongodb";
import Account from "@/models/accountUser";
import Bank from "@/models/bank";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    // Await the params from the context.
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    // Uncomment and modify the delete operation as needed:
    await Account.deleteOne({ username: id, group });
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
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    const { password } = await request.json();

    // Fetch all banks for this group
    const allBanks = await Bank.distinct("bank_name", { group });

    // Ensure username exists before updating
    const updatedUser = await Account.findOneAndUpdate(
      { username: id, group },
      { $set: { password, allowed_banks: allBanks } }
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
