import { Schema } from "mongoose";

const transactionSchema = new Schema({
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
  createdAt: { type: Date, default: Date.now },
});

export function getTransactionModel(conn) {
  return (
    conn.models.transactions || conn.model("transactions", transactionSchema)
  );
}

export default getTransactionModel;
