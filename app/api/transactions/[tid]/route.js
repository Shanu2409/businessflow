import connection from "@/lib/mongodb";
import Transaction from "@/models/transaction";
import Bank from "@/models/bank";
import Website from "@/models/website";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
  try {
    await connection();

    const { tid } = await context.params;

    const transaction = await Transaction.findById(tid);
    if (!transaction) {
      return NextResponse.json(
        { Message: "Transaction not found" },
        { status: 404 }
      );
    }

    const { bank_name, website_name, transaction_type, amount, group, created_by } =
      transaction;

    const numericAmount = Number(amount);

    // Try finding exact bank & website matching created_by
    const bankFilter = { bank_name, group };
    if (created_by) bankFilter.created_by = created_by;

    const websiteFilter = { website_name, group };
    if (created_by) websiteFilter.created_by = created_by;

    if (transaction_type === "Deposit") {
      await Bank.updateOne(
        bankFilter,
        { $inc: { current_balance: -numericAmount } }
      );
      await Website.updateOne(
        websiteFilter,
        { $inc: { current_balance: numericAmount } }
      );
    } else if (transaction_type === "Withdraw") {
      await Bank.updateOne(
        bankFilter,
        { $inc: { current_balance: numericAmount } }
      );
      await Website.updateOne(
        websiteFilter,
        { $inc: { current_balance: -numericAmount } }
      );
    }

    await Transaction.deleteOne({ _id: tid, group });

    return NextResponse.json({
      Message: "Transaction reversed and deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
