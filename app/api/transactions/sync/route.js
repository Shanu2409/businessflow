import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import Transaction from "@/models/transaction";
import Website from "@/models/website";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connection();

    // 1. Recalculate bank balances per bank
    const allBanks = await Bank.find({});
    for (const bank of allBanks) {
      const bankFilter = { bank_name: bank.bank_name };
      if (bank.group) bankFilter.group = bank.group;

      const bankTxs = await Transaction.find(bankFilter).sort({ createdAt: 1 });
      if (bankTxs.length === 0) continue;

      let runningBalance =
        typeof bankTxs[0].old_bank_balance === "number"
          ? Number(bankTxs[0].old_bank_balance)
          : Number(bank.current_balance) || 0;

      const bulkOps = [];
      for (const tx of bankTxs) {
        const amount = Number(tx.amount) || 0;
        const type = tx.transaction_type || "Deposit";
        const oldBalance = runningBalance;
        const effectiveBalance =
          type === "Deposit" ? runningBalance + amount : runningBalance - amount;
        runningBalance = effectiveBalance;

        bulkOps.push({
          updateOne: {
            filter: { _id: tx._id },
            update: {
              $set: {
                old_bank_balance: oldBalance,
                effective_balance: effectiveBalance,
              },
            },
          },
        });
      }

      if (bulkOps.length > 0) {
        await Transaction.bulkWrite(bulkOps);
      }

      await Bank.updateOne(
        { _id: bank._id },
        { $set: { current_balance: runningBalance } }
      );
    }

    // 2. Recalculate website balances per website
    const allWebsites = await Website.find({});
    for (const website of allWebsites) {
      const webFilter = { website_name: website.website_name };
      if (website.group) webFilter.group = website.group;

      const webTxs = await Transaction.find(webFilter).sort({ createdAt: 1 });
      if (webTxs.length === 0) continue;

      let runningBalance =
        typeof webTxs[0].old_website_balance === "number"
          ? Number(webTxs[0].old_website_balance)
          : Number(website.current_balance) || 0;

      const bulkOps = [];
      for (const tx of webTxs) {
        const amount = Number(tx.amount) || 0;
        const type = tx.transaction_type || "Deposit";
        const oldBalance = runningBalance;
        const newBalance =
          type === "Deposit" ? runningBalance - amount : runningBalance + amount;
        runningBalance = newBalance;

        bulkOps.push({
          updateOne: {
            filter: { _id: tx._id },
            update: {
              $set: {
                old_website_balance: oldBalance,
                new_website_balance: newBalance,
              },
            },
          },
        });
      }

      if (bulkOps.length > 0) {
        await Transaction.bulkWrite(bulkOps);
      }

      await Website.updateOne(
        { _id: website._id },
        { $set: { current_balance: runningBalance } }
      );
    }

    return NextResponse.json({
      message: "Balances synchronized successfully",
    });
  } catch (err) {
    console.error("Error during syncAllBalances:", err);
    return NextResponse.json(
      { message: "Failed to sync balances", error: err.message },
      { status: 500 }
    );
  }
}
