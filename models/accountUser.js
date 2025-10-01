import mongoose from "mongoose";

const accountUserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: { type: String, required: true },
  type: { type: String, default: "user" },
  group: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  allowed_banks: { type: Array, default: [] },
});

const Account =
  mongoose.models.account || mongoose.model("account", accountUserSchema);
export default Account;
