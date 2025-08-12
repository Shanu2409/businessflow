// Migrated to active DB pattern
import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getBankModel } from "@/models/factories/bank";
import { NextResponse, NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    // Maintenance gate for writes
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Bank = getBankModel(conn);

    const {
      bank_name,
      ifsc_code,
      current_balance,
      account_number,
      created_by,
    } = await request.json(); // Ensure bank_name is uppercase for validation
    const uppercaseBankName = bank_name ? bank_name.toUpperCase() : bank_name;
    const existingBank = await Bank.findOne({
      bank_name: uppercaseBankName,
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
      account_number: parseInt(account_number),
      created_by: created_by ? created_by.toUpperCase() : created_by,
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

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Bank = getBankModel(conn);

    if (onlyNames === "true") {
      const allNames = await Bank.distinct("bank_name");
      return NextResponse.json({ data: allNames });
    }

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

    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Bank = getBankModel(conn);

    const result = await Bank.updateOne(
      { bank_name: bank_name },
      { $set: { check: value } }
    );

    return NextResponse.json({ Message: "Data updated successfully", result });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }

    const active = await getActiveDb();
    const conn = await getConn(active);
    const Bank = getBankModel(conn);

    // optional force=true to also delete all transactions
    const url = new URL(request.url);
    const force = url.searchParams.get("force") === "true";

    if (!force) {
      // If not force, ensure no transactions exist before pruning
      const { getTransactionModel } = await import(
        "@/models/factories/transaction"
      );
      const Transaction = getTransactionModel(conn);
      const count = await Transaction.countDocuments({});
      if (count > 0) {
        return NextResponse.json(
          {
            Message: `Cannot prune banks while ${count} transactions exist. Use force=true to also delete transactions.`,
          },
          { status: 400 }
        );
      }
    } else {
      const { getTransactionModel } = await import(
        "@/models/factories/transaction"
      );
      const Transaction = getTransactionModel(conn);
      await Transaction.deleteMany({});
    }

    const result = await Bank.deleteMany({});
    return NextResponse.json({
      Message: `Pruned banks: ${result.deletedCount}`,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
