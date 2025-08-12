import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getAccountModel } from "@/models/factories/accountUser";
import { all } from "axios";
import { NextResponse, NextRequest } from "next/server";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Account = getAccountModel(conn);

    const { username, password } = await request.json();

    // Convert username to uppercase for validation
    const uppercaseUsername = username ? username.toUpperCase() : username;

    // Check if the account already exists
    const existingAccount = await Account.findOne({
      username: uppercaseUsername,
    });

    if (existingAccount) {
      return NextResponse.json(
        { Message: "Account with this username already exists" },
        { status: 400 }
      );
    }

    const newAccount = new Account({
      username: uppercaseUsername,
      password,
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

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Account = getAccountModel(conn);

    const query = {
      type: "user", // Ensuring only users are fetched
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
