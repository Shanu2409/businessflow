import { NextResponse } from "next/server";
import connection from "@/lib/mongodb";
import Transaction from "@/models/transaction";
import Bank from "@/models/bank";
import Website from "@/models/website";
import UserModal from "@/models/userModal";
import Account from "@/models/accountUser";

export async function POST(request) {
  try {
    await connection();
    const filters = await request.json();
    const {
      reportType,
      startDate,
      endDate,
      startTime,
      endTime,
      groupBy,
      bankFilter,
      websiteFilter,
      userFilter,
      group,
      userType = "user",
      createdBy = "",
      creatorFilter = "",
      sortBy = "date",
      sortOrder = "desc",
    } = filters;

    const userIsolationFilter = {};
    if (group) userIsolationFilter.group = group;

    if (userType === "user" && createdBy) {
      userIsolationFilter.created_by = createdBy.toUpperCase();
    } else if (creatorFilter) {
      userIsolationFilter.created_by = creatorFilter.toUpperCase();
    }

    const dateFilter = {};
    if (startDate) {
      const startDateTime = startTime
        ? `${startDate}T${startTime}:00`
        : `${startDate}T00:00:00`;
      dateFilter.createdAt = { $gte: new Date(startDateTime) };
    }
    if (endDate) {
      const endDateTime = endTime
        ? `${endDate}T${endTime}:00`
        : `${endDate}T23:59:59`;
      dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDateTime) };
    }

    switch (reportType) {
      case "transactionSummary": {
        const matchQuery = {
          ...userIsolationFilter,
          ...dateFilter,
          ...(bankFilter && { bank_name: bankFilter }),
          ...(websiteFilter && { website_name: websiteFilter }),
          ...(userFilter && { username: userFilter }),
        };

        let groupField = {};
        switch (groupBy) {
          case "day":
            groupField = {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            };
            break;
          case "month":
            groupField = {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            };
            break;
          case "year":
            groupField = {
              $dateToString: { format: "%Y", date: "$createdAt" },
            };
            break;
          case "bank":
            groupField = "$bank_name";
            break;
          case "website":
            groupField = "$website_name";
            break;
          case "user":
            groupField = "$username";
            break;
          default:
            groupField = {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            };
        }

        const transactions = await Transaction.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: groupField,
              totalAmount: { $sum: "$amount" },
              depositAmount: {
                $sum: {
                  $cond: [{ $eq: ["$transaction_type", "Deposit"] }, "$amount", 0],
                },
              },
              withdrawAmount: {
                $sum: {
                  $cond: [{ $eq: ["$transaction_type", "Withdraw"] }, "$amount", 0],
                },
              },
              count: { $sum: 1 },
              createdAt: { $min: "$createdAt" },
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              totalAmount: 1,
              depositAmount: 1,
              withdrawAmount: 1,
              netFlow: { $subtract: ["$depositAmount", "$withdrawAmount"] },
              count: 1,
              createdAt: "$createdAt",
            },
          },
          {
            $sort: {
              [sortBy === "date" ? "date" : sortBy]: sortOrder === "desc" ? -1 : 1,
            },
          },
        ]);

        return NextResponse.json({
          success: true,
          data: transactions,
          reportType: "transactionSummary",
          groupBy,
        });
      }

      case "balanceSummary": {
        const banks = await Bank.find(userIsolationFilter, {
          bank_name: 1,
          current_balance: 1,
          created_by: 1,
          _id: 0,
        });
        const websites = await Website.find(userIsolationFilter, {
          website_name: 1,
          current_balance: 1,
          created_by: 1,
          _id: 0,
        });

        const totalBankBalance = banks.reduce(
          (sum, bank) => sum + bank.current_balance,
          0
        );
        const totalWebsiteBalance = websites.reduce(
          (sum, website) => sum + website.current_balance,
          0
        );

        return NextResponse.json({
          success: true,
          data: {
            banks: banks.sort((a, b) => b.current_balance - a.current_balance),
            websites: websites.sort((a, b) => b.current_balance - a.current_balance),
            totalBankBalance,
            totalWebsiteBalance,
            netBalance: totalBankBalance - totalWebsiteBalance,
          },
          reportType: "balanceSummary",
        });
      }

      case "userActivity": {
        const matchQuery = {
          ...userIsolationFilter,
          ...dateFilter,
          ...(userFilter && { username: userFilter }),
        };

        const userActivity = await Transaction.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: "$username",
              totalTransactions: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
              lastActivity: { $max: "$createdAt" },
              firstActivity: { $min: "$createdAt" },
            },
          },
          {
            $lookup: {
              from: "userclients",
              localField: "_id",
              foreignField: "username",
              as: "userDetails",
            },
          },
          {
            $project: {
              _id: 0,
              username: "$_id",
              website_name: { $arrayElemAt: ["$userDetails.website_name", 0] },
              totalTransactions: 1,
              totalAmount: 1,
              lastActivity: 1,
              firstActivity: 1,
              daysActive: {
                $divide: [
                  { $subtract: ["$lastActivity", "$firstActivity"] },
                  1000 * 60 * 60 * 24,
                ],
              },
            },
          },
          {
            $sort: {
              [sortBy === "date" ? "lastActivity" : sortBy]:
                sortOrder === "desc" ? -1 : 1,
            },
          },
        ]);

        return NextResponse.json({
          success: true,
          data: userActivity,
          reportType: "userActivity",
        });
      }

      case "trendAnalysis": {
        const matchQuery = {
          ...userIsolationFilter,
          ...dateFilter,
          ...(bankFilter && { bank_name: bankFilter }),
          ...(websiteFilter && { website_name: websiteFilter }),
          ...(userFilter && { username: userFilter }),
        };

        const dateFormat =
          groupBy === "month" ? "%Y-%m" : groupBy === "year" ? "%Y" : "%Y-%m-%d";

        const trendData = await Transaction.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: {
                date: { $dateToString: { format: dateFormat, date: "$createdAt" } },
                type: "$transaction_type",
              },
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.date",
              transactions: {
                $push: {
                  type: "$_id.type",
                  amount: "$totalAmount",
                  count: "$count",
                },
              },
            },
          },
          {
            $addFields: {
              dateForSort: { $toDate: { $concat: ["$_id", "T00:00:00Z"] } },
            },
          },
          {
            $sort: { dateForSort: 1 },
          },
          {
            $lookup: {
              from: "transactions",
              let: { date_string: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $eq: [
                        { $dateToString: { format: dateFormat, date: "$createdAt" } },
                        "$$date_string",
                      ],
                    },
                  },
                },
                { $sort: { createdAt: 1 } },
                { $limit: 1 },
              ],
              as: "firstTransaction",
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id",
              createdAt: { $arrayElemAt: ["$firstTransaction.createdAt", 0] },
              depositAmount: {
                $reduce: {
                  input: "$transactions",
                  initialValue: 0,
                  in: {
                    $add: [
                      "$$value",
                      {
                        $cond: [
                          { $eq: ["$$this.type", "Deposit"] },
                          "$$this.amount",
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
              withdrawAmount: {
                $reduce: {
                  input: "$transactions",
                  initialValue: 0,
                  in: {
                    $add: [
                      "$$value",
                      {
                        $cond: [
                          { $eq: ["$$this.type", "Withdraw"] },
                          "$$this.amount",
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
              depositCount: {
                $reduce: {
                  input: "$transactions",
                  initialValue: 0,
                  in: {
                    $add: [
                      "$$value",
                      {
                        $cond: [
                          { $eq: ["$$this.type", "Deposit"] },
                          "$$this.count",
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
              withdrawCount: {
                $reduce: {
                  input: "$transactions",
                  initialValue: 0,
                  in: {
                    $add: [
                      "$$value",
                      {
                        $cond: [
                          { $eq: ["$$this.type", "Withdraw"] },
                          "$$this.count",
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            $addFields: {
              netAmount: { $subtract: ["$depositAmount", "$withdrawAmount"] },
              netCount: { $subtract: ["$depositCount", "$withdrawCount"] },
            },
          },
          { $sort: { date: 1 } },
        ]);

        return NextResponse.json({
          success: true,
          data: trendData,
          reportType: "trendAnalysis",
          groupBy,
        });
      }

      case "systemOverview": {
        const bankCount = await Bank.countDocuments(userIsolationFilter);
        const websiteCount = await Website.countDocuments(userIsolationFilter);
        const userCount = await UserModal.countDocuments(userIsolationFilter);
        const accountCount = await Account.countDocuments({
          ...(group && { group }),
          type: "user",
        });
        const transactionCount = await Transaction.countDocuments(
          userIsolationFilter
        );

        const banks = await Bank.find(userIsolationFilter, {
          bank_name: 1,
          current_balance: 1,
          _id: 0,
        }).sort({ current_balance: -1 });

        const websites = await Website.find(userIsolationFilter, {
          website_name: 1,
          current_balance: 1,
          _id: 0,
        }).sort({ current_balance: -1 });

        const bankAggregate = await Bank.aggregate([
          { $match: userIsolationFilter },
          { $group: { _id: null, totalBalance: { $sum: "$current_balance" } } },
        ]);

        const websiteAggregate = await Website.aggregate([
          { $match: userIsolationFilter },
          { $group: { _id: null, totalBalance: { $sum: "$current_balance" } } },
        ]);

        const totalBankBalance =
          bankAggregate.length > 0 ? bankAggregate[0].totalBalance : 0;
        const totalWebsiteBalance =
          websiteAggregate.length > 0 ? websiteAggregate[0].totalBalance : 0;

        const transactionVolume = await Transaction.aggregate([
          { $match: userIsolationFilter },
          {
            $group: {
              _id: "$transaction_type",
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]);

        const depositVolume = transactionVolume.find(
          (t) => t._id === "Deposit"
        ) || { totalAmount: 0, count: 0 };
        const withdrawVolume = transactionVolume.find(
          (t) => t._id === "Withdraw"
        ) || { totalAmount: 0, count: 0 };

        return NextResponse.json({
          success: true,
          data: {
            counts: {
              bankCount,
              websiteCount,
              userCount,
              accountCount,
              transactionCount,
            },
            banks,
            websites,
            balances: {
              totalBankBalance,
              totalWebsiteBalance,
              netBalance: totalBankBalance - totalWebsiteBalance,
            },
            transactions: {
              totalDeposits: depositVolume.totalAmount,
              depositCount: depositVolume.count,
              totalWithdrawals: withdrawVolume.totalAmount,
              withdrawalCount: withdrawVolume.count,
              netFlow: depositVolume.totalAmount - withdrawVolume.totalAmount,
            },
          },
          reportType: "systemOverview",
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "Invalid report type provided",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await connection();
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "transactionSummary";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";
    const group = searchParams.get("group");
    const userType = searchParams.get("userType") || "user";
    const createdBy = searchParams.get("createdBy") || searchParams.get("created_by") || "";

    const filter = {};
    if (group) filter.group = group;
    if (userType === "user" && createdBy) {
      filter.created_by = createdBy.toUpperCase();
    } else if (createdBy) {
      filter.created_by = createdBy.toUpperCase();
    }

    if (startDate) {
      filter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      filter.createdAt = {
        ...filter.createdAt,
        $lte: new Date(endDate + "T23:59:59"),
      };
    }

    const transactions = await Transaction.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: transactions,
      reportType,
      format,
    });
  } catch (error) {
    console.error("Error exporting report:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}