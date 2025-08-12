import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getUserClientModel } from "@/models/factories/userModal";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function DELETE(request, context) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const UserModal = getUserClientModel(conn);
    // Await the params from the context.
    const { name } = await context.params;
    // Uncomment and modify the delete operation as needed:
    await UserModal.deleteOne({ username: name });
    return NextResponse.json({
      Message: `User deleted successfully`,
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
    const UserModal = getUserClientModel(conn);

    // Extract params & body
    const { name } = context.params;
    const { email, active, username, website_name } = await request.json();

    // If username is being changed, check if it already exists
    if (username && username.toUpperCase() !== name.toUpperCase()) {
      const existingUser = await UserModal.findOne({
        username: username.toUpperCase(),
      });

      if (existingUser) {
        return NextResponse.json(
          { Message: "User with this username already exists" },
          { status: 400 }
        );
      }
    }

    // Prepare update data with uppercase conversion for relevant fields
    const updateData = { email, active };
    if (username) updateData.username = username.toUpperCase();
    if (website_name) updateData.website_name = website_name.toUpperCase();

    // Ensure username exists before updating
    const updatedUser = await UserModal.findOneAndUpdate(
      { username: name },
      { $set: updateData }
    );

    if (!updatedUser) {
      return NextResponse.json({ Message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      Message: "User updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
