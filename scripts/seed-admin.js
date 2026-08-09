import connection from "../lib/mongodb.js";
import Account from "../models/accountUser.js";

async function createMainUser() {
  try {
    console.log("Connecting to MongoDB...");
    await connection();

    const username = (process.argv[2] || "ADMIN").toUpperCase();
    const password = process.argv[3] || "admin123";
    const group = process.argv[4] || "MAIN_GROUP";

    const existingAccount = await Account.findOne({ username });

    if (existingAccount) {
      console.log(`Account '${username}' already exists. Updating role to admin...`);
      existingAccount.type = "admin";
      existingAccount.password = password;
      existingAccount.group = group;
      await existingAccount.save();
      console.log(`Main Admin user '${username}' updated successfully!`);
    } else {
      const adminUser = new Account({
        username,
        password,
        type: "admin",
        group,
        allowed_banks: [],
      });

      await adminUser.save();
      console.log(`Main Admin user '${username}' created successfully in group '${group}'!`);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error creating main user:", error);
    process.exit(1);
  }
}

createMainUser();
