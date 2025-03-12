import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import Transaction from "@/models/transaction";
import Website from "@/models/website";
import { NextResponse, NextRequest } from "next/server";

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
    } = await request.json();

    // Ensure amount is a number
    const numericAmount = Number(amount);

    // Fetch bank and website balances
    const bank = await Bank.findOne({ bank_name }, { current_balance: 1 });
    const website = await Website.findOne(
      { website_name },
      { current_balance: 1 }
    );

    // Ensure fetched balances are numbers
    const bankBalance = bank ? Number(bank.current_balance) : 0;

    // Perform transaction updates
    if (transaction_type === "Deposit") {
      await Bank.updateOne(
        { bank_name },
        {
          $inc: { current_balance: numericAmount },
          $set: { check: false }, // Corrected placement
        },
        { upsert: false }
      );

      await Website.updateOne(
        { website_name },
        { $inc: { current_balance: -numericAmount } },
        { upsert: false }
      );
    } else if (transaction_type === "Withdraw") {
      await Bank.updateOne(
        { bank_name },
        {
          $inc: { current_balance: -numericAmount },
          $set: { check: false }, // Corrected placement
        },
        { upsert: false }
      );

      await Website.updateOne(
        { website_name },
        { $inc: { current_balance: numericAmount } },
        { upsert: false }
      );
    }

    // Calculate the new balances dynamically
    const newBankBalance =
      transaction_type === "Deposit"
        ? bankBalance + numericAmount
        : bankBalance - numericAmount;

    // Save transaction with calculated balances
    const newTransaction = new Transaction({
      bank_name,
      username,
      website_name,
      transaction_type,
      old_bank_balance: bankBalance,
      effective_balance: newBankBalance, // Use calculated value
      amount: numericAmount,
      created_by,
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

    await connection();

    const query = {
      $or: [
        { bank_name: { $regex: search, $options: "i" } },
        { website_name: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ],
    };

    // Get the total count of documents matching the query
    const totalData = await Transaction.countDocuments(query);

    // Get paginated bank data
    const banks = await Transaction.find(query, {
      __v: 0,
      old_website_balance: 0,
      new_website_balance: 0,
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

    await connection();

    const result = await Transaction.updateMany(
      { _id: tid },
      { $set: { [field]: value } }
    );

    return NextResponse.json({ Message: "Data updated successfully" });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
