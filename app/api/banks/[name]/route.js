import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    // Await the params from the context.
    const { name } = await context.params;
    // Uncomment and modify the delete operation as needed:
    await Bank.deleteOne({ bank_name: name });
    return NextResponse.json({
      Message: `Bank account deleted successfully`,
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
    const { account_number, ifsc_code, bank_name } = await request.json();
    // Uncomment and modify the update operation as needed:
    await Bank.updateOne(
      { bank_name: name },
      {
        $set: {
          account_number,
          ifsc_code,
          bank_name,
        },
      }
    );
    return NextResponse.json({
      Message: `Bank account updated successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
