import { getActiveDb } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getBankModel } from "@/models/factories/bank";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
export const runtime = "nodejs";

export async function GET(request) {
  try {
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Bank = getBankModel(conn);

    // Fetch bank data (excluding _id and __v)
    const banks = await Bank.find().select(
      "bank_name ifsc_code current_balance -_id"
    );

    // Convert MongoDB data to an array of objects
    const bankData = banks.map((bank) => bank.toObject());

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(bankData);

    // Append the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, "Banks");

    // Write workbook to buffer
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

    // Return the file as a response
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
