import { NextResponse } from "next/server";
import { getActiveDb } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getTransactionModel } from "@/models/factories/transaction";
import { getBankModel } from "@/models/factories/bank";
import { getWebsiteModel } from "@/models/factories/website";
import { getUserClientModel } from "@/models/factories/userModal";
import { getAccountModel } from "@/models/factories/accountUser";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);
    const Bank = getBankModel(conn);
    const Website = getWebsiteModel(conn);
    const UserModal = getUserClientModel(conn);
    const Account = getAccountModel(conn);
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
      sortBy = "date",
      sortOrder = "desc",
    } = filters;

    // Build date filter if date range is specified
    const dateFilter = {};
    if (startDate) {
      // If startTime is provided, use it; otherwise default to start of day
      const startDateTime = startTime
        ? `${startDate}T${startTime}:00`
        : `${startDate}T00:00:00`;
      dateFilter.createdAt = { $gte: new Date(startDateTime) };
    }
    if (endDate) {
      // If endTime is provided, use it; otherwise default to end of day
      const endDateTime = endTime
        ? `${endDate}T${endTime}:00`
        : `${endDate}T23:59:59`;
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        $lte: new Date(endDateTime),
      };
    }

    // Switch based on report type
    switch (reportType) {
      case "transactionSummary": {
        // Apply filters for transaction summary
        const matchQuery = {
          ...dateFilter,
          ...(bankFilter && { bank_name: bankFilter }),
          ...(websiteFilter && { website_name: websiteFilter }),
          ...(userFilter && { username: userFilter }),
        };

        // Define the grouping field based on groupBy parameter
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

        // Run aggregation pipeline
        const transactions = await Transaction.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: groupField,
              totalAmount: { $sum: "$amount" },
              depositAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$transaction_type", "Deposit"] },
                    "$amount",
                    0,
                  ],
                },
              },
              withdrawAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$transaction_type", "Withdraw"] },
                    "$amount",
                    0,
                  ],
                },
              },
              count: { $sum: 1 },
              // Keep the first timestamp for each group for reference
              createdAt: { $min: "$createdAt" }, // Using $min instead of $first
            },
          },
          {
            $project: {
              _id: 0,
              date: "$_id", // Change label to date to match frontend expectations
              totalAmount: 1,
              depositAmount: 1,
              withdrawAmount: 1,
              netFlow: { $subtract: ["$depositAmount", "$withdrawAmount"] },
              count: 1,
              // Include min and max timestamps for this group to show time information
              createdAt: "$createdAt", // No need for $first here, just pass through the value
            },
          },
          {
            $sort: {
              [sortBy === "date" ? "date" : sortBy]:
                sortOrder === "desc" ? -1 : 1,
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
        // Get current balances for banks and websites
        const banks = await Bank.find(
          {},
          { bank_name: 1, current_balance: 1, _id: 0 }
        );
        const websites = await Website.find(
          {},
          { website_name: 1, current_balance: 1, _id: 0 }
        );

        // Calculate totals
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
            websites: websites.sort(
              (a, b) => b.current_balance - a.current_balance
            ),
            totalBankBalance,
            totalWebsiteBalance,
            netBalance: totalBankBalance - totalWebsiteBalance,
          },
          reportType: "balanceSummary",
        });
      }

      case "userActivity": {
        // Filter for user activity
        const matchQuery = {
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
              from: "userclients", // Collection name for UserModal
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
                  1000 * 60 * 60 * 24, // Convert milliseconds to days
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
          ...dateFilter,
          ...(bankFilter && { bank_name: bankFilter }),
          ...(websiteFilter && { website_name: websiteFilter }),
          ...(userFilter && { username: userFilter }),
        };

        // Group by dates to create trend data
        const dateFormat =
          groupBy === "month"
            ? "%Y-%m"
            : groupBy === "year"
            ? "%Y"
            : "%Y-%m-%d";

        const trendData = await Transaction.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: {
                date: {
                  $dateToString: { format: dateFormat, date: "$createdAt" },
                },
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
                        {
                          $dateToString: {
                            format: dateFormat,
                            date: "$createdAt",
                          },
                        },
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
        // Get counts from different collections
        const bankCount = await Bank.countDocuments();
        const websiteCount = await Website.countDocuments();
        const userCount = await UserModal.countDocuments();
        const accountCount = await Account.countDocuments();
        const transactionCount = await Transaction.countDocuments();

        // Get all banks and websites with balances
        const banks = await Bank.find(
          {},
          { bank_name: 1, current_balance: 1, _id: 0 }
        ).sort({ current_balance: -1 });
        const websites = await Website.find(
          {},
          { website_name: 1, current_balance: 1, _id: 0 }
        ).sort({ current_balance: -1 });

        // Get total balances
        const bankAggregate = await Bank.aggregate([
          { $group: { _id: null, totalBalance: { $sum: "$current_balance" } } },
        ]);

        const websiteAggregate = await Website.aggregate([
          { $group: { _id: null, totalBalance: { $sum: "$current_balance" } } },
        ]);

        const totalBankBalance =
          bankAggregate.length > 0 ? bankAggregate[0].totalBalance : 0;
        const totalWebsiteBalance =
          websiteAggregate.length > 0 ? websiteAggregate[0].totalBalance : 0;

        // Get transaction volumes
        const transactionVolume = await Transaction.aggregate([
          {
            $group: {
              _id: "$transaction_type",
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ]);

        // Process transaction volume data
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

// For exporting reports data to CSV or Excel format
export async function GET(request) {
  try {
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Transaction = getTransactionModel(conn);
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get("type") || "transactionSummary";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const format = searchParams.get("format") || "json";

    // Build date filter if date range is specified
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = {
        ...dateFilter.createdAt,
        $lte: new Date(endDate + "T23:59:59"),
      };
    }

    // Get transactions based on date filter
    const transactions = await Transaction.find(dateFilter).sort({
      createdAt: -1,
    });

    // For now, we return JSON. In a real implementation, you would
    // convert data to CSV/Excel based on the requested format
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
