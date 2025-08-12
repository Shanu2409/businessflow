import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getUserClientModel } from "@/models/factories/userModal";
import { NextResponse, NextRequest } from "next/server";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }

    const active = await getActiveDb();
    const conn = await getConn(active);
    const UserModal = getUserClientModel(conn);

    const {
      username,
      website_name,
      email,
      created_by,
      active: userActive,
      current_balance,
    } = await request.json(); // Ensure username is uppercase for validation
    const uppercaseUsername = username ? username.toUpperCase() : username;
    const existingUser = await UserModal.findOne({
      username: uppercaseUsername,
    });

    if (existingUser) {
      return NextResponse.json(
        { Message: "User with this username already exists" },
        { status: 400 }
      );
    }
    const newWebsite = new UserModal({
      username: uppercaseUsername,
      website_name: website_name ? website_name.toUpperCase() : website_name,
      email,
      current_balance,
      created_by: created_by ? created_by.toUpperCase() : created_by,
      active: userActive,
    });

    await newWebsite.save();

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
    const onlyNames = searchParams.get("onlyNames");

    const active = await getActiveDb();
    const conn = await getConn(active);
    const UserModal = getUserClientModel(conn);

    if (onlyNames === "true") {
      const userNames = await UserModal.find(
        {},
        { _id: 0, username: 1, website_name: 1 }
      ).then((users) =>
        users.reduce((acc, cur) => {
          acc[cur.username] = cur.website_name;
          return acc;
        }, {})
      );
      return NextResponse.json({ data: userNames });
    }

    const query = {
      $or: [
        { username: { $regex: search, $options: "i" } },
        { website_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    // Get the total count of documents matching the query
    const totalData = await UserModal.countDocuments(query);

    // Get paginated bank data
    const banks = await UserModal.find(query, { __v: 0, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: banks, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
