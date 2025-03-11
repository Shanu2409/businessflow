import connection from "@/lib/mongodb";
import Transaction from "@/models/transaction";
import Bank from "@/models/bank";
import Website from "@/models/website";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();
    
    // Get transaction ID from params
    const { tid } = context.params;

    // Fetch the transaction details before deleting
    const transaction = await Transaction.findById(tid);
    if (!transaction) {
      return NextResponse.json({ Message: "Transaction not found" }, { status: 404 });
    }

    const { bank_name, website_name, transaction_type, amount } = transaction;

    // Convert amount to a number to ensure calculations are correct
    const numericAmount = Number(amount);

    // Reverse the transaction effect
    if (transaction_type === "Deposit") {
      // If it was a deposit, subtract the amount from the bank and add back to the website
      await Bank.updateOne(
        { bank_name },
        { $inc: { current_balance: -numericAmount } }
      );
      await Website.updateOne(
        { website_name },
        { $inc: { current_balance: numericAmount } }
      );
    } else if (transaction_type === "Withdraw") {
      // If it was a withdraw, add the amount back to the bank and subtract from the website
      await Bank.updateOne(
        { bank_name },
        { $inc: { current_balance: numericAmount } }
      );
      await Website.updateOne(
        { website_name },
        { $inc: { current_balance: -numericAmount } }
      );
    }

    // Now delete the transaction
    await Transaction.deleteOne({ _id: tid });

    return NextResponse.json({
      Message: "Transaction reversed and deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
