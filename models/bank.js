import mongoose from "mongoose";

const bankSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  bank_name: { type: String, required: true, unique: true },
  ifsc_code: { type: String, required: true },
  current_balance: { type: Number, default: true },
  createdAt: { type: Date, default: Date.now },
  ttlExpiresAt: { type: Date, expires: "3600s" },
});

const Bank = mongoose.models.bank || mongoose.model("bank", bankSchema);
export default Bank;
