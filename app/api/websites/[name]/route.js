import { getActiveDb, isMaintenance } from "@/lib/db/control";
import { getConn } from "@/lib/db/active";
import { getWebsiteModel } from "@/models/factories/website";
import { NextResponse } from "next/server";
export const runtime = "nodejs";

export async function DELETE(request, context) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Website = getWebsiteModel(conn);
    // Await the params from the context.
    const { name } = await context.params;
    // Uncomment and modify the delete operation as needed:
    await Website.deleteOne({ website_name: name });
    return NextResponse.json({
      Message: `Website deleted successfully`,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}

export async function PUT(request, context) {
  try {
    if (await isMaintenance()) {
      return NextResponse.json({ Message: "Maintenance" }, { status: 503 });
    }
    const active = await getActiveDb();
    const conn = await getConn(active);
    const Website = getWebsiteModel(conn);
    // Await the params from the context.
    const { name } = await context.params;
    const { account_number, url, website_name, current_balance, type } =
      await request.json();
    // Uncomment and modify the update operation as needed:
    console.log("type", type); // Convert website_name to uppercase
    const uppercaseWebsiteName = website_name
      ? website_name.toUpperCase()
      : website_name;

    // Check if the name is changed and if the new name already exists
    if (uppercaseWebsiteName && uppercaseWebsiteName !== name.toUpperCase()) {
      const existingWebsite = await Website.findOne({
        website_name: uppercaseWebsiteName,
      });
      if (existingWebsite) {
        return NextResponse.json(
          { Message: "Website with this name already exists" },
          { status: 400 }
        );
      }
    }

    // Construct the update object based on type
    const updateObject = type
      ? {
          $push: { history: "+" + current_balance },
          $set: {
            website_name: uppercaseWebsiteName,
            account_number,
            current_balance,
            url,
          },
        }
      : {
          $push: { history: "-" + current_balance },
          $set: {
            website_name: uppercaseWebsiteName,
            account_number,
            current_balance,
            url,
          },
        };

    // Update the document in MongoDB
    await Website.updateOne({ website_name: name }, updateObject, {
      upsert: true,
    });

    return NextResponse.json({
      Message: "Website account updated successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ Message: error.message }, { status: 500 });
  }
}
