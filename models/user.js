import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, require: false },
  active: { type: Boolean, default: true },
  type: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.models.user || mongoose.model("user", userSchema);
export default User;
