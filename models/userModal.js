import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  website_name: {
    type: String,
    required: false,
    set: (value) => (value ? value.toUpperCase() : value),
  },
  email: { type: String, required: false },
  active: { type: Boolean, default: true },
  created_by: { type: String, default: "user" },
  group: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.index({ username: 1, created_by: 1, group: 1 }, { unique: true });

const UserModal =
  mongoose.models.userClient || mongoose.model("userClient", userSchema);
export default UserModal;
