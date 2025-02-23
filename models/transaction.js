import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user_name: { type: String, required: true, unique: false },
  website_name: { type: String, required: true, unique: false },
  bank_name: { type: String, required: true, unique: false },
  transaction_type: { type: String, required: true },
  amount: { type: Number, require: true },
  new_bank_balance: { type: Number, require: true },
  new_website_balance: { type: Number, require: true },
  first_check: { type: Boolean, default: false },
  re_check: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  ttlExpiresAt: { type: Date, expires: "3600s" },
});

const Transaction =
  mongoose.models.website || mongoose.model("website", transactionSchema);
export default Transaction;
