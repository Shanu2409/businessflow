import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user_name: { type: String },
  website_name: { type: String },
  bank_name: { type: String },
  username: { type: String },
  transaction_type: { type: String },
  amount: { type: Number },
  old_bank_balance: { type: Number },
  effective_balance: { type: Number },
  old_website_balance: { type: Number },
  new_website_balance: { type: Number },
  check: { type: Boolean, default: false },
  re_check: { type: Boolean, default: false },
  created_by: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Transaction =
  mongoose.models.transactions ||
  mongoose.model("transactions", transactionSchema);
export default Transaction;
