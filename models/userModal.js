import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  website_name: { type: String, required: false, unique: false },
  email: { type: String, required: false },
  current_balance: { type: Number, default: 0.0 },
  active: { type: Boolean, default: true },
  created_by: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

const UserModal =
  mongoose.models.userClient || mongoose.model("userClient", userSchema);
export default UserModal;
