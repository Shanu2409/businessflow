import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    // Get params from context
    const { name } = context.params;
    
    // Check if force delete is requested
    const url = new URL(request.url);
    const forceDelete = url.searchParams.get('force') === 'true';
    
    // Import Transaction model at the top level to prevent circular dependencies
    const Transaction = mongoose.models.transactions || 
      require('@/models/transaction').default;
    
    // Check if any transactions reference this bank (unless force delete)
    if (!forceDelete) {
      const transactionsCount = await Transaction.countDocuments({ bank_name: name });
      
      if (transactionsCount > 0) {
        return NextResponse.json({
          Message: `Cannot delete bank - it has ${transactionsCount} associated transactions`
        }, { status: 400 });
      }
    }
    
    // Delete the bank
    const result = await Bank.deleteOne({ bank_name: name });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({
        Message: "Bank not found"
      }, { status: 404 });
    }
    
    return NextResponse.json({
      Message: forceDelete 
        ? `Bank account force deleted successfully` 
        : `Bank account deleted successfully`,
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
    const { account_number, ifsc_code, bank_name, current_balance } = await request.json();
    // Convert bank_name to uppercase
    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;
    const uppercaseIFSC = ifsc_code ? ifsc_code.toUpperCase() : ifsc_code;
    // Ensure current_balance is at least 0
    const balance = current_balance !== "" ? parseFloat(current_balance) : 0;

    // Check if the name is changed and if the new name already exists
    if (uppercaseBankName && uppercaseBankName !== name.toUpperCase()) {
      const existingBank = await Bank.findOne({ bank_name: uppercaseBankName });
      if (existingBank) {
        return NextResponse.json(
          { Message: "Bank with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Proceed with update if no duplicate
    await Bank.updateOne(
      { bank_name: name },
      {
        $set: {
          account_number,
          ifsc_code: uppercaseIFSC,
          bank_name: uppercaseBankName,
          current_balance: balance,
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
