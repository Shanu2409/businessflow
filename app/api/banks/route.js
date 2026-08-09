import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import { NextResponse } from "next/server";

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
    } = await request.json();

    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;
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

    const existingBank = await Bank.findOne({
      bank_name: uppercaseBankName,
      created_by: uppercaseCreatedBy,
      group,
    });

    if (existingBank) {
      return NextResponse.json(
        { Message: "Bank with this name already exists for this user" },
        { status: 400 }
      );
    }

    const newBank = new Bank({
      bank_name: uppercaseBankName,
      ifsc_code: ifsc_code ? ifsc_code.toUpperCase() : ifsc_code,
      current_balance: parseFloat(current_balance),
      account_number: account_number,
      created_by: uppercaseCreatedBy,
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
      const allNames = await Bank.distinct("bank_name", baseFilter);
      return NextResponse.json({ data: allNames });
    }

    const query = {
      ...baseFilter,
      $or: [
        { bank_name: { $regex: search, $options: "i" } },
        { ifsc_code: { $regex: search, $options: "i" } },
        { account_number: { $regex: search, $options: "i" } },
      ],
    };

    const totalData = await Bank.countDocuments(query);

    const banks = await Bank.find(query, { __v: 0 })
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
    const userType = searchParams.get("userType") || "user";
    const createdBy = searchParams.get("createdBy") || searchParams.get("created_by") || "";

    await connection();

    const filter = { bank_name: bank_name.toUpperCase(), group };
    if (userType === "user" && createdBy) {
      filter.created_by = createdBy.toUpperCase();
    }

    const result = await Bank.updateOne(
      filter,
      { $set: { check: value } }
    );

    return NextResponse.json({ Message: "Data updated successfully", result });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
