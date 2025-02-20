import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, require: false },
  active: { type: Boolean, default: true },
  type: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
  ttlExpiresAt: { type: Date, expires: "3600s" }, // TTL expires after 60 seconds
});

const User = mongoose.models.user || mongoose.model("user", userSchema);
export default User;
