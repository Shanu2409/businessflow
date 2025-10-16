import connection from "@/lib/mongodb";
import Account from "@/models/accountUser";
import Bank from "@/models/bank";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const { username, password, group } = await request.json();

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    // Convert username to uppercase for validation
    const uppercaseUsername = username ? username.toUpperCase() : username;

    // Check if the account already exists within the same group
    const existingAccount = await Account.findOne({
      username: uppercaseUsername,
      group,
    });

    if (existingAccount) {
      return NextResponse.json(
        { Message: "Account with this username already exists in this group" },
        { status: 400 }
      );
    }

    // Fetch all banks for this group
    const allBanks = await Bank.distinct("bank_name", { group });

    const newAccount = new Account({
      username: uppercaseUsername,
      password,
      group,
      allowed_banks: allBanks, // Automatically assign all banks
    });

    await newAccount.save();

    return NextResponse.json({
      Message: "User created successfully",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || 20);
    const page = parseInt(searchParams.get("page") || 1);
    const group = searchParams.get("group");

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    await connection();

    const query = {
      type: "user", // Ensuring only users are fetched
      group,
      $or: [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    // Get the total count of documents matching the query
    const totalData = await Account.countDocuments(query);

    // Get paginated bank data
    const accounts = await Account.find(query, { __v: 0, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: accounts, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
