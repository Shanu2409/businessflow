import connection from "@/lib/mongodb";
import UserContext from "@/lib/UserContext";
import Bank from "@/models/bank";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const {
      bank_name,
      ifsc_code,
      current_balance,
      account_number,
      created_by,
    } = await request.json();

    const newBank = new Bank({
      bank_name,
      ifsc_code,
      current_balance: parseFloat(current_balance),
      account_number: parseInt(account_number),
      created_by,
    });

    await newBank.save();

    return NextResponse.json({
      Message: "Bank account created successfully",
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
