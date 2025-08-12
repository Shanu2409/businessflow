import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getBankModel } from "@/models/factories/bank";
import { getTransactionModel } from "@/models/factories/transaction";
import { getWebsiteModel } from "@/models/factories/website";
import { NextResponse, NextRequest } from "next/server";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ message: "Maintenance" }, { status: 503 });
    }

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Bank = getBankModel(conn);
    const Website = getWebsiteModel(conn);
    const Transaction = getTransactionModel(conn);

    const {
      username,
      website_name,
      bank_name,
      transaction_type,
      created_by,
      amount,
    } = await request.json();

    // Ensure all names are uppercase for consistency
    const uppercaseUsername = username ? username.toUpperCase() : username;
    const uppercaseWebsiteName = website_name
      ? website_name.toUpperCase()
      : website_name;
    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;
    const uppercaseCreatedBy = created_by
      ? created_by.toUpperCase()
      : created_by;

    // Ensure amount is a number
    const numericAmount = Number(amount);

    // Fetch bank and website balances
    const bank = await Bank.findOne(
      { bank_name: uppercaseBankName },
      { current_balance: 1 }
    );
    const website = await Website.findOne(
      { website_name: uppercaseWebsiteName },
      { current_balance: 1 }
    );

    // Ensure fetched balances are numbers
    const bankBalance = bank ? Number(bank.current_balance) : 0;
    const websiteBalance = website ? Number(website.current_balance) : 0;

    // Perform transaction updates
    if (transaction_type === "Deposit") {
      await Bank.updateOne(
        { bank_name: uppercaseBankName },
        {
          $inc: { current_balance: numericAmount },
          $set: { check: false }, // Corrected placement
        },
        { upsert: false }
      );

      await Website.updateOne(
        { website_name: uppercaseWebsiteName },
        { $inc: { current_balance: -numericAmount } },
        { upsert: false }
      );
    } else if (transaction_type === "Withdraw") {
      await Bank.updateOne(
        { bank_name: uppercaseBankName },
        {
          $inc: { current_balance: -numericAmount },
          $set: { check: false }, // Corrected placement
        },
        { upsert: false }
      );

      await Website.updateOne(
        { website_name: uppercaseWebsiteName },
        { $inc: { current_balance: numericAmount } },
        { upsert: false }
      );
    }

    // Calculate the new balances dynamically
    const newBankBalance =
      transaction_type === "Deposit"
        ? bankBalance + numericAmount
        : bankBalance - numericAmount;

    const newWebsiteBalance =
      transaction_type === "Deposit"
        ? websiteBalance - numericAmount
        : websiteBalance + numericAmount;

    // Save transaction with calculated balances
    const newTransaction = new Transaction({
      bank_name: uppercaseBankName,
      username: uppercaseUsername,
      website_name: uppercaseWebsiteName,
      transaction_type,
      old_bank_balance: bankBalance,
      effective_balance: newBankBalance, // Use calculated value
      old_website_balance: websiteBalance,
      new_website_balance: newWebsiteBalance, // Use calculated value
      amount: numericAmount,
      created_by: uppercaseCreatedBy,
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

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);

    // Convert search term to uppercase for consistent searching
    const uppercaseSearch = search ? search.toUpperCase() : "";

    const query = {
      $or: [
        { bank_name: { $regex: uppercaseSearch } },
        { website_name: { $regex: uppercaseSearch } },
        { username: { $regex: uppercaseSearch } },
      ],
    };

    // Add date-time filtering if provided
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

    // Get the total count of documents matching the query
    const totalData = await Transaction.countDocuments(query);

    // Get paginated bank data
    const banks = await Transaction.find(query, {
      __v: 0,
    })
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: banks, totalData });
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

    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);

    // Convert values to uppercase for relevant fields
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

    return NextResponse.json({ Message: "Data updated successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);
    const result = await Transaction.deleteMany({});
    return NextResponse.json({
      Message: `Pruned transactions: ${result.deletedCount}`,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
