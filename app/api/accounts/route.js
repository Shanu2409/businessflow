import connection from "@/lib/mongodb";
import Account from "@/models/accountUser";
import Bank from "@/models/bank";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const { username, password, group, created_by, parent_user } =
      await request.json();

    // Validate that group is provided
    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }

    // Convert username to uppercase for validation
    const uppercaseUsername = username ? username.toUpperCase() : username;
    const uppercaseCreatedBy = created_by ? created_by.toUpperCase() : null;
    const uppercaseParentUser = parent_user
      ? parent_user.toUpperCase()
      : uppercaseCreatedBy;

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

    // Fetch banks for this group / creator scope
    const bankFilter = { group };
    if (uppercaseParentUser) {
      bankFilter.created_by = uppercaseParentUser;
    }
    let allBanks = await Bank.distinct("bank_name", bankFilter);
    if (allBanks.length === 0) {
      allBanks = await Bank.distinct("bank_name", { group });
    }

    const newAccount = new Account({
      username: uppercaseUsername,
      password,
      type: "user",
      group,
      created_by: uppercaseCreatedBy,
      parent_user: uppercaseParentUser,
      allowed_banks: allBanks,
    });

    await newAccount.save();

    return NextResponse.json({
      Message: "User created successfully",
      data: newAccount,
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
    const userType = searchParams.get("userType") || "user";
    const createdBy =
      searchParams.get("createdBy") || searchParams.get("created_by") || "";

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
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Scope accounts: If caller is a regular user, only return accounts created by or parented to this user
    if (userType === "user" && createdBy) {
      const creatorUpper = createdBy.toUpperCase();
      query.$and = [
        {
          $or: [
            { created_by: creatorUpper },
            { parent_user: creatorUpper },
          ],
        },
      ];
    }

    // Get the total count of documents matching the query
    const totalData = await Account.countDocuments(query);

    // Get paginated account data
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
