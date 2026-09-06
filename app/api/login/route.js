import connection from "@/lib/mongodb";
import Account from "@/models/accountUser";
import { NextResponse, NextRequest } from "next/server";

export async function POST(request) {
  try {
    await connection();

    const { username, password } = await request.json();

    console.log("username", username);

    const uppercaseUsername = username ? username.toUpperCase() : username;

    const user = await Account.findOne({
      username: uppercaseUsername,
      password,
    });

    if (!user) {
      return NextResponse.json({ Message: "Not found" }, { status: 400 });
    }

    const userObj = user.toObject();
    userObj.data_owner = userObj.parent_user || userObj.username;

    return NextResponse.json(userObj);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { Message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
