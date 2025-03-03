import connection from "@/lib/mongodb";
import Account from "@/models/accountUser";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const { username, password } = await request.json();

    const user = await Account.findOne({ username, password });

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
