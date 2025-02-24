import connection from "@/lib/mongodb";
import UserModal from "@/models/userModal";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
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
    await connection();

    // Extract params & body
    const { name } = context.params;
    const { email } = await request.json();

    // Ensure username exists before updating
    const updatedUser = await UserModal.findOneAndUpdate(
      { username: name },
      { $set: { email } },
      s
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
