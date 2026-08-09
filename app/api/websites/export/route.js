import connection from "@/lib/mongodb";
import Website from "@/models/website";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET(request) {
  try {
    await connection();

    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");
    const userType = searchParams.get("userType") || "user";
    const createdBy = searchParams.get("createdBy") || searchParams.get("created_by") || "";

    const query = {};
    if (group) query.group = group;
    if (userType === "user" && createdBy) {
      query.created_by = createdBy.toUpperCase();
    } else if (userType === "admin" && createdBy) {
      query.created_by = createdBy.toUpperCase();
    }

    const websites = await Website.find(query).select(
      "website_name url current_balance created_by group -_id"
    );

    const websiteData = websites.map((w) => w.toObject());

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(websiteData);
    XLSX.utils.book_append_sheet(wb, ws, "Websites");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    return new Response(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="websites.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
