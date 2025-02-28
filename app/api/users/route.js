import connection from "@/lib/mongodb";
import UserModal from "@/models/userModal";
import { NextResponse, NextRequest } from "next/server";

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
    } = await request.json();

    // only for double security ask client first

    // if (!(await UserModal.findOne({ website_name }))) {
    //   return NextResponse.json(
    //     { Message: "Website name does not exists" },
    //     { status: 400 }
    //   );
    // }

    const newWebsite = new UserModal({
      username,
      website_name,
      email,
      current_balance,
      created_by,
      active,
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

    await connection();

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
