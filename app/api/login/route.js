import { getActiveDb } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getAccountModel } from "@/models/factories/accountUser";
import { NextResponse, NextRequest } from "next/server";
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Account = getAccountModel(conn);

    const { username, password } = await request.json();

    console.log("username", username);

    const user = await Account.findOne({ username: username, password });

    if (!user) {
      return NextResponse.json({ Message: "Not found" }, { status: 400 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { Message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
