import mongoose from "mongoose";

const accountUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  type: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

const Account =
  mongoose.models.account || mongoose.model("account", accountUserSchema);
export default Account;
