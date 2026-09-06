import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import Transaction from "@/models/transaction";
import Website from "@/models/website";
import { NextResponse } from "next/server";

let hasSynced = false;
let isSyncing = false;

async function syncAllBalances() {
  if (hasSynced || isSyncing) return;
  isSyncing = true;
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

    hasSynced = true;
  } catch (err) {
    console.error("Error during syncAllBalances:", err);
  } finally {
    isSyncing = false;
  }
}

export async function POST(request) {
  try {
    await connection();

    const {
      username,
      website_name,
      bank_name,
      transaction_type,
      created_by,
      amount,
      group,
    } = await request.json();

    const uppercaseUsername = username ? username.toUpperCase() : username;
    const uppercaseWebsiteName = website_name
      ? website_name.toUpperCase()
      : website_name;
    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;
    const uppercaseCreatedBy = created_by
      ? created_by.toUpperCase()
      : created_by;

    const numericAmount = Number(amount);

    if (!group) {
      return NextResponse.json(
        { message: "Group is required" },
        { status: 400 }
      );
    }
    if (!uppercaseCreatedBy) {
      return NextResponse.json(
        { message: "Created by user is required" },
        { status: 400 }
      );
    }

    // Fetch bank and website balances specifically for this creator & group
    let bank = await Bank.findOne({
      bank_name: uppercaseBankName,
      group,
      created_by: uppercaseCreatedBy,
    });

    if (!bank) {
      bank = await Bank.findOne({
        bank_name: uppercaseBankName,
        group,
      });
    }

    let website = await Website.findOne({
      website_name: uppercaseWebsiteName,
      group,
      created_by: uppercaseCreatedBy,
    });

    if (!website) {
      website = await Website.findOne({
        website_name: uppercaseWebsiteName,
        group,
      });
    }

    const bankBalance = bank ? Number(bank.current_balance) : 0;
    const websiteBalance = website ? Number(website.current_balance) : 0;

    // Perform transaction balance updates directly by _id
    if (bank) {
      const bankInc =
        transaction_type === "Deposit" ? numericAmount : -numericAmount;
      await Bank.updateOne(
        { _id: bank._id },
        {
          $inc: { current_balance: bankInc },
          $set: { check: false },
        }
      );
    }

    if (website) {
      const websiteInc =
        transaction_type === "Deposit" ? -numericAmount : numericAmount;
      await Website.updateOne(
        { _id: website._id },
        {
          $inc: { current_balance: websiteInc },
        }
      );
    }

    const newBankBalance =
      transaction_type === "Deposit"
        ? bankBalance + numericAmount
        : bankBalance - numericAmount;

    const newWebsiteBalance =
      transaction_type === "Deposit"
        ? websiteBalance - numericAmount
        : websiteBalance + numericAmount;

    const newTransaction = new Transaction({
      bank_name: uppercaseBankName,
      username: uppercaseUsername,
      website_name: uppercaseWebsiteName,
      transaction_type,
      old_bank_balance: bankBalance,
      effective_balance: newBankBalance,
      old_website_balance: websiteBalance,
      new_website_balance: newWebsiteBalance,
      amount: numericAmount,
      created_by: uppercaseCreatedBy,
      group,
    });

    await newTransaction.save();

    return NextResponse.json({
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || 20);
    const sort = searchParams.get("sort") || "-createdAt";
    const page = parseInt(searchParams.get("page") || 1);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");
    const group = searchParams.get("group");
    const userType = searchParams.get("userType") || "user";
    const createdBy = searchParams.get("createdBy") || searchParams.get("created_by") || "";

    await connection();

    // Auto-sync historical transaction balances once if needed
    if (!hasSynced) {
      await syncAllBalances();
    }

    const uppercaseSearch = search ? search.toUpperCase() : "";

    const query = {
      group,
      $or: [
        { bank_name: { $regex: uppercaseSearch } },
        { website_name: { $regex: uppercaseSearch } },
        { username: { $regex: uppercaseSearch } },
      ],
    };

    if (userType === "user" && createdBy) {
      query.created_by = createdBy.toUpperCase();
    } else if (userType === "admin" && createdBy) {
      query.created_by = createdBy.toUpperCase();
    }

    if (startDate) {
      const startDateTime = startTime
        ? `${startDate}T${startTime}:00`
        : `${startDate}T00:00:00`;
      query.createdAt = { $gte: new Date(startDateTime) };
    }

    if (endDate) {
      const endDateTime = endTime
        ? `${endDate}T${endTime}:00`
        : `${endDate}T23:59:59`;
      query.createdAt = { ...query.createdAt, $lte: new Date(endDateTime) };
    }

    const totalData = await Transaction.countDocuments(query);

    const transactions = await Transaction.find(query, {
      __v: 0,
    })
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);

    // Compute running balances per bank and website independently
    try {
      // Create chronological copy (oldest first)
      const chronological = [...transactions].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      const bankLastEffective = new Map();
      const websiteLastEffective = new Map();
      const balanceMap = new Map();

      for (let i = 0; i < chronological.length; i++) {
        const tx = chronological[i];
        const bankKey = tx.bank_name || "UNKNOWN";
        const websiteKey = tx.website_name || "UNKNOWN";
        const amount = Number(tx.amount) || 0;
        const type = tx.transaction_type || "Deposit";

        // Bank balance calculation (strictly isolated by bank_name)
        let bankCurrent = null;
        if (!bankLastEffective.has(bankKey)) {
          if (typeof tx.old_bank_balance === "number") {
            bankCurrent = Number(tx.old_bank_balance);
          } else if (typeof tx.effective_balance === "number") {
            bankCurrent =
              type === "Deposit"
                ? Number(tx.effective_balance) - amount
                : Number(tx.effective_balance) + amount;
          } else {
            bankCurrent = 0;
          }
        } else {
          bankCurrent = bankLastEffective.get(bankKey);
        }

        const bankEffective =
          type === "Deposit" ? bankCurrent + amount : bankCurrent - amount;
        bankLastEffective.set(bankKey, bankEffective);

        // Website balance calculation (strictly isolated by website_name)
        let websiteCurrent = null;
        if (!websiteLastEffective.has(websiteKey)) {
          if (typeof tx.old_website_balance === "number") {
            websiteCurrent = Number(tx.old_website_balance);
          } else if (typeof tx.new_website_balance === "number") {
            websiteCurrent =
              type === "Deposit"
                ? Number(tx.new_website_balance) + amount
                : Number(tx.new_website_balance) - amount;
          } else {
            websiteCurrent = 0;
          }
        } else {
          websiteCurrent = websiteLastEffective.get(websiteKey);
        }

        const websiteEffective =
          type === "Deposit"
            ? websiteCurrent - amount
            : websiteCurrent + amount;
        websiteLastEffective.set(websiteKey, websiteEffective);

        balanceMap.set(String(tx._id), {
          bankCurrent,
          bankEffective,
          websiteCurrent,
          websiteEffective,
        });
      }

      // Attach computed balances back to original transactions array
      const transactionsWithRunning = transactions.map((tx) => {
        const key = String(tx._id);
        if (balanceMap.has(key)) {
          const {
            bankCurrent,
            bankEffective,
            websiteCurrent,
            websiteEffective,
          } = balanceMap.get(key);
          return {
            ...tx.toObject(),
            old_bank_balance: bankCurrent,
            effective_balance: bankEffective,
            old_website_balance: websiteCurrent,
            new_website_balance: websiteEffective,
          };
        }
        return tx;
      });

      return NextResponse.json({ data: transactionsWithRunning, totalData });
    } catch (err) {
      console.error("Running balance compute error:", err);
      return NextResponse.json({ data: transactions, totalData });
    }
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const field = searchParams.get("field") || "";
    const value = searchParams.get("value") || "";
    const tid = searchParams.get("tid") || "";

    await connection();

    let valueToUpdate = value;
    if (
      ["bank_name", "username", "website_name", "created_by"].includes(field)
    ) {
      valueToUpdate = value.toUpperCase();
    }

    const result = await Transaction.updateMany(
      { _id: tid },
      { $set: { [field]: valueToUpdate } }
    );

    if (["amount", "transaction_type", "bank_name", "website_name"].includes(field)) {
      hasSynced = false;
    }

    return NextResponse.json({ Message: "Data updated successfully", result });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
