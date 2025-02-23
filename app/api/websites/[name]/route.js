import connection from "@/lib/mongodb";
import Website from "@/models/website";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    // Await the params from the context.
    const { name } = await context.params;
    // Uncomment and modify the delete operation as needed:
    await Website.deleteOne({ website_name: name });
    return NextResponse.json({
      Message: `Website deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    await connection();
    // Await the params from the context.
    const { name } = await context.params;
    const { account_number, url } = await request.json();
    // Uncomment and modify the update operation as needed:
    await Website.updateOne(
      { website_name: name },
      {
        $set: {
          account_number,
          url,
        },
      }
    );
    return NextResponse.json({
      Message: `Website account updated successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
