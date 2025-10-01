import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  user_name: {
    type: String,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  website_name: {
    type: String,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  bank_name: {
    type: String,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  username: {
    type: String,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  transaction_type: { type: String },
  amount: { type: Number },
  old_bank_balance: { type: Number },
  effective_balance: { type: Number },
  old_website_balance: { type: Number },
  new_website_balance: { type: Number },
  check: { type: Boolean, default: false },
  re_check: { type: Boolean, default: false },
  created_by: {
    type: String,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  group: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Transaction =
  mongoose.models.transactions ||
  mongoose.model("transactions", transactionSchema);
export default Transaction;
