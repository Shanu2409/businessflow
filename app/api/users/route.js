import connection from "@/lib/mongodb";
import UserModal from "@/models/userModal";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const {
      username,
      website_name,
      email,
      created_by,
      active,
      current_balance,
      group,
    } = await request.json();

    const uppercaseUsername = username ? username.toUpperCase() : username;
    const uppercaseCreatedBy = created_by ? created_by.toUpperCase() : created_by;

    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }
    if (!uppercaseCreatedBy) {
      return NextResponse.json(
        { Message: "Created by user is required" },
        { status: 400 }
      );
    }

    const existingUser = await UserModal.findOne({
      username: uppercaseUsername,
      created_by: uppercaseCreatedBy,
      group,
    });

    if (existingUser) {
      return NextResponse.json(
        { Message: "User with this username already exists for this creator" },
        { status: 400 }
      );
    }

    const newUser = new UserModal({
      username: uppercaseUsername,
      website_name: website_name ? website_name.toUpperCase() : website_name,
      email,
      current_balance,
      created_by: uppercaseCreatedBy,
      active,
      group,
    });

    await newUser.save();

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
    const group = searchParams.get("group");
    const userType = searchParams.get("userType") || "user";
    const createdBy = searchParams.get("createdBy") || searchParams.get("created_by") || "";

    await connection();

    const baseFilter = { group };
    if (userType === "user" && createdBy) {
      baseFilter.created_by = createdBy.toUpperCase();
    } else if (userType === "admin" && createdBy) {
      baseFilter.created_by = createdBy.toUpperCase();
    }

    if (onlyNames === "true") {
      const users = await UserModal.find(baseFilter, {
        _id: 0,
        username: 1,
        website_name: 1,
      });

      const userMap = users.reduce((acc, cur) => {
        acc[cur.username] = cur.website_name;
        return acc;
      }, {});

      return NextResponse.json({ data: userMap });
    }

    const query = {
      ...baseFilter,
      $or: [
        { username: { $regex: search, $options: "i" } },
        { website_name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    };

    const totalData = await UserModal.countDocuments(query);

    const users = await UserModal.find(query, { __v: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: users, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
