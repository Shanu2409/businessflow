import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
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

    const banks = await Bank.find(query).select(
      "bank_name ifsc_code account_number current_balance created_by group -_id"
    );

    const bankData = banks.map((bank) => bank.toObject());

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(bankData);
    XLSX.utils.book_append_sheet(wb, ws, "Banks");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    return new Response(buffer, {
      headers: {
        "Content-Disposition": 'attachment; filename="banks.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
