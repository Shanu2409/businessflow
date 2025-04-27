import { NextResponse } from "next/server";
import connection from "@/lib/mongodb";
import BankModel from "@/models/bank";
import TransactionModel from "@/models/transaction";
import UserModel from "@/models/userModal";
import WebsiteModel from "@/models/website";
import AccountModel from "@/models/accountUser";

export async function GET() {
  try {
    // Connect to MongoDB
    await connection();

    // Run all count queries in parallel for better performance
    const [
      banksCount,
      transactionsCount,
      usersCount,
      websitesCount,
      accountsCount,
    ] = await Promise.all([
      BankModel.countDocuments(),
      TransactionModel.countDocuments(),
      UserModel.countDocuments(),
      WebsiteModel.countDocuments(),
      AccountModel.countDocuments(),
    ]);

    // Return all counts in a single response
    return NextResponse.json({
      success: true,
      stats: {
        banks: banksCount,
        transactions: transactionsCount,
        users: usersCount,
        websites: websitesCount,
        accounts: accountsCount,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
