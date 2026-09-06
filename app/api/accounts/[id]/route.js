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
    const userType = searchParams.get("userType") || "user";
    const createdBy =
      searchParams.get("createdBy") || searchParams.get("created_by") || "";

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    const filter = { username: id, group };

    // If caller is a regular user, verify account was created by or parented to this user
    if (userType === "user" && createdBy) {
      const creatorUpper = createdBy.toUpperCase();
      filter.$or = [
        { created_by: creatorUpper },
        { parent_user: creatorUpper },
      ];
    }

    const result = await Account.deleteOne(filter);
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { Message: "Account not found or access denied" },
        { status: 404 }
      );
    }

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
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");
    const userType = searchParams.get("userType") || "user";
    const createdBy =
      searchParams.get("createdBy") || searchParams.get("created_by") || "";

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    const { password } = await request.json();

    const filter = { username: id, group };

    // If caller is a regular user, verify account was created by or parented to this user
    if (userType === "user" && createdBy) {
      const creatorUpper = createdBy.toUpperCase();
      filter.$or = [
        { created_by: creatorUpper },
        { parent_user: creatorUpper },
      ];
    }

    // Fetch banks for this group / creator
    const bankFilter = { group };
    if (userType === "user" && createdBy) {
      bankFilter.created_by = createdBy.toUpperCase();
    }
    let allBanks = await Bank.distinct("bank_name", bankFilter);
    if (allBanks.length === 0) {
      allBanks = await Bank.distinct("bank_name", { group });
    }

    // Ensure account exists and matches permission before updating
    const updatedUser = await Account.findOneAndUpdate(
      filter,
      { $set: { password, allowed_banks: allBanks } },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { Message: "Account not found or access denied" },
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
