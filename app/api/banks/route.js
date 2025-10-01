import connection from "@/lib/mongodb";
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
      group,
    } = await request.json(); // Ensure bank_name is uppercase for validation
    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;

    if (!group) {
      return NextResponse.json(
        { Message: "Group is required" },
        { status: 400 }
      );
    }
    const existingBank = await Bank.findOne({
      bank_name: uppercaseBankName,
      group,
    });

    if (existingBank) {
      return NextResponse.json(
        { Message: "Bank with this name already exists" },
        { status: 400 }
      );
    }
    const newBank = new Bank({
      bank_name: uppercaseBankName,
      ifsc_code: ifsc_code ? ifsc_code.toUpperCase() : ifsc_code,
      current_balance: parseFloat(current_balance),
      account_number: account_number,
      created_by: created_by ? created_by.toUpperCase() : created_by,
      group,
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

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || 20);
    const page = parseInt(searchParams.get("page") || 1);
    const sort = searchParams.get("sort") || "createdAt";
    const onlyNames = searchParams.get("onlyNames");
    const group = searchParams.get("group");

    await connection();

    if (onlyNames === "true") {
      const allNames = await Bank.distinct("bank_name", { group });
      return NextResponse.json({ data: allNames });
    }

    const query = {
      group,
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
      .sort(sort)
      .limit(limit)
      .skip((page - 1) * limit);

    return NextResponse.json({ data: banks, totalData });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const value = searchParams.get("value") || "";
    const bank_name = searchParams.get("bank_name") || "";
    const group = searchParams.get("group");

    await connection();

    const result = await Bank.updateOne(
      { bank_name: bank_name, group },
      { $set: { check: value } }
    );

    return NextResponse.json({ Message: "Data updated successfully", result });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
