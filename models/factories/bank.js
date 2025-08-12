import { Schema } from "mongoose";

const bankSchema = new Schema({
  bank_name: {
    type: String,
    unique: true,
    required: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  ifsc_code: {
    type: String,
    required: false,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  check: { type: Boolean, default: false, required: true },
  account_number: { type: String, required: true },
  current_balance: { type: Number, default: 0.0 },
  created_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export function getBankModel(conn) {
  return conn.models.bank || conn.model("bank", bankSchema);
}

export default getBankModel;
