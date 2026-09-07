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

    // 1. Concurrent lookups for Bank & Website with fallback
    const [bank, website] = await Promise.all([
      Bank.findOne({
        bank_name: uppercaseBankName,
        group,
        created_by: uppercaseCreatedBy,
      }).then((b) =>
        b || Bank.findOne({ bank_name: uppercaseBankName, group })
      ),
      Website.findOne({
        website_name: uppercaseWebsiteName,
        group,
        created_by: uppercaseCreatedBy,
      }).then((w) =>
        w || Website.findOne({ website_name: uppercaseWebsiteName, group })
      ),
    ]);

    const bankInc =
      transaction_type === "Deposit" ? numericAmount : -numericAmount;
    const websiteInc =
      transaction_type === "Deposit" ? -numericAmount : numericAmount;

    // 2. Atomic concurrent updates using findByIdAndUpdate with $inc
    // Returns the exact updated document atomically, preventing any concurrency race conditions
    const [updatedBank, updatedWebsite] = await Promise.all([
      bank
        ? Bank.findByIdAndUpdate(
            bank._id,
            {
              $inc: { current_balance: bankInc },
              $set: { check: false },
            },
            { new: true }
          )
        : null,
      website
        ? Website.findByIdAndUpdate(
            website._id,
            {
              $inc: { current_balance: websiteInc },
            },
            { new: true }
          )
        : null,
    ]);

    const newBankBalance = updatedBank
      ? Number(updatedBank.current_balance)
      : 0;
    const oldBankBalance = newBankBalance - bankInc;

    const newWebsiteBalance = updatedWebsite
      ? Number(updatedWebsite.current_balance)
      : 0;
    const oldWebsiteBalance = newWebsiteBalance - websiteInc;

    // 3. Create and save new transaction
    const newTransaction = await Transaction.create({
      bank_name: uppercaseBankName,
      username: uppercaseUsername,
      website_name: uppercaseWebsiteName,
      transaction_type,
      old_bank_balance: oldBankBalance,
      effective_balance: newBankBalance,
      old_website_balance: oldWebsiteBalance,
      new_website_balance: newWebsiteBalance,
      amount: numericAmount,
      created_by: uppercaseCreatedBy,
      group,
    });

    return NextResponse.json({
      message: "Transaction created successfully",
      data: newTransaction,
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
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

    const query = {};

    if (group) {
      query.group = group;
    }

    if (userType === "user" && createdBy) {
      query.created_by = createdBy.toUpperCase();
    } else if (userType === "admin" && createdBy) {
      query.created_by = createdBy.toUpperCase();
    }

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      query.$or = [
        { bank_name: { $regex: trimmedSearch, $options: "i" } },
        { website_name: { $regex: trimmedSearch, $options: "i" } },
        { username: { $regex: trimmedSearch, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        const startDateTime = startTime
          ? `${startDate}T${startTime}:00`
          : `${startDate}T00:00:00`;
        query.createdAt.$gte = new Date(startDateTime);
      }
      if (endDate) {
        const endDateTime = endTime
          ? `${endDate}T${endTime}:00`
          : `${endDate}T23:59:59`;
        query.createdAt.$lte = new Date(endDateTime);
      }
    }

    // Run count and query in parallel
    const [totalData, transactions] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query, {
        __v: 0,
      })
        .sort(sort || "-createdAt")
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
    ]);

    return NextResponse.json({ data: transactions, totalData });
  } catch (error) {
    console.error("Error fetching transactions:", error);
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
    console.error("Error updating transaction:", error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
