import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getTransactionModel } from "@/models/factories/transaction";
import { getBankModel } from "@/models/factories/bank";
import { getWebsiteModel } from "@/models/factories/website";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function DELETE(request, context) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);
    const Bank = getBankModel(conn);
    const Website = getWebsiteModel(conn);

    // Get transaction ID from params
    const { tid } = context.params;

    // Fetch the transaction details before deleting
    const transaction = await Transaction.findById(tid);
    if (!transaction) {
      return NextResponse.json(
        { Message: "Transaction not found" },
        { status: 404 }
      );
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
