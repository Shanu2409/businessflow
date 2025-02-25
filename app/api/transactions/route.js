import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import Transaction from "@/models/transaction";
import UserModal from "@/models/userModal";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const {
        username,
        website_name,
        bank_name,
        transaction_type,
        created_by,
        amount,
    } = await request.json();

    const bank = await Bank.findOne({bank_name}, {current_balance: 1})

    const user = await UserModal.findOne({username }, {current_balance: 1})

    // const newBank = new Transaction({
    //   bank_name,
    //   username,
    //   website_name,
    //   transaction_type,
    //   amount,
    //   created_by,
    // });

    // await newBank.save();

    return NextResponse.json({
      Message: "Bank account created successfully",
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

    await connection();

    const query = {
      $or: [
        { bank_name: { $regex: search, $options: "i" } },
        { ifsc_code: { $regex: search, $options: "i" } },
        { account_number: { $regex: search, $options: "i" } },
      ],
    };

    // Get the total count of documents matching the query
    const totalData = await Bank.countDocuments(query);

    // Get paginated bank data
    const banks = await Bank.find(query, { __v: 0, _id: 0 })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: banks, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
