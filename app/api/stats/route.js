import { NextResponse } from "next/server";
import connection from "@/lib/mongodb";
import BankModel from "@/models/bank";
import TransactionModel from "@/models/transaction";
import UserModel from "@/models/userModal";
import WebsiteModel from "@/models/website";
import AccountModel from "@/models/accountUser";

export async function GET(request) {
  try {
    await connection();

    const searchParams = request.nextUrl.searchParams;
    const group = searchParams.get("group");
    const userType = searchParams.get("userType") || "user";
    const createdBy = searchParams.get("createdBy") || searchParams.get("created_by") || "";

    const matchQuery = {};
    if (group) matchQuery.group = group;
    if (userType === "user" && createdBy) {
      matchQuery.created_by = createdBy.toUpperCase();
    } else if (userType === "admin" && createdBy) {
      matchQuery.created_by = createdBy.toUpperCase();
    }

    const accountQuery = { type: "user" };
    if (group) accountQuery.group = group;

    const [
      banksCount,
      transactionsCount,
      usersCount,
      websitesCount,
      accountsCount,
      banks,
      websites,
      bankAggregate,
      websiteAggregate,
      transactionVolume
    ] = await Promise.all([
      BankModel.countDocuments(matchQuery),
      TransactionModel.countDocuments(matchQuery),
      UserModel.countDocuments(matchQuery),
      WebsiteModel.countDocuments(matchQuery),
      AccountModel.countDocuments(accountQuery),
      BankModel.find(matchQuery, { bank_name: 1, current_balance: 1, _id: 0 }).sort({ current_balance: -1 }),
      WebsiteModel.find(matchQuery, { website_name: 1, current_balance: 1, _id: 0 }).sort({ current_balance: -1 }),
      BankModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalBalance: { $sum: "$current_balance" } } }
      ]),
      WebsiteModel.aggregate([
        { $match: matchQuery },
        { $group: { _id: null, totalBalance: { $sum: "$current_balance" } } }
      ]),
      TransactionModel.aggregate([
        { $match: matchQuery },
        {
          $group: {
            _id: "$transaction_type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const totalBankBalance = bankAggregate.length > 0 ? bankAggregate[0].totalBalance : 0;
    const totalWebsiteBalance = websiteAggregate.length > 0 ? websiteAggregate[0].totalBalance : 0;

    const depositVolume = transactionVolume.find(t => t._id === "Deposit") || { totalAmount: 0, count: 0 };
    const withdrawVolume = transactionVolume.find(t => t._id === "Withdraw") || { totalAmount: 0, count: 0 };

    return NextResponse.json({
      success: true,
      stats: {
        counts: {
          bankCount: banksCount,
          websiteCount: websitesCount,
          userCount: usersCount,
          accountCount: accountsCount,
          transactionCount: transactionsCount
        },
        banks,
        websites,
        balances: {
          totalBankBalance,
          totalWebsiteBalance,
          netBalance: totalBankBalance - totalWebsiteBalance
        },
        transactions: {
          totalDeposits: depositVolume.totalAmount,
          depositCount: depositVolume.count,
          totalWithdrawals: withdrawVolume.totalAmount,
          withdrawalCount: withdrawVolume.count,
          netFlow: depositVolume.totalAmount - withdrawVolume.totalAmount
        }
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
}
