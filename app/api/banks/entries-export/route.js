import connection from "@/lib/mongodb";
import Bank from "@/models/bank";
import Transaction from "@/models/transaction";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Read-only: only find() calls, nothing is written to the database.
const pad = (n) => String(n).padStart(2, "0");
function formatIST(date) {
  if (!date) return "";
  // IST is UTC+05:30 with no daylight saving.
  const d = new Date(new Date(date).getTime() + 330 * 60000);
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export async function GET(request) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get("search") || "").trim();
    const group = searchParams.get("group");

    await connection();

    const query = {};
    if (group && group !== "undefined" && group !== "null") query.group = group;

    if (search) {
      // Same matching as the BK list search (name, IFSC, account number).
      const bankFilter = { ...query };
      const rx = { $regex: search, $options: "i" };
      bankFilter.$or = [
        { bank_name: rx },
        { ifsc_code: rx },
        { account_number: rx },
      ];
      const names = await Bank.distinct("bank_name", bankFilter);
      if (names.length === 0) {
        query.bank_name = { $in: [] };
      } else {
        query.bank_name = { $in: names };
      }
    }

    // Sorted in the app (oldest first) so the database never needs a big
    // in-memory sort.
    const docs = await Transaction.find(query, {
      createdAt: 1, bank_name: 1, transaction_type: 1, amount: 1,
      old_bank_balance: 1, effective_balance: 1, website_name: 1,
      username: 1, created_by: 1, group: 1, check: 1, re_check: 1,
    }).lean();
    docs.sort(
      (a, b) =>
        new Date(a.createdAt || 0) - new Date(b.createdAt || 0) ||
        String(a._id).localeCompare(String(b._id))
    );
    const header = [
      "Date & Time (IST)", "BK Name", "Type", "Amount", "Old BK Balance",
      "New BK Balance", "Website", "Username", "Created By", "Group",
      "Check", "Re-check",
    ];
    const rows = [header];
    for (const t of docs) {
      rows.push([
        formatIST(t.createdAt),
        t.bank_name ?? "",
        t.transaction_type ?? "",
        t.amount ?? "",
        t.old_bank_balance ?? "",
        t.effective_balance ?? "",
        t.website_name ?? "",
        t.username ?? "",
        t.created_by ?? "",
        t.group ?? "",
        t.check ? "Yes" : "No",
        t.re_check ? "Yes" : "No",
      ]);
    }

    const entryCount = rows.length - 1;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = header.map((h) => ({ wch: Math.max(14, h.length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, "BK Entries");
    const buffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "buffer",
      compression: true,
    });

    // Stream in chunks so large exports are not blocked by the serverless
    // response size limit.
    const CHUNK = 256 * 1024;
    let offset = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (offset >= buffer.length) {
          controller.close();
          return;
        }
        controller.enqueue(new Uint8Array(buffer.subarray(offset, offset + CHUNK)));
        offset += CHUNK;
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Disposition": 'attachment; filename="BK-entries.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store",
        "X-Entry-Count": String(entryCount),
      },
    });
  } catch (error) {
    console.error("BK entries export error:", error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
