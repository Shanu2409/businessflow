import connection from "@/lib/mongodb";
import Website from "@/models/website";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const { website_name, url, current_balance, created_by, group } =
      await request.json();
    const uppercaseWebsiteName = website_name
      ? website_name.toUpperCase()
      : website_name;
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

    const existingWebsite = await Website.findOne({
      website_name: uppercaseWebsiteName,
      created_by: uppercaseCreatedBy,
      group,
    });

    if (existingWebsite) {
      return NextResponse.json(
        { Message: "Website with this name already exists for this user" },
        { status: 400 }
      );
    }

    const newWebsite = new Website({
      website_name: uppercaseWebsiteName,
      url,
      current_balance: parseFloat(current_balance),
      history: ["+" + parseFloat(current_balance)],
      created_by: uppercaseCreatedBy,
      group,
    });

    await newWebsite.save();
    return NextResponse.json({
      Message: "Website created successfully",
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
      const allNames = await Website.distinct("website_name", baseFilter);
      return NextResponse.json({ data: allNames });
    }

    const query = {
      ...baseFilter,
      $or: [
        { website_name: { $regex: search, $options: "i" } },
        { url: { $regex: search, $options: "i" } },
      ],
    };

    const totalData = await Website.countDocuments(query);

    const websites = await Website.find(query, { __v: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: websites, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
