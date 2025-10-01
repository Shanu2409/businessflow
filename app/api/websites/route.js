import connection from "@/lib/mongodb";
import Website from "@/models/website";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const { website_name, url, current_balance, created_by, group } =
      await request.json(); // Ensure website_name is uppercase for validation
    const uppercaseWebsiteName = website_name
      ? website_name.toUpperCase()
      : website_name;
    const existingWebsite = await Website.findOne({
      website_name: uppercaseWebsiteName,
      group,
    });

    if (existingWebsite) {
      return NextResponse.json(
        { Message: "Website with this name already exists" },
        { status: 400 }
      );
    }
    const newWebsite = new Website({
      website_name: uppercaseWebsiteName,
      url,
      current_balance: parseFloat(current_balance),
      history: ["+" + parseFloat(current_balance)],
      created_by: created_by ? created_by.toUpperCase() : created_by,
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

    await connection();

    if (onlyNames === "true") {
      const allNames = await Website.distinct("website_name", { group });
      return NextResponse.json({ data: allNames });
    }

    const query = {
      group,
      $or: [
        { website_name: { $regex: search, $options: "i" } },
        { url: { $regex: search, $options: "i" } },
        { account_number: { $regex: search, $options: "i" } },
      ],
    };

    // Get the total count of documents matching the query
    const totalData = await Website.countDocuments(query);

    // Get paginated bank data
    const banks = await Website.find(query, { __v: 0, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: banks, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
