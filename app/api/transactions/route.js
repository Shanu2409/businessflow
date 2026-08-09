import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import Transaction from "@/models/transaction";
import Website from "@/models/website";
import { NextResponse } from "next/server";

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
    let bank = await Bank.findOne(
      { bank_name: uppercaseBankName, group, created_by: uppercaseCreatedBy },
      { current_balance: 1 }
    );

    let website = await Website.findOne(
      { website_name: uppercaseWebsiteName, group, created_by: uppercaseCreatedBy },
      { current_balance: 1 }
    );

    // Fallback: If admin is operating without matching created_by, match by bank_name & group
    if (!bank) {
      bank = await Bank.findOne(
        { bank_name: uppercaseBankName, group },
        { current_balance: 1, created_by: 1 }
      );
    }
    if (!website) {
      website = await Website.findOne(
        { website_name: uppercaseWebsiteName, group },
        { current_balance: 1, created_by: 1 }
      );
    }

    const bankBalance = bank ? Number(bank.current_balance) : 0;
    const websiteBalance = website ? Number(website.current_balance) : 0;

    const targetCreator = bank ? bank.created_by : uppercaseCreatedBy;

    // Perform transaction balance updates
    if (transaction_type === "Deposit") {
      await Bank.updateOne(
        { bank_name: uppercaseBankName, group, created_by: targetCreator },
        {
          $inc: { current_balance: numericAmount },
          $set: { check: false },
        }
      );

      await Website.updateOne(
        { website_name: uppercaseWebsiteName, group, created_by: targetCreator },
        { $inc: { current_balance: -numericAmount } }
      );
    } else if (transaction_type === "Withdraw") {
      await Bank.updateOne(
        { bank_name: uppercaseBankName, group, created_by: targetCreator },
        {
          $inc: { current_balance: -numericAmount },
          $set: { check: false },
        }
      );

      await Website.updateOne(
        { website_name: uppercaseWebsiteName, group, created_by: targetCreator },
        { $inc: { current_balance: numericAmount } }
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

    return NextResponse.json({ data: transactions, totalData });
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

    return NextResponse.json({ Message: "Data updated successfully", result });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
