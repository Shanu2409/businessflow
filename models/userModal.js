import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  website_name: {
    type: String,
    required: false,
    unique: false,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  email: { type: String, required: false },
  active: { type: Boolean, default: true },
  created_by: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

const UserModal =
  mongoose.models.userClient || mongoose.model("userClient", userSchema);
export default UserModal;
