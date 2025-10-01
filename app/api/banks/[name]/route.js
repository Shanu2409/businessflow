import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    // Await the params from the context.
    const { name } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");
    // Uncomment and modify the delete operation as needed:
    await Bank.deleteOne({ bank_name: name, group });
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
    await connection(); // Await the params from the context.
    const { name } = await context.params;
    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");
    const { account_number, ifsc_code, bank_name } = await request.json();
    // Convert bank_name to uppercase
    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;
    const uppercaseIFSC = ifsc_code ? ifsc_code.toUpperCase() : ifsc_code;

    // Check if the name is changed and if the new name already exists
    if (uppercaseBankName && uppercaseBankName !== name.toUpperCase()) {
      const existingBank = await Bank.findOne({
        bank_name: uppercaseBankName,
        group,
      });
      if (existingBank) {
        return NextResponse.json(
          { Message: "Bank with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Proceed with update if no duplicate
    await Bank.updateOne(
      { bank_name: name, group },
      {
        $set: {
          account_number,
          ifsc_code: uppercaseIFSC,
          bank_name: uppercaseBankName,
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
